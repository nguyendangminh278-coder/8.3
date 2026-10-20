import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import sharp from 'sharp';

const ROOT = process.cwd();
const SOURCE_FILE = path.join(ROOT, 'scripts', 'canva-page-sources.json');
const OUT = path.join(ROOT, 'assets', 'pages');
const source = JSON.parse(await fs.readFile(SOURCE_FILE, 'utf8'));

if (!Array.isArray(source.pages) || source.pages.length !== 14) {
  throw new Error(`Expected 14 Canva page sources, got ${source.pages?.length ?? 0}`);
}

await fs.mkdir(OUT, { recursive: true });

async function fetchImage(url, label, timeoutMs = 10_000) {
  const response = await fetch(url, {
    redirect: 'follow',
    signal: AbortSignal.timeout(timeoutMs),
    headers: {
      'user-agent': 'Mozilla/5.0 AppleWebKit/537.36 Chrome/131 Safari/537.36',
      'accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
    },
  });

  if (!response.ok) throw new Error(`${label}: HTTP ${response.status} ${response.statusText}`);
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.startsWith('image/')) {
    const preview = (await response.text()).slice(0, 240).replace(/\s+/g, ' ');
    throw new Error(`${label}: expected image, got ${contentType}: ${preview}`);
  }
  return Buffer.from(await response.arrayBuffer());
}

function makeHiResMediaUrl(primary) {
  return primary
    .replace('/height:596/', '/height:1600/')
    .replace('/width:335?', '/width:900?');
}

let hiResMediaAvailable = null;

async function fetchCanvaPreview(entry, number) {
  const primary = entry.url;
  const fallback = new URL(primary).searchParams.get('fallback');
  const hiRes = makeHiResMediaUrl(primary);
  const errors = [];

  if (hiResMediaAvailable !== false) {
    try {
      console.log('  trying 900x1600 Canva media render...');
      const buffer = await fetchImage(hiRes, `Page ${number} hi-res`, 8_000);
      const meta = await sharp(buffer).metadata();
      if ((meta.width ?? 0) >= 800 && (meta.height ?? 0) >= 1400) {
        hiResMediaAvailable = true;
        return { buffer, sourceKind: 'canva-media-900x1600' };
      }
      throw new Error(`hi-res endpoint returned ${meta.width}x${meta.height}`);
    } catch (error) {
      errors.push(error?.message || String(error));
      console.warn(`  hi-res source unavailable: ${errors.at(-1)}`);
      if (entry.page === 1) hiResMediaAvailable = false;
    }
  }

  for (const [kind, url] of [
    ['canva-export-fallback', fallback],
    ['canva-media-thumbnail', primary],
  ]) {
    if (!url) continue;
    try {
      console.log(`  trying ${kind}...`);
      return { buffer: await fetchImage(url, `Page ${number}`, 12_000), sourceKind: kind };
    } catch (error) {
      errors.push(error?.message || String(error));
      console.warn(`  source failed: ${errors.at(-1)}`);
    }
  }

  throw new Error(`Page ${number}: all preview sources failed: ${errors.join(' | ')}`);
}

const checksums = [];
const metadata = [];
let previousProbe = null;

for (const entry of source.pages) {
  const number = String(entry.page).padStart(2, '0');
  console.log(`fetching Canva page ${number}...`);
  const { buffer: input, sourceKind } = await fetchCanvaPreview(entry, number);
  const inputMeta = await sharp(input).metadata();

  if ((inputMeta.width ?? 0) < 300 || (inputMeta.height ?? 0) < 500) {
    throw new Error(`Page ${number}: unexpected source dimensions ${inputMeta.width}x${inputMeta.height}`);
  }

  const webp = await sharp(input)
    .resize(900, 1600, { fit: 'fill', kernel: sharp.kernel.lanczos3 })
    .webp({ quality: 95, effort: 5, smartSubsample: true })
    .toBuffer();

  const outputStats = await sharp(webp).stats();
  const probe = await sharp(webp)
    .resize(90, 160, { fit: 'fill' })
    .removeAlpha()
    .raw()
    .toBuffer();

  let meanAbsDiffFromPrevious = null;
  if (previousProbe) {
    let sum = 0;
    for (let i = 0; i < probe.length; i += 1) sum += Math.abs(probe[i] - previousProbe[i]);
    meanAbsDiffFromPrevious = Number((sum / probe.length).toFixed(3));
  }
  previousProbe = probe;

  const sha256 = crypto.createHash('sha256').update(webp).digest('hex');
  const target = path.join(OUT, `${number}.webp`);
  await fs.writeFile(target, webp);

  checksums.push(`${number} ${sha256}`);
  metadata.push({
    page: entry.page,
    pageId: entry.id,
    sourceKind,
    sourceWidth: inputMeta.width,
    sourceHeight: inputMeta.height,
    sourceFormat: inputMeta.format,
    sourceBytes: input.length,
    outputBytes: webp.length,
    sha256,
    entropy: Number(outputStats.entropy.toFixed(4)),
    sharpness: Number(outputStats.sharpness.toFixed(4)),
    dominant: outputStats.dominant,
    meanAbsDiffFromPrevious,
  });

  console.log(
    `saved ${target} from ${sourceKind} ${inputMeta.width}x${inputMeta.height} ${inputMeta.format}; ` +
    `entropy=${outputStats.entropy.toFixed(3)} diff=${meanAbsDiffFromPrevious ?? 'n/a'}`
  );
}

const meaningfulDiffs = metadata
  .slice(1)
  .map((p) => p.meanAbsDiffFromPrevious)
  .filter((v) => typeof v === 'number' && v > 3);
if (meaningfulDiffs.length < 5) {
  throw new Error('Canva page validation failed: page previews are too similar to be the real 14-page design.');
}

await fs.writeFile(path.join(OUT, 'checksums.txt'), `${checksums.join('\n')}\n`, 'utf8');
await fs.writeFile(
  path.join(OUT, 'snapshot-metadata.json'),
  `${JSON.stringify({
    source: 'Canva page thumbnails via connected Canva design',
    designId: source.designId,
    canvaVersion: source.generatedFromCanvaVersion,
    capturedAt: new Date().toISOString(),
    hiResMediaAvailable,
    pages: metadata,
  }, null, 2)}\n`,
  'utf8'
);

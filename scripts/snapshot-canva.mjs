import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import sharp from 'sharp';

const DESIGN_ID = 'DAHYdLjF2Pw';
const PAGE_COUNT = 14;
const OUT = path.resolve('assets/pages');
const EMBED = `https://www.canva.com/design/${DESIGN_ID}/view?embed`;

await fs.mkdir(OUT, { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 900, height: 1600 },
  deviceScaleFactor: 1,
  locale: 'vi-VN',
  colorScheme: 'light',
  reducedMotion: 'reduce',
});
const page = await context.newPage();

await page.goto(EMBED, { waitUntil: 'domcontentloaded', timeout: 120_000 });
await page.waitForTimeout(6_000);

for (const selector of [
  'button:has-text("Accept all cookies")',
  'button:has-text("Accept")',
  'button:has-text("Cho phép tất cả")',
  'button:has-text("Đồng ý")',
]) {
  const button = page.locator(selector).first();
  if (await button.isVisible().catch(() => false)) {
    await button.click({ timeout: 2_000 }).catch(() => {});
    await page.waitForTimeout(500);
  }
}

const pageText = (await page.locator('body').innerText().catch(() => '')).trim();
console.log('Canva URL:', page.url());
console.log('Canva body text sample:', pageText.slice(0, 800).replace(/\s+/g, ' '));

const hashes = [];
const metadata = [];
let previousProbe = null;

for (let i = 1; i <= PAGE_COUNT; i += 1) {
  await page.waitForTimeout(i === 1 ? 1_000 : 900);

  const png = await page.screenshot({
    fullPage: false,
    animations: 'disabled',
    type: 'png',
  });

  const webp = await sharp(png)
    .resize(900, 1600, { fit: 'cover', position: 'centre' })
    .webp({ quality: 94, effort: 6 })
    .toBuffer();

  const stats = await sharp(webp).stats();
  const probe = await sharp(webp)
    .resize(90, 160, { fit: 'fill' })
    .removeAlpha()
    .raw()
    .toBuffer();

  let meanAbsDiffFromPrevious = null;
  if (previousProbe) {
    let sum = 0;
    for (let p = 0; p < probe.length; p += 1) {
      sum += Math.abs(probe[p] - previousProbe[p]);
    }
    meanAbsDiffFromPrevious = Number((sum / probe.length).toFixed(3));
  }
  previousProbe = probe;

  const number = String(i).padStart(2, '0');
  const target = path.join(OUT, `${number}.webp`);
  const sha256 = crypto.createHash('sha256').update(webp).digest('hex');
  await fs.writeFile(target, webp);
  hashes.push(`${number} ${sha256}`);

  metadata.push({
    page: i,
    bytes: webp.length,
    sha256,
    entropy: Number(stats.entropy.toFixed(4)),
    sharpness: Number(stats.sharpness.toFixed(4)),
    dominant: stats.dominant,
    meanAbsDiffFromPrevious,
  });

  console.log(
    `saved ${target} | bytes=${webp.length} entropy=${stats.entropy.toFixed(3)} ` +
    `diff=${meanAbsDiffFromPrevious ?? 'n/a'}`
  );

  if (i < PAGE_COUNT) {
    await page.keyboard.press('ArrowRight');
  }
}

await fs.writeFile(path.join(OUT, 'checksums.txt'), `${hashes.join('\n')}\n`, 'utf8');
await fs.writeFile(
  path.join(OUT, 'snapshot-metadata.json'),
  `${JSON.stringify({ source: EMBED, capturedAt: new Date().toISOString(), pageTextSample: pageText.slice(0, 1200), pages: metadata }, null, 2)}\n`,
  'utf8'
);
await browser.close();

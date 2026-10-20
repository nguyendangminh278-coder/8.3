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

// Canva can be visually ready after networkidle while fonts/images are still settling.
await page.goto(EMBED, { waitUntil: 'domcontentloaded', timeout: 120_000 });
await page.waitForTimeout(6_000);

// Remove only browser-like overlays/cookie prompts when present. We intentionally do
// not alter the design canvas itself.
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

const hashes = [];
for (let i = 1; i <= PAGE_COUNT; i += 1) {
  await page.waitForTimeout(i === 1 ? 1_000 : 900);

  const png = await page.screenshot({
    fullPage: false,
    animations: 'disabled',
    type: 'png',
  });

  // The Canva source is 900x1600. Save high-quality webp for the actual website,
  // while preserving the exact 9:16 layout.
  const webp = await sharp(png)
    .resize(900, 1600, { fit: 'cover', position: 'centre' })
    .webp({ quality: 94, effort: 6 })
    .toBuffer();

  const number = String(i).padStart(2, '0');
  const target = path.join(OUT, `${number}.webp`);
  await fs.writeFile(target, webp);
  hashes.push(`${number} ${crypto.createHash('sha256').update(webp).digest('hex')}`);
  console.log(`saved ${target}`);

  if (i < PAGE_COUNT) {
    await page.keyboard.press('ArrowRight');
  }
}

await fs.writeFile(path.join(OUT, 'checksums.txt'), `${hashes.join('\n')}\n`, 'utf8');
await browser.close();

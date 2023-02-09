/**
 * Capture the screenshots in docs/screenshots/.
 *
 *   npm run build && npx serve -s build -l 8541   # or: npm start
 *   node scripts/capture-screenshots.mjs http://localhost:8541
 *
 * The backend is never contacted. Every /api/v1 request is fulfilled from
 * src/test/seed.json -- the same rows the test suite asserts against and the
 * same rows `rails db:seed` creates in the API repo -- so the shots are
 * deterministic, fully populated and re-capturable by anyone.
 */

import { mkdir } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import sharp from 'sharp';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(HERE, '..', 'docs', 'screenshots');
const BASE = process.argv[2] || 'http://localhost:3000';
const VIEWPORT = { width: 1440, height: 900 };

const seed = JSON.parse(readFileSync(resolve(HERE, '..', 'src', 'test', 'seed.json'), 'utf8'));

const envelope = (resource, records) => ({
  [resource]: records,
  meta: { page: 1, per_page: 100, total_count: records.length, total_pages: 1 },
});

const json = (route, body, status = 200) =>
  route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });

async function main() {
  await mkdir(OUT, { recursive: true });

  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: 1 });
  const page = await context.newPage();

  await page.route('**/api/v1/items**', (route) =>
    route.request().method() === 'GET'
      ? json(route, envelope('items', seed.items))
      : json(route, seed.items[0], 201)
  );
  await page.route('**/api/v1/discounts**', (route) =>
    json(route, envelope('discounts', seed.discounts))
  );
  await page.route('**/api/v1/customers**', (route) =>
    json(route, envelope('customers', seed.customers))
  );
  await page.route('**/api/v1/orders**', (route) => json(route, seed.placedOrder, 201));

  // Screenshots of a photographic page run to half a megabyte of true colour
  // PNG. A 256-colour palette is visually indistinguishable at this size and
  // keeps the repository light, so the bytes that land in git are quantized.
  const shot = async (name) => {
    await page.waitForTimeout(350);
    const raw = await page.screenshot();
    const file = resolve(OUT, `${name}.png`);
    const { size } = await sharp(raw).png({ palette: true, effort: 10 }).toFile(file);
    console.log(`captured docs/screenshots/${name}.png (${Math.round(size / 1024)} KB)`);
  };

  // 1. The shop front: menu preview and the paired offers that are running.
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
  await page.getByText('Butter Croissant + Flat White').waitFor();
  await shot('home');

  // 2. The menu, with tax, stock and the offer attached to each item.
  await page.goto(`${BASE}/items`, { waitUntil: 'networkidle' });
  await page.getByRole('article', { name: 'Avocado Sourdough' }).waitFor();
  await shot('menu');

  // 3. The till, mid-order, with the discount already showing in the total.
  await page.goto(`${BASE}/order`, { waitUntil: 'networkidle' });
  await page.getByLabel('Name').fill('Ada Lovelace');
  await page.getByLabel('Email').fill('ada@example.com');
  await page.getByLabel('Item').selectOption('2');
  await page.getByLabel('Quantity').fill('1');
  await page.getByRole('button', { name: /add another item/i }).click();
  await page.getByLabel('Item').nth(1).selectOption('4');
  await page.getByLabel('Quantity').nth(1).fill('1');
  await page.getByText('$6.78').waitFor();
  await shot('order-with-discount');

  // 4. The receipt the API returned.
  await page.getByRole('button', { name: /place order/i }).click();
  await page.getByRole('dialog').waitFor();
  await shot('order-confirmed');

  await browser.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

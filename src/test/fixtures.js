import seed from './seed.json';

/**
 * The menu the test suite and the screenshot script both run against.
 *
 * These are the rows `rails db:seed` creates in the sibling API repo
 * (`agnos-coffee-shop-be/db/seeds.rb`). They live in `seed.json` rather than
 * in this module so `scripts/capture-screenshots.mjs`, which runs outside the
 * webpack build, can read exactly the same data -- the screenshots in
 * `docs/screenshots/` and the assertions in the suite cannot drift apart.
 */

export const ITEMS = seed.items;

/** item_id is the item that gets cheaper; discount_with_item_id must also be in the basket. */
export const DISCOUNTS = seed.discounts;

export const CUSTOMERS = seed.customers;

/** The order the API returns for a flat white and a croissant -- total 6.78. */
export const PLACED_ORDER = seed.placedOrder;

/**
 * The API's collection envelope: `{ <resource>: [...], meta: {...} }`.
 *
 * @param {string} resource
 * @param {object[]} records
 * @param {{ page?: number, perPage?: number }} [options]
 */
export function paginate(resource, records, { page = 1, perPage = 100 } = {}) {
  const start = (page - 1) * perPage;
  return {
    [resource]: records.slice(start, start + perPage),
    meta: {
      page,
      per_page: perPage,
      total_count: records.length,
      total_pages: Math.max(1, Math.ceil(records.length / perPage)),
    },
  };
}

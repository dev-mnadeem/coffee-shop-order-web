import { get } from './client';

/**
 * The API paginates every collection (25 rows by default) and returns
 * `{ <resource>: [...], meta: { page, per_page, total_count, total_pages } }`.
 *
 * The first version of this client sent no page parameters and read only the
 * array, so a menu with a 26th item silently lost it. These helpers make the
 * pagination explicit: `fetchPage` for a screen that shows one page,
 * `fetchAll` for the short, bounded collections the till needs in full
 * (the menu and the discount table) with a hard cap so a runaway API can
 * never spin the browser.
 */

export const MAX_PER_PAGE = 100;
export const MAX_PAGES = 20;

/**
 * @template T
 * @param {string} resource plural resource name, e.g. `items`
 * @param {{ page?: number, perPage?: number, signal?: AbortSignal }} [options]
 * @returns {Promise<{ records: T[], meta: { page: number, per_page: number, total_count: number, total_pages: number } }>}
 */
export async function fetchPage(resource, { page = 1, perPage = 25, signal } = {}) {
  const body = await get(`/${resource}`, {
    params: { page, per_page: Math.min(perPage, MAX_PER_PAGE) },
    signal,
  });
  return {
    records: Array.isArray(body && body[resource]) ? body[resource] : [],
    meta: (body && body.meta) || { page, per_page: perPage, total_count: 0, total_pages: 0 },
  };
}

/**
 * Every record in a collection, following `meta.total_pages`.
 *
 * @template T
 * @param {string} resource
 * @param {{ perPage?: number, signal?: AbortSignal }} [options]
 * @returns {Promise<T[]>}
 */
export async function fetchAll(resource, { perPage = MAX_PER_PAGE, signal } = {}) {
  const first = await fetchPage(resource, { page: 1, perPage, signal });
  const pages = Math.min(Number(first.meta.total_pages) || 1, MAX_PAGES);
  if (pages <= 1) return first.records;

  const rest = await Promise.all(
    Array.from({ length: pages - 1 }, (_, index) =>
      fetchPage(resource, { page: index + 2, perPage, signal })
    )
  );
  return rest.reduce((all, page) => all.concat(page.records), first.records);
}

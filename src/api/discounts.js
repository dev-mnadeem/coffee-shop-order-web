import { fetchAll } from './collection';

/**
 * Paired-item offers: "20% off a croissant when a flat white is in the same
 * order". The brief asks for them and the API exposes them at
 * `/api/v1/discounts`; the till reads them so it can show the saving before
 * the order is placed.
 *
 * @param {{ signal?: AbortSignal }} [options]
 * @returns {Promise<import('../domain/pricing').Discount[]>}
 */
export function listDiscounts(options) {
  return fetchAll('discounts', options);
}

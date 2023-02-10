import { post, del } from './client';
import { fetchAll } from './collection';

/**
 * The menu. Small and bounded -- a coffee shop has tens of items, not
 * thousands -- so the till loads it in full and prices baskets locally.
 */

/**
 * @param {{ signal?: AbortSignal }} [options]
 * @returns {Promise<import('../domain/pricing').Item[]>}
 */
export function listItems(options) {
  return fetchAll('items', options);
}

/**
 * @param {{ name: string, price: number|string, tax_rate: number|string, available_quantity?: number|string }} attributes
 * @returns {Promise<import('../domain/pricing').Item>}
 */
export function createItem(attributes) {
  return post('/items', attributes);
}

/**
 * @param {number} id
 * @returns {Promise<void>} resolves when the API has returned 204
 */
export function deleteItem(id) {
  return del(`/items/${id}`);
}

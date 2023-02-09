import { fetchPage } from './collection';

/**
 * Customers accumulate for as long as the shop is open, so this is the one
 * collection the UI pages through rather than loading whole.
 *
 * @param {{ page?: number, perPage?: number, signal?: AbortSignal }} [options]
 * @returns {Promise<{ records: { id: number, name: string, email: string }[], meta: object }>}
 */
export function listCustomers(options) {
  return fetchPage('customers', options);
}

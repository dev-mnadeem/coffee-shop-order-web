import { post } from './client';

/**
 * Placing an order. The API resolves (or creates) the customer, takes stock,
 * prices the basket and schedules the confirmation email, so this is a single
 * POST with the customer and the lines in one body.
 *
 * @param {{ customer: { name: string, email: string }, order_items: { item_id: number|string, quantity: number|string }[] }} order
 * @returns {Promise<{ id: number, total_amount: number, created_at: string, customer: object, items: object[] }>}
 */
export function createOrder(order) {
  return post('/orders', {
    customer: order.customer,
    order_items: order.order_items.map((line) => ({
      item_id: Number(line.item_id),
      quantity: Number(line.quantity),
    })),
  });
}

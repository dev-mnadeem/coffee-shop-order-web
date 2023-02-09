/**
 * Stock check for the order form.
 *
 * The API refuses an order that asks for more than `available_quantity`, but
 * only after the cashier has pressed "Place order". Checking here as well lets
 * the form point at the line that is over. Quantities are summed per item, so
 * two lines of the same croissant are checked against one shelf.
 *
 * @param {{ item_id: number|string, quantity: number|string }[]} rows
 * @param {import('./pricing').Item[]} items
 * @returns {{ order_items?: ({ quantity: string }|undefined)[] }} Formik-shaped errors
 */
export function stockErrors(rows, items) {
  const byId = new Map(items.map((item) => [Number(item.id), item]));
  const requested = new Map();
  rows.forEach((row) => {
    const id = Number(row.item_id);
    const quantity = Number(row.quantity);
    if (byId.has(id) && Number.isFinite(quantity) && quantity > 0) {
      requested.set(id, (requested.get(id) || 0) + quantity);
    }
  });

  const lineErrors = rows.map((row) => {
    const item = byId.get(Number(row.item_id));
    if (!item) return undefined;
    const stock = Number(item.available_quantity);
    if (!Number.isFinite(stock) || (requested.get(Number(item.id)) || 0) <= stock) return undefined;
    return {
      quantity: stock <= 0 ? `${item.name} is sold out` : `Only ${stock} ${item.name} left`,
    };
  });

  return lineErrors.some(Boolean) ? { order_items: lineErrors } : {};
}

import { PERCENT_BASE } from '../money';

/**
 * "Buy a flat white with a croissant and the croissant is 20% off."
 *
 * At most one discount is applied per line -- the first match wins -- which
 * keeps the total deterministic when an item carries several paired offers.
 * Mirrors `Pricing::Rules::PairedItemDiscount` in the API.
 *
 * @param {import('../pricing').Discount[]} discounts every paired offer on the menu
 * @returns {import('./types').PricingRule}
 */
export function createPairedDiscountRule(discounts = []) {
  return {
    name: 'paired-discount',
    apply(unitPrice, line, basket) {
      const match = findDiscount(discounts, line.item.id, basket);
      if (!match) return unitPrice;
      const percentage = Number(match.percentage) || 0;
      return unitPrice - unitPrice * (percentage / PERCENT_BASE);
    },
  };
}

/**
 * The offer that applies to `itemId` given what else is in the basket.
 *
 * @param {import('../pricing').Discount[]} discounts
 * @param {number} itemId
 * @param {{ hasItem: (id: number) => boolean }} basket
 * @returns {import('../pricing').Discount|undefined}
 */
export function findDiscount(discounts, itemId, basket) {
  return discounts.find(
    (discount) =>
      Number(discount.item_id) === Number(itemId) &&
      basket.hasItem(Number(discount.discount_with_item_id))
  );
}

export default createPairedDiscountRule;

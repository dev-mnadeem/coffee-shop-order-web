import { PERCENT_BASE } from '../money';

/**
 * Adds the item's own tax rate to its unit price.
 *
 * Tax is per item rather than one shop-wide rate, because a coffee and a
 * takeaway sandwich are usually taxed differently. Mirrors
 * `Pricing::Rules::Tax` in the API.
 *
 * @type {import('./types').PricingRule}
 */
export const taxRule = {
  name: 'tax',
  apply(unitPrice, line) {
    const rate = Number(line.item.tax_rate) || 0;
    return unitPrice + unitPrice * (rate / PERCENT_BASE);
  },
};

export default taxRule;

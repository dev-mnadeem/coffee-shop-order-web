import { roundMoney } from './money';
import taxRule from './rules/tax';
import { createPairedDiscountRule, findDiscount } from './rules/pairedDiscount';

/**
 * Client-side pricing, mirroring `Pricing::Calculator` in the Rails API.
 *
 * The till needs a running total *before* the order is posted, and the only
 * honest way to show one is to run the same rules the server runs. Pricing is
 * a pipeline: each rule takes the running unit price and returns a new one, in
 * order. Adding an offer -- happy hour, loyalty tier, buy-one-get-one -- means
 * writing one object with an `apply` method and putting it in the list. Nothing
 * else changes.
 *
 * Order matters and matches the server: tax is added to the shelf price first,
 * then the paired discount comes off the taxed figure.
 *
 * The server's total remains authoritative. This preview exists so the cashier
 * is not typing blind, and `docs/` records the one place the two can differ.
 *
 * @typedef {object} Item
 * @property {number} id
 * @property {string} name
 * @property {number|string} price
 * @property {number|string} tax_rate
 * @property {number} [available_quantity]
 *
 * @typedef {object} Discount
 * @property {number} id
 * @property {number} item_id the item whose price comes down
 * @property {number} discount_with_item_id the item that must also be in the basket
 * @property {number|string} percentage
 */

/** @type {import('./rules/types').PricingRule[]} */
export const DEFAULT_RULES = [taxRule];

/**
 * Build a pricing engine from an ordered list of rules.
 *
 * @param {import('./rules/types').PricingRule[]} [rules]
 * @returns {{ rules: import('./rules/types').PricingRule[], quote: (lines: import('./rules/types').BasketLine[]) => Quote }}
 */
export function createPricingEngine(rules = DEFAULT_RULES) {
  return {
    rules,
    quote(lines) {
      const basket = createBasket(lines);
      const priced = basket.lines.map((line) => priceLine(line, basket, rules));
      return {
        lines: priced,
        subtotal: sum(priced.map((line) => line.shelfSubtotal)),
        tax: sum(priced.map((line) => line.taxSubtotal)),
        discount: sum(priced.map((line) => line.discountSubtotal)),
        total: sum(priced.map((line) => line.subtotal)),
      };
    },
  };
}

/**
 * The engine the app uses: tax, then paired discounts read from the API.
 *
 * @param {Discount[]} [discounts]
 */
export function createMenuPricingEngine(discounts = []) {
  return createPricingEngine([taxRule, createPairedDiscountRule(discounts)]);
}

/**
 * The read-only context a rule may look at. Rules ask the basket questions
 * ("is item 7 also in this order?") rather than reaching for the API.
 *
 * @param {import('./rules/types').BasketLine[]} lines
 * @returns {import('./rules/types').Basket}
 */
export function createBasket(lines) {
  const valid = lines.filter((line) => line && line.item && Number(line.quantity) > 0);
  const ids = new Set(valid.map((line) => Number(line.item.id)));
  return {
    lines: valid,
    hasItem: (itemId) => ids.has(Number(itemId)),
  };
}

/**
 * Turn the order form's raw `{ item_id, quantity }` rows into basket lines,
 * dropping anything that does not resolve to a menu item.
 *
 * @param {{ item_id: number|string, quantity: number|string }[]} rows
 * @param {Item[]} items
 * @returns {import('./rules/types').BasketLine[]}
 */
export function toBasketLines(rows, items) {
  const byId = new Map(items.map((item) => [Number(item.id), item]));
  return rows
    .map((row) => ({ item: byId.get(Number(row.item_id)), quantity: Number(row.quantity) }))
    .filter((line) => line.item && Number.isFinite(line.quantity) && line.quantity > 0);
}

/**
 * The offers that are live for this basket, for display next to the total.
 *
 * @param {import('./rules/types').BasketLine[]} lines
 * @param {Discount[]} discounts
 * @param {Item[]} items
 */
export function activeDiscounts(lines, discounts, items) {
  const basket = createBasket(lines);
  const byId = new Map(items.map((item) => [Number(item.id), item]));
  return basket.lines
    .map((line) => {
      const discount = findDiscount(discounts, line.item.id, basket);
      if (!discount) return null;
      return {
        discount,
        item: line.item,
        pairedWith: byId.get(Number(discount.discount_with_item_id)),
      };
    })
    .filter(Boolean);
}

/**
 * @typedef {object} QuoteLine
 * @property {number} itemId
 * @property {string} name
 * @property {number} quantity
 * @property {number} unitPrice   price after every rule, per unit
 * @property {number} subtotal    what this line adds to the total
 * @property {number} shelfSubtotal  before tax and discount
 * @property {number} taxSubtotal
 * @property {number} discountSubtotal  negative or zero
 *
 * @typedef {object} Quote
 * @property {QuoteLine[]} lines
 * @property {number} subtotal
 * @property {number} tax
 * @property {number} discount
 * @property {number} total
 */

/**
 * @param {import('./rules/types').BasketLine} line
 * @param {import('./rules/types').Basket} basket
 * @param {import('./rules/types').PricingRule[]} rules
 * @returns {QuoteLine}
 */
function priceLine(line, basket, rules) {
  const shelfPrice = Number(line.item.price) || 0;
  const quantity = Number(line.quantity) || 0;

  let running = shelfPrice;
  let taxed = shelfPrice;
  rules.forEach((rule) => {
    running = rule.apply(running, line, basket);
    if (rule.name === 'tax') taxed = running;
  });

  // The server rounds the unit price for display but multiplies the unrounded
  // figure by the quantity before rounding the line, so two espressos at 2.625
  // come to 5.25 and not 5.26. Mirrored here rather than "fixed", because the
  // customer is charged what the server computes.
  return {
    itemId: Number(line.item.id),
    name: line.item.name,
    quantity,
    unitPrice: roundMoney(running),
    subtotal: roundMoney(running * quantity),
    shelfSubtotal: roundMoney(shelfPrice * quantity),
    taxSubtotal: roundMoney((taxed - shelfPrice) * quantity),
    discountSubtotal: roundMoney((running - taxed) * quantity),
  };
}

/** @param {number[]} amounts */
function sum(amounts) {
  return roundMoney(amounts.reduce((total, amount) => total + amount, 0));
}

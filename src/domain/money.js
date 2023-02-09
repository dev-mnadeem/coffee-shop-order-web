/**
 * Money helpers.
 *
 * Every figure the till shows is rounded to whole cents with the same
 * half-up rule the Rails API uses (`BigDecimal#round(2)`), so a total
 * previewed in the browser matches the total the server charges.
 */

export const CURRENCY_PRECISION = 2;
export const PERCENT_BASE = 100;

const FACTOR = 10 ** CURRENCY_PRECISION;

/**
 * Round to whole cents, half away from zero.
 *
 * The nudge is a *relative* epsilon, not a fixed one. Decimal prices are not
 * exactly representable in binary -- 1.005 is stored as 1.00499999999999989 --
 * so a naive `Math.round(value * 100)` rounds a genuine half-cent down. Scaling
 * the epsilon with the magnitude of the value corrects that without moving any
 * figure that is not already within representation error of a boundary.
 *
 * @param {number} amount
 * @returns {number}
 */
export function roundMoney(amount) {
  const value = Number(amount);
  if (!Number.isFinite(value)) return 0;
  const sign = value < 0 ? -1 : 1;
  const scaled = Math.abs(value) * FACTOR;
  return (sign * Math.round(scaled + scaled * Number.EPSILON)) / FACTOR;
}

/**
 * Format an amount for display. The API is currency-agnostic -- it returns
 * bare decimals -- so the symbol lives here and nowhere else.
 *
 * @param {number|string} amount
 * @param {string} [currency] ISO 4217 code
 * @returns {string}
 */
export function formatMoney(amount, currency = 'USD') {
  const value = Number(amount);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: CURRENCY_PRECISION,
  }).format(Number.isFinite(value) ? value : 0);
}

/**
 * Format a tax or discount rate the API sends as a bare number (5.0 -> "5%").
 *
 * @param {number|string} rate
 * @returns {string}
 */
export function formatRate(rate) {
  const value = Number(rate);
  if (!Number.isFinite(value)) return '0%';
  return `${Number(value.toFixed(2))}%`;
}

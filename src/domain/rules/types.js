/**
 * Shared type definitions for the pricing pipeline. This module exports no
 * runtime value; it exists so editors and `checkJs` can resolve the shapes
 * the rules and the engine pass between them.
 *
 * @typedef {object} PricingRule
 * @property {string} name Stable identifier, used in the line breakdown.
 * @property {(unitPrice: number, line: BasketLine, basket: Basket) => number} apply
 *
 * @typedef {object} BasketLine
 * @property {import('../pricing').Item} item
 * @property {number} quantity
 *
 * @typedef {object} Basket
 * @property {BasketLine[]} lines
 * @property {(itemId: number) => boolean} hasItem
 */

export {};

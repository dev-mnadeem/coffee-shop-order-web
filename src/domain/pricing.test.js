import {
  activeDiscounts,
  createMenuPricingEngine,
  createPricingEngine,
  toBasketLines,
} from './pricing';
import taxRule from './rules/tax';
import { DISCOUNTS, ITEMS } from '../test/fixtures';

const espresso = ITEMS[0];
const flatWhite = ITEMS[1];
const croissant = ITEMS[3];

const engine = createMenuPricingEngine(DISCOUNTS);

describe('pricing, against the figures the API publishes', () => {
  it('prices a flat white and a croissant at 6.78, discount included', () => {
    // docs in agnos-coffee-shop-be: 3.80 +5% = 3.99, 3.10 +12.5% = 3.4875,
    // then 20% off because a flat white is in the basket = 2.79.
    const quote = engine.quote([
      { item: flatWhite, quantity: 1 },
      { item: croissant, quantity: 1 },
    ]);

    expect(quote.lines[0].subtotal).toBe(3.99);
    expect(quote.lines[1].subtotal).toBe(2.79);
    expect(quote.total).toBe(6.78);
  });

  it('prices two espressos at 5.25, matching the server line rounding', () => {
    // The unrounded unit price (2.625) is multiplied by the quantity before
    // rounding, so the line is 5.25 and not 2.63 x 2 = 5.26.
    const quote = engine.quote([{ item: espresso, quantity: 2 }]);

    expect(quote.lines[0].unitPrice).toBe(2.63);
    expect(quote.lines[0].subtotal).toBe(5.25);
    expect(quote.total).toBe(5.25);
  });

  it('does not apply a paired discount when the partner item is absent', () => {
    const quote = engine.quote([{ item: croissant, quantity: 1 }]);

    expect(quote.lines[0].subtotal).toBe(3.49);
    expect(quote.discount).toBe(0);
  });

  it('splits the total into shelf price, tax and saving', () => {
    const quote = engine.quote([
      { item: flatWhite, quantity: 1 },
      { item: croissant, quantity: 1 },
    ]);

    expect(quote.subtotal).toBe(6.9);
    expect(quote.tax).toBe(0.58);
    expect(quote.discount).toBe(-0.7);
    expect(quote.subtotal + quote.tax + quote.discount).toBeCloseTo(quote.total, 2);
  });

  it('ignores lines with no item or no quantity', () => {
    const quote = engine.quote([
      { item: flatWhite, quantity: 0 },
      { item: undefined, quantity: 3 },
      { item: espresso, quantity: 1 },
    ]);

    expect(quote.lines).toHaveLength(1);
    expect(quote.total).toBe(2.63);
  });
});

describe('the rule pipeline is the extension point', () => {
  it('runs rules in order and lets a new one join without touching the others', () => {
    const loyaltyRule = { name: 'loyalty', apply: (price) => price * 0.9 };
    const withLoyalty = createPricingEngine([taxRule, loyaltyRule]);

    const quote = withLoyalty.quote([{ item: flatWhite, quantity: 1 }]);

    expect(quote.total).toBe(3.59); // 3.80 +5% = 3.99, then 10% off
  });

  it('with no discount rule, the same basket is priced at full price', () => {
    const taxOnly = createPricingEngine([taxRule]);

    const quote = taxOnly.quote([
      { item: flatWhite, quantity: 1 },
      { item: croissant, quantity: 1 },
    ]);

    expect(quote.total).toBe(7.48);
  });
});

describe('toBasketLines', () => {
  it('resolves form rows against the menu and drops the unusable ones', () => {
    const lines = toBasketLines(
      [
        { item_id: '2', quantity: '1' },
        { item_id: '', quantity: '2' },
        { item_id: '999', quantity: '1' },
        { item_id: '1', quantity: '0' },
      ],
      ITEMS
    );

    expect(lines).toHaveLength(1);
    expect(lines[0].item.name).toBe('Flat White');
    expect(lines[0].quantity).toBe(1);
  });
});

describe('activeDiscounts', () => {
  it('names the offer and the item that unlocked it', () => {
    const offers = activeDiscounts(
      [
        { item: flatWhite, quantity: 1 },
        { item: croissant, quantity: 1 },
      ],
      DISCOUNTS,
      ITEMS
    );

    expect(offers).toHaveLength(1);
    expect(offers[0].item.name).toBe('Butter Croissant');
    expect(offers[0].pairedWith.name).toBe('Flat White');
    expect(Number(offers[0].discount.percentage)).toBe(20);
  });

  it('is empty when nothing pairs', () => {
    expect(activeDiscounts([{ item: espresso, quantity: 1 }], DISCOUNTS, ITEMS)).toEqual([]);
  });
});

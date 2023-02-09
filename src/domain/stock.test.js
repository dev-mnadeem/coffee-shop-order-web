import { stockErrors } from './stock';
import { ITEMS } from '../test/fixtures';

const croissant = ITEMS[3]; // 40 in stock

describe('stockErrors', () => {
  it('passes a basket that fits on the shelf', () => {
    expect(stockErrors([{ item_id: croissant.id, quantity: 40 }], ITEMS)).toEqual({});
  });

  it('flags a line that asks for more than is left', () => {
    const errors = stockErrors([{ item_id: croissant.id, quantity: 41 }], ITEMS);
    expect(errors.order_items[0]).toEqual({ quantity: 'Only 40 Butter Croissant left' });
  });

  it('adds up two lines of the same item before comparing', () => {
    const errors = stockErrors(
      [
        { item_id: String(croissant.id), quantity: '30' },
        { item_id: ITEMS[0].id, quantity: 1 },
        { item_id: croissant.id, quantity: 11 },
      ],
      ITEMS
    );
    expect(errors.order_items[0]).toBeDefined();
    expect(errors.order_items[1]).toBeUndefined();
    expect(errors.order_items[2]).toBeDefined();
  });

  it('calls a zero-stock item sold out', () => {
    const soldOut = { ...croissant, available_quantity: 0 };
    const errors = stockErrors([{ item_id: croissant.id, quantity: 1 }], [soldOut]);
    expect(errors.order_items[0].quantity).toBe('Butter Croissant is sold out');
  });

  it('ignores unpicked lines and items without a stock figure', () => {
    const untracked = { ...croissant, available_quantity: undefined };
    expect(
      stockErrors(
        [
          { item_id: '', quantity: 5 },
          { item_id: croissant.id, quantity: 999 },
        ],
        [untracked]
      )
    ).toEqual({});
  });
});

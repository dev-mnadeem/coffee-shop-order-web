import { rest } from 'msw';
import { server } from '../test/server';
import { API } from '../test/handlers';
import { createOrder } from './orders';

describe('createOrder', () => {
  it('sends numeric ids and quantities, not the form’s strings', async () => {
    let body;
    server.use(
      rest.post(`${API}/orders`, async (req, res, ctx) => {
        body = await req.json();
        return res(ctx.status(201), ctx.json({ id: 1, total_amount: 6.78 }));
      })
    );

    await createOrder({
      customer: { name: 'Ada Lovelace', email: 'ada@example.com' },
      order_items: [{ item_id: '2', quantity: '1' }],
    });

    expect(body).toEqual({
      customer: { name: 'Ada Lovelace', email: 'ada@example.com' },
      order_items: [{ item_id: 2, quantity: 1 }],
    });
  });

  it('rejects with the API’s message when an item does not exist', async () => {
    server.use(
      rest.post(`${API}/orders`, (_req, res, ctx) =>
        res(ctx.status(422), ctx.json({ errors: ['Item 99 does not exist'] }))
      )
    );

    await expect(
      createOrder({
        customer: { name: 'Ada', email: 'ada@example.com' },
        order_items: [{ item_id: 99, quantity: 1 }],
      })
    ).rejects.toThrow('Item 99 does not exist');
  });
});

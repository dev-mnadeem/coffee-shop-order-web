import { http, HttpResponse } from 'msw';
import { server } from '../test/server';
import { API } from '../test/handlers';
import { createOrder } from './orders';

describe('createOrder', () => {
  it('sends numeric ids and quantities, not the form’s strings', async () => {
    let body;
    server.use(
      http.post(`${API}/orders`, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({ id: 1, total_amount: 6.78 }, { status: 201 });
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
      http.post(`${API}/orders`, () =>
        HttpResponse.json({ errors: ['Item 99 does not exist'] }, { status: 422 })
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

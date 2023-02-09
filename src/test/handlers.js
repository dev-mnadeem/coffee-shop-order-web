import { http, HttpResponse } from 'msw';
import { CUSTOMERS, DISCOUNTS, ITEMS, PLACED_ORDER, paginate } from './fixtures';

export const API = 'http://localhost:3001/api/v1';

/**
 * The happy path for every endpoint the app calls, shaped exactly like the
 * Rails API: paginated collections, a serialized order, and `{ errors: [...] }`
 * for anything that goes wrong.
 *
 * Tests that need a failure override a single handler with `server.use(...)`.
 */
export const handlers = [
  http.get(`${API}/items`, ({ request }) =>
    HttpResponse.json(paginate('items', ITEMS, readPageParams(request)))
  ),
  http.get(`${API}/discounts`, ({ request }) =>
    HttpResponse.json(paginate('discounts', DISCOUNTS, readPageParams(request)))
  ),
  http.get(`${API}/customers`, ({ request }) =>
    HttpResponse.json(paginate('customers', CUSTOMERS, readPageParams(request)))
  ),
  http.post(`${API}/items`, async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({ id: 99, ...body }, { status: 201 });
  }),
  http.delete(`${API}/items/:id`, () => new HttpResponse(null, { status: 204 })),
  http.post(`${API}/orders`, () => HttpResponse.json(PLACED_ORDER, { status: 201 })),
];

function readPageParams(request) {
  const params = new URL(request.url).searchParams;
  return {
    page: Number(params.get('page')) || 1,
    perPage: Number(params.get('per_page')) || 25,
  };
}

import { rest } from 'msw';
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
  rest.get(`${API}/items`, (req, res, ctx) =>
    res(ctx.status(200), ctx.json(paginate('items', ITEMS, readPageParams(req))))
  ),
  rest.get(`${API}/discounts`, (req, res, ctx) =>
    res(ctx.status(200), ctx.json(paginate('discounts', DISCOUNTS, readPageParams(req))))
  ),
  rest.get(`${API}/customers`, (req, res, ctx) =>
    res(ctx.status(200), ctx.json(paginate('customers', CUSTOMERS, readPageParams(req))))
  ),
  rest.post(`${API}/items`, async (req, res, ctx) => {
    const body = await req.json();
    return res(ctx.status(201), ctx.json({ id: 99, ...body }));
  }),
  rest.delete(`${API}/items/:id`, (_req, res, ctx) => res(ctx.status(204))),
  rest.post(`${API}/orders`, (_req, res, ctx) => res(ctx.status(201), ctx.json(PLACED_ORDER))),
];

function readPageParams(req) {
  return {
    page: Number(req.url.searchParams.get('page')) || 1,
    perPage: Number(req.url.searchParams.get('per_page')) || 25,
  };
}

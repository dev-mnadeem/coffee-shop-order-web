import { rest } from 'msw';
import { server } from '../test/server';
import { API } from '../test/handlers';
import { fetchAll, fetchPage } from './collection';
import { listItems } from './items';

describe('fetchPage', () => {
  it('sends the page parameters the API expects', async () => {
    const seen = [];
    server.use(
      rest.get(`${API}/customers`, (req, res, ctx) => {
        seen.push(req.url.search);
        return res(ctx.status(200), ctx.json({ customers: [], meta: { total_pages: 1 } }));
      })
    );

    await fetchPage('customers', { page: 3, perPage: 25 });

    expect(seen[0]).toContain('page=3');
    expect(seen[0]).toContain('per_page=25');
  });

  it('caps per_page so a caller cannot ask the API for everything at once', async () => {
    const seen = [];
    server.use(
      rest.get(`${API}/customers`, (req, res, ctx) => {
        seen.push(req.url.searchParams.get('per_page'));
        return res(ctx.status(200), ctx.json({ customers: [], meta: { total_pages: 1 } }));
      })
    );

    await fetchPage('customers', { perPage: 5000 });

    expect(seen[0]).toBe('100');
  });

  it('survives an envelope that does not carry the collection', async () => {
    server.use(
      rest.get(`${API}/customers`, (_req, res, ctx) => res(ctx.status(200), ctx.json({})))
    );

    const { records } = await fetchPage('customers');
    expect(records).toEqual([]);
  });
});

describe('fetchAll', () => {
  it('follows meta.total_pages instead of stopping at the first page', async () => {
    // The original client asked for /items with no parameters and read only the
    // array, so item 26 onwards silently vanished from the menu.
    const all = Array.from({ length: 30 }, (_, index) => ({
      id: index + 1,
      name: `Item ${index + 1}`,
    }));
    server.use(
      rest.get(`${API}/items`, (req, res, ctx) => {
        const page = Number(req.url.searchParams.get('page')) || 1;
        const perPage = 12;
        return res(
          ctx.status(200),
          ctx.json({
            items: all.slice((page - 1) * perPage, page * perPage),
            meta: { page, per_page: perPage, total_count: all.length, total_pages: 3 },
          })
        );
      })
    );

    const items = await fetchAll('items', { perPage: 12 });

    expect(items).toHaveLength(30);
    expect(items[29].name).toBe('Item 30');
  });

  it('stops after the page cap even if the API claims there are more', async () => {
    server.use(
      rest.get(`${API}/items`, (_req, res, ctx) =>
        res(ctx.status(200), ctx.json({ items: [{ id: 1 }], meta: { total_pages: 9999 } }))
      )
    );

    const items = await fetchAll('items');
    expect(items).toHaveLength(20);
  });
});

describe('listItems', () => {
  it('returns the seeded menu', async () => {
    const items = await listItems();
    expect(items.map((item) => item.name)).toContain('Butter Croissant');
  });
});

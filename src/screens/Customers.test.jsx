import { rest } from 'msw';
import userEvent from '@testing-library/user-event';
import Customers from './Customers';
import { server } from '../test/server';
import { API } from '../test/handlers';
import { renderWithProviders, screen, within } from '../test/render';

describe('<Customers />', () => {
  it('lists the customers the API returned', async () => {
    renderWithProviders(<Customers />);

    expect(await screen.findByText('Ada Lovelace')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'ada@example.com' })).toHaveAttribute(
      'href',
      'mailto:ada@example.com'
    );
    expect(screen.getAllByRole('row')).toHaveLength(6); // header + 5
  });

  it('reports the total the API knows about, not just the page length', async () => {
    server.use(
      rest.get(`${API}/customers`, (_req, res, ctx) =>
        res(
          ctx.status(200),
          ctx.json({
            customers: [{ id: 1, name: 'Ada Lovelace', email: 'ada@example.com' }],
            meta: { page: 1, per_page: 25, total_count: 412, total_pages: 17 },
          })
        )
      )
    );
    renderWithProviders(<Customers />);

    expect(await screen.findByText('412 customers have ordered here.')).toBeInTheDocument();
  });

  it('pages through the collection instead of silently showing only the first 25', async () => {
    const all = Array.from({ length: 30 }, (_, index) => ({
      id: index + 1,
      name: `Customer ${index + 1}`,
      email: `customer${index + 1}@example.com`,
    }));
    server.use(
      rest.get(`${API}/customers`, (req, res, ctx) => {
        const page = Number(req.url.searchParams.get('page')) || 1;
        return res(
          ctx.status(200),
          ctx.json({
            customers: all.slice((page - 1) * 25, page * 25),
            meta: { page, per_page: 25, total_count: 30, total_pages: 2 },
          })
        );
      })
    );
    const user = userEvent.setup();
    renderWithProviders(<Customers />);

    await screen.findByText('Customer 1');
    expect(screen.getByText('Page 1 of 2')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /older/i }));

    expect(await screen.findByText('Customer 30')).toBeInTheDocument();
    expect(screen.queryByText('Customer 1')).not.toBeInTheDocument();
    const row = screen.getByRole('row', { name: /Customer 26/ });
    expect(within(row).getByText('26')).toBeInTheDocument();
  });

  it('offers a retry when the API is down', async () => {
    server.use(rest.get(`${API}/customers`, (_req, res, ctx) => res(ctx.status(503))));
    renderWithProviders(<Customers />);

    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });
});

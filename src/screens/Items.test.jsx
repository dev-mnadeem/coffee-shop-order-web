import { rest } from 'msw';
import userEvent from '@testing-library/user-event';
import Items from './Items';
import { server } from '../test/server';
import { API } from '../test/handlers';
import { renderWithProviders, screen, waitFor, within } from '../test/render';

describe('<Items />', () => {
  it('renders the whole menu with price, tax and stock', async () => {
    renderWithProviders(<Items />);

    const card = await screen.findByRole('article', { name: 'Flat White' });
    expect(within(card).getByText('$3.80')).toBeInTheDocument();
    expect(within(card).getByText('Tax 5%')).toBeInTheDocument();
    expect(within(card).getByText('150 left')).toBeInTheDocument();
  });

  it('shows the paired offer on the item it discounts', async () => {
    renderWithProviders(<Items />);

    const croissant = await screen.findByRole('article', { name: 'Butter Croissant' });
    expect(within(croissant).getByText('20% off with Flat White')).toBeInTheDocument();
  });

  it('flags low stock differently from healthy stock', async () => {
    renderWithProviders(<Items />);

    const danish = await screen.findByRole('article', { name: 'Almond Danish' });
    expect(within(danish).getByText('25 left')).toHaveClass('pill--low');
  });

  it('removes an item from the grid once the API has accepted the delete', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Items />);

    const espresso = await screen.findByRole('article', { name: 'Espresso' });
    await user.click(within(espresso).getByRole('button', { name: /remove from menu/i }));

    await waitFor(() =>
      expect(screen.queryByRole('article', { name: 'Espresso' })).not.toBeInTheDocument()
    );
    expect(screen.getByRole('article', { name: 'Flat White' })).toBeInTheDocument();
  });

  it('reports a failed delete instead of crashing on an undefined response', async () => {
    // Reproduces the original bug: the API layer swallowed the error and the
    // screen then read `.status` off undefined, taking the page down.
    server.use(
      rest.delete(`${API}/items/:id`, (_req, res, ctx) =>
        res(ctx.status(422), ctx.json({ errors: ['Item is on an open order'] }))
      )
    );
    const user = userEvent.setup();
    renderWithProviders(<Items />);

    const espresso = await screen.findByRole('article', { name: 'Espresso' });
    await user.click(within(espresso).getByRole('button', { name: /remove from menu/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Item is on an open order');
    expect(screen.getByRole('article', { name: 'Espresso' })).toBeInTheDocument();
  });

  it('tells the difference between an empty menu and a broken API', async () => {
    server.use(rest.get(`${API}/items`, (_req, res, ctx) => res(ctx.status(500))));
    renderWithProviders(<Items />);

    expect(await screen.findByRole('alert')).toHaveTextContent(/bad day/i);
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
    expect(screen.queryByText(/nothing on the menu yet/i)).not.toBeInTheDocument();
  });

  it('shows the empty state when the shop really has no items', async () => {
    server.use(
      rest.get(`${API}/items`, (_req, res, ctx) =>
        res(ctx.status(200), ctx.json({ items: [], meta: { total_pages: 1 } }))
      )
    );
    renderWithProviders(<Items />);

    expect(await screen.findByText(/nothing on the menu yet/i)).toBeInTheDocument();
  });
});

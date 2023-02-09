import { http, HttpResponse } from 'msw';
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
    server.use(
      http.delete(`${API}/items/:id`, () =>
        HttpResponse.json({ errors: ['Item is on an open order'] }, { status: 422 })
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
    server.use(http.get(`${API}/items`, () => new HttpResponse(null, { status: 500 })));
    renderWithProviders(<Items />);

    expect(await screen.findByRole('alert')).toHaveTextContent(/bad day/i);
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
    expect(screen.queryByText(/nothing on the menu yet/i)).not.toBeInTheDocument();
  });

  it('shows the empty state when the shop really has no items', async () => {
    server.use(
      http.get(`${API}/items`, () => HttpResponse.json({ items: [], meta: { total_pages: 1 } }))
    );
    renderWithProviders(<Items />);

    expect(await screen.findByText(/nothing on the menu yet/i)).toBeInTheDocument();
  });
});

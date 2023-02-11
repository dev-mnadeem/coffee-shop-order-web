import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import App from './App';

function renderApp(route = '/') {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <App />
    </MemoryRouter>
  );
}

describe('<App />', () => {
  it('shows the shop on the landing screen', async () => {
    renderApp();

    expect(
      await screen.findByRole('heading', { name: 'A day at the coffee shop' })
    ).toBeInTheDocument();
    expect(await screen.findByText('Butter Croissant + Flat White')).toBeInTheDocument();
  });

  it('navigates without reloading the document', async () => {
    // The original navbar used <Navbar.Brand href="items">, which threw the
    // whole React tree away on every click and resolved relative to the
    // current path.
    const user = userEvent.setup();
    renderApp();
    await screen.findByRole('heading', { name: 'A day at the coffee shop' });

    await user.click(screen.getByRole('link', { name: 'Menu' }));

    expect(await screen.findByRole('heading', { name: 'Menu', level: 1 })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Menu' })).toHaveAttribute('href', '/items');
  });

  it('fetches the menu once for the whole session, not once per screen', async () => {
    // Items and Order both need the menu; the original fetched it again on
    // every navigation, with a flash of "No Data Retrieved" in between.
    const user = userEvent.setup();
    renderApp();
    await screen.findByRole('heading', { name: 'A day at the coffee shop' });

    await user.click(screen.getByRole('link', { name: 'Menu' }));
    await screen.findByRole('heading', { name: 'Flat White' });
    await user.click(screen.getByRole('link', { name: 'New order' }));

    expect(await screen.findByLabelText('Name')).toBeInTheDocument();
    expect(screen.queryByText('Loading…')).not.toBeInTheDocument();
  });

  it('keeps the old /customer and /new_item URLs working', async () => {
    renderApp('/customer');
    expect(await screen.findByRole('heading', { name: 'Customers', level: 1 })).toBeInTheDocument();

    renderApp('/new_item');
    expect(
      await screen.findByRole('heading', { name: 'Add an item', level: 1 })
    ).toBeInTheDocument();
  });

  it('has a page for a URL it does not know', async () => {
    renderApp('/espresso-machine');
    expect(await screen.findByText(/not on the menu/i)).toBeInTheDocument();
  });
});

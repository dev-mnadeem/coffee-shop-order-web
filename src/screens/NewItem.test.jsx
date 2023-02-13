import { rest } from 'msw';
import userEvent from '@testing-library/user-event';
import NewItem from './NewItem';
import { server } from '../test/server';
import { API } from '../test/handlers';
import { renderWithProviders, screen } from '../test/render';

async function fillForm(user, overrides = {}) {
  const values = {
    Name: 'Cortado',
    Price: '3.20',
    'Tax rate (%)': '5',
    Stock: '60',
    ...overrides,
  };
  for (const [label, value] of Object.entries(values)) {
    const field = screen.getByLabelText(label);
    await user.clear(field);
    if (value !== '') await user.type(field, value);
  }
}

describe('<NewItem />', () => {
  it('posts what the API expects, as numbers', async () => {
    let body;
    server.use(
      rest.post(`${API}/items`, async (req, res, ctx) => {
        body = await req.json();
        return res(ctx.status(201), ctx.json({ id: 8, ...body }));
      })
    );
    const user = userEvent.setup();
    renderWithProviders(<NewItem />);

    await fillForm(user);
    await user.click(screen.getByRole('button', { name: /save item/i }));

    expect(body).toEqual({ name: 'Cortado', price: 3.2, tax_rate: 5, available_quantity: 60 });
  });

  it('will not submit an item with no name', async () => {
    const user = userEvent.setup();
    renderWithProviders(<NewItem />);

    await fillForm(user, { Name: '' });
    await user.click(screen.getByRole('button', { name: /save item/i }));

    expect(await screen.findByText('Give the item a name')).toBeInTheDocument();
  });

  it('rejects a negative price', async () => {
    const user = userEvent.setup();
    renderWithProviders(<NewItem />);

    await fillForm(user, { Price: '-1' });
    await user.click(screen.getByRole('button', { name: /save item/i }));

    expect(await screen.findByText('Price cannot be negative')).toBeInTheDocument();
  });

  it('stays on the form and shows why when the API rejects the item', async () => {
    // The original navigated to /items regardless, so a rejected item looked
    // exactly like a saved one.
    server.use(
      rest.post(`${API}/items`, (_req, res, ctx) =>
        res(ctx.status(422), ctx.json({ errors: ['Name has already been taken'] }))
      )
    );
    const user = userEvent.setup();
    renderWithProviders(<NewItem />);

    await fillForm(user);
    await user.click(screen.getByRole('button', { name: /save item/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Name has already been taken');
    expect(screen.getByLabelText('Name')).toHaveValue('Cortado');
  });
});

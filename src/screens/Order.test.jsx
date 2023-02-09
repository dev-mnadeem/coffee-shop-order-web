import { rest } from 'msw';
import userEvent from '@testing-library/user-event';
import Order from './Order';
import { server } from '../test/server';
import { API } from '../test/handlers';
import { renderWithProviders, screen, waitFor, within } from '../test/render';

/** Fill the form with a flat white and a croissant -- the pair that discounts. */
async function fillDiscountedBasket(user) {
  await user.type(screen.getByLabelText('Name'), 'Ada Lovelace');
  await user.type(screen.getByLabelText('Email'), 'ada@example.com');
  await user.selectOptions(screen.getByLabelText('Item'), '2');
  await user.clear(screen.getByLabelText('Quantity'));
  await user.type(screen.getByLabelText('Quantity'), '1');

  await user.click(screen.getByRole('button', { name: /add another item/i }));
  const [, secondItem] = screen.getAllByLabelText('Item');
  const [, secondQuantity] = screen.getAllByLabelText('Quantity');
  await user.selectOptions(secondItem, '4');
  await user.clear(secondQuantity);
  await user.type(secondQuantity, '1');
}

describe('<Order />', () => {
  it('prices the basket as you type, before anything is posted', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Order />);
    await screen.findByLabelText('Name');

    await fillDiscountedBasket(user);

    const totals = screen.getByRole('region', { name: 'Order total' });
    expect(within(totals).getByText('$6.90')).toBeInTheDocument(); // shelf price
    expect(within(totals).getByText('$0.58')).toBeInTheDocument(); // tax
    expect(within(totals).getByText('-$0.70')).toBeInTheDocument(); // paired saving
    expect(within(totals).getByText('$6.78')).toBeInTheDocument(); // total
  });

  it('names the offer that is discounting the basket', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Order />);
    await screen.findByLabelText('Name');

    await fillDiscountedBasket(user);

    expect(screen.getByText('20% off Butter Croissant with Flat White')).toBeInTheDocument();
  });

  it('posts the order and shows the receipt the API returned', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Order />);
    await screen.findByLabelText('Name');

    await fillDiscountedBasket(user);
    await user.click(screen.getByRole('button', { name: /place order/i }));

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText(/Order #1 confirmed/)).toBeInTheDocument();
    expect(within(dialog).getByText('ada@example.com')).toBeInTheDocument();
    expect(within(dialog).getByText('$6.78')).toBeInTheDocument();
    expect(within(dialog).getByText('Butter Croissant')).toBeInTheDocument();
  });

  it('shows a rejected order instead of taking the page down', async () => {
    server.use(
      rest.post(`${API}/orders`, (_req, res, ctx) =>
        res(ctx.status(422), ctx.json({ errors: ['Not enough Butter Croissant in stock'] }))
      )
    );
    const user = userEvent.setup();
    renderWithProviders(<Order />);
    await screen.findByLabelText('Name');

    await fillDiscountedBasket(user);
    await user.click(screen.getByRole('button', { name: /place order/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Not enough Butter Croissant in stock'
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Name')).toHaveValue('Ada Lovelace');
  });

  it('refuses to post an order with no customer', async () => {
    let posted = false;
    server.use(
      rest.post(`${API}/orders`, (_req, res, ctx) => {
        posted = true;
        return res(ctx.status(201), ctx.json({}));
      })
    );
    const user = userEvent.setup();
    renderWithProviders(<Order />);
    await screen.findByLabelText('Name');

    await user.selectOptions(screen.getByLabelText('Item'), '1');
    await user.click(screen.getByRole('button', { name: /place order/i }));

    expect(await screen.findByText('Who is this order for?')).toBeInTheDocument();
    await waitFor(() => expect(posted).toBe(false));
  });

  it('rejects an email that is not one', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Order />);
    await screen.findByLabelText('Name');

    await user.type(screen.getByLabelText('Name'), 'Ada');
    await user.type(screen.getByLabelText('Email'), 'ada-at-example');
    await user.selectOptions(screen.getByLabelText('Item'), '1');
    await user.click(screen.getByRole('button', { name: /place order/i }));

    expect(await screen.findByText(/does not look like an email/i)).toBeInTheDocument();
  });

  it('keeps the last line un-removable so the form is never empty', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Order />);
    await screen.findByLabelText('Name');

    expect(screen.getByRole('button', { name: /remove line 1/i })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: /add another item/i }));
    expect(screen.getByRole('button', { name: /remove line 1/i })).toBeEnabled();
  });
});

describe('<Order /> stock check', () => {
  it('stops an order that asks for more than is on the shelf', async () => {
    let posted = false;
    server.use(
      rest.post(`${API}/orders`, (_req, res, ctx) => {
        posted = true;
        return res(ctx.status(201), ctx.json({}));
      })
    );
    const user = userEvent.setup();
    renderWithProviders(<Order />);
    await screen.findByLabelText('Name');

    await user.type(screen.getByLabelText('Name'), 'Ada Lovelace');
    await user.type(screen.getByLabelText('Email'), 'ada@example.com');
    await user.selectOptions(screen.getByLabelText('Item'), '4');
    await user.clear(screen.getByLabelText('Quantity'));
    await user.type(screen.getByLabelText('Quantity'), '41');
    await user.click(screen.getByRole('button', { name: /place order/i }));

    expect(await screen.findByText('Only 40 Butter Croissant left')).toBeInTheDocument();
    await waitFor(() => expect(posted).toBe(false));
  });

  it('lists the same item twice without mixing up the totals', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Order />);
    await screen.findByLabelText('Name');

    await user.selectOptions(screen.getByLabelText('Item'), '1');
    await user.click(screen.getByRole('button', { name: /add another item/i }));
    await user.selectOptions(screen.getAllByLabelText('Item')[1], '1');

    const totals = screen.getByRole('region', { name: 'Order total' });
    expect(within(totals).getAllByText('1 × Espresso')).toHaveLength(2);
    // Each line is rounded on its own, as the API does: 2.63 + 2.63.
    expect(within(totals).getByText('$5.26')).toBeInTheDocument();
  });
});

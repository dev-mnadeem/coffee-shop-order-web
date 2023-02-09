import { render, screen } from '@testing-library/react';
import ItemThumbnail, { hueFor, monogramFor } from './ItemThumbnail';

describe('monogramFor', () => {
  it('uses the initials of the first and last word', () => {
    expect(monogramFor('Butter Croissant')).toBe('BC');
    expect(monogramFor('Avocado Sourdough Toast')).toBe('AT');
  });

  it('uses one letter for a one-word item', () => {
    expect(monogramFor('Espresso')).toBe('E');
  });

  it('never renders an empty tile', () => {
    expect(monogramFor('')).toBe('?');
    expect(monogramFor('   ')).toBe('?');
  });
});

describe('hueFor', () => {
  it('is stable for the same name', () => {
    expect(hueFor('Flat White')).toBe(hueFor('Flat White'));
  });

  it('separates the items on the seeded menu', () => {
    const hues = ['Espresso', 'Flat White', 'Cold Brew', 'Butter Croissant'].map(hueFor);
    expect(new Set(hues).size).toBeGreaterThan(1);
  });
});

describe('<ItemThumbnail />', () => {
  it('renders the monogram', () => {
    render(<ItemThumbnail name="Cold Brew" />);

    expect(screen.getByText('CB')).toBeInTheDocument();
    // The tile is aria-hidden, so it contributes nothing to the card's
    // accessible name -- asserted from the outside in Items.test.jsx, where
    // the article is found by the item name alone.
  });
});

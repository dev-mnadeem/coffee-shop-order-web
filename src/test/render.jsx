import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import MenuProvider from '../context/MenuProvider';

/**
 * Render a screen with the two things every screen assumes: a router and the
 * menu provider.
 *
 * @param {React.ReactElement} ui
 * @param {{ route?: string }} [options]
 */
export function renderWithProviders(ui, { route = '/' } = {}) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <MenuProvider>{ui}</MenuProvider>
    </MemoryRouter>
  );
}

export * from '@testing-library/react';

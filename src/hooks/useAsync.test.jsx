import { useCallback, useState } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import useAsync from './useAsync';

function Probe({ load }) {
  const { status, data, error, reload } = useAsync(load);
  return (
    <div>
      <span data-testid="status">{status}</span>
      <span data-testid="data">{String(data)}</span>
      <span data-testid="error">{error ? error.message : ''}</span>
      <button type="button" onClick={reload}>
        reload
      </button>
    </div>
  );
}

describe('useAsync', () => {
  it('moves from loading to success', async () => {
    const load = () => Promise.resolve('flat white');
    render(<Probe load={load} />);

    expect(screen.getByTestId('status')).toHaveTextContent('loading');
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('success'));
    expect(screen.getByTestId('data')).toHaveTextContent('flat white');
  });

  it('captures the error rather than leaving an unhandled rejection', async () => {
    const load = () => Promise.reject(new Error('API is down'));
    render(<Probe load={load} />);

    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('error'));
    expect(screen.getByTestId('error')).toHaveTextContent('API is down');
  });

  it('re-runs when the function it was given changes', async () => {
    function Pager() {
      const [page, setPage] = useState(1);
      const load = useCallback(() => Promise.resolve(`page ${page}`), [page]);
      return (
        <>
          <Probe load={load} />
          <button type="button" onClick={() => setPage(2)}>
            next
          </button>
        </>
      );
    }
    const user = userEvent.setup();
    render(<Pager />);

    await waitFor(() => expect(screen.getByTestId('data')).toHaveTextContent('page 1'));
    await user.click(screen.getByRole('button', { name: 'next' }));
    await waitFor(() => expect(screen.getByTestId('data')).toHaveTextContent('page 2'));
  });

  it('does not write state for a request that was superseded', async () => {
    const resolvers = [];
    const load = () => new Promise((resolve) => resolvers.push(resolve));
    const user = userEvent.setup();
    render(<Probe load={load} />);

    await user.click(screen.getByRole('button', { name: 'reload' }));
    resolvers[0]('stale');
    resolvers[1]('fresh');

    await waitFor(() => expect(screen.getByTestId('data')).toHaveTextContent('fresh'));
    expect(screen.getByTestId('data')).not.toHaveTextContent('stale');
  });
});

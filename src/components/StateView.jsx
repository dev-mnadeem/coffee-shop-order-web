import { Button, Spinner } from 'react-bootstrap';

/**
 * Loading, error and empty, in one place.
 *
 * The screens this replaced rendered the literal string "No Data Retrieved"
 * for all three, so a shop with no items looked exactly like a shop whose API
 * was down. Now a failure says what failed and offers a retry.
 */
export default function StateView({
  status,
  error,
  isEmpty,
  emptyTitle,
  emptyBody,
  onRetry,
  children,
}) {
  if (status === 'loading' || status === 'idle') {
    return (
      <div className="state-view" role="status" aria-live="polite">
        <Spinner animation="border" role="presentation" className="mb-3" />
        <h2>Loading…</h2>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="state-view" role="alert">
        <h2>That did not work</h2>
        <p className="mb-3">{error ? error.message : 'Something went wrong.'}</p>
        {onRetry ? (
          <Button className="btn-outline-coffee" variant="outline-secondary" onClick={onRetry}>
            Try again
          </Button>
        ) : null}
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className="state-view">
        <h2>{emptyTitle}</h2>
        {emptyBody ? <p className="mb-0">{emptyBody}</p> : null}
      </div>
    );
  }

  return children;
}

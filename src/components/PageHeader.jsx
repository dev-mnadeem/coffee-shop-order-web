import { Container } from 'react-bootstrap';

/**
 * A page title, its one-line explanation and an optional action.
 * Every screen uses it, so every screen has the same vertical rhythm.
 */
export default function PageHeader({ title, description, action }) {
  return (
    <Container className="page-header d-flex flex-wrap justify-content-between align-items-end gap-3">
      <div>
        <h1>{title}</h1>
        {description ? <p>{description}</p> : null}
      </div>
      {action ? <div>{action}</div> : null}
    </Container>
  );
}

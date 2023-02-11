import { Button, Container } from 'react-bootstrap';
import { Link } from 'react-router-dom';

/** Any URL the router does not know. Previously such a URL rendered a bare navbar. */
export default function NotFound() {
  return (
    <Container className="py-5">
      <div className="state-view">
        <h2>That page is not on the menu</h2>
        <p>The link may be out of date.</p>
        <Button as={Link} to="/" className="btn-coffee">
          Back to the shop
        </Button>
      </div>
    </Container>
  );
}

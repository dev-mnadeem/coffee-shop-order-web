import { Container, Nav, Navbar } from 'react-bootstrap';
import { NavLink } from 'react-router-dom';

const LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/items', label: 'Menu' },
  { to: '/order', label: 'New order' },
  { to: '/customers', label: 'Customers' },
];

/**
 * The top bar.
 *
 * Uses `NavLink`, not `href`. The original used `<Navbar.Brand href="items">`,
 * which made every click a full document load -- the whole bundle re-fetched,
 * React state thrown away -- and, being relative, resolved differently
 * depending on the page you clicked it from.
 */
export default function AppNav() {
  return (
    <Navbar expand="md" variant="dark" className="app-nav py-3">
      <Container>
        <Navbar.Brand as={NavLink} to="/">
          ☕ Agnos Coffee
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="app-nav-links" />
        <Navbar.Collapse id="app-nav-links">
          <Nav className="ms-auto gap-1">
            {LINKS.map((link) => (
              <Nav.Link key={link.to} as={NavLink} to={link.to} end={link.end}>
                {link.label}
              </Nav.Link>
            ))}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

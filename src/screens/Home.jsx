import { Button, Col, Container, Row } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { COFFEE } from '../utils/assets';
import { useMenu } from '../context/MenuProvider';
import { formatMoney, formatRate } from '../domain/money';

/**
 * The landing screen: what the shop sells, what is on offer today, and the
 * one button that matters. It replaces a page whose entire content was a
 * bare "Place Order" hyperlink inside three empty grid columns.
 */
export default function Home() {
  const { items, discounts, status } = useMenu();
  const byId = new Map(items.map((item) => [Number(item.id), item]));
  const offers = discounts
    .map((discount) => ({
      discount,
      item: byId.get(Number(discount.item_id)),
      pairedWith: byId.get(Number(discount.discount_with_item_id)),
    }))
    .filter((offer) => offer.item && offer.pairedWith);

  return (
    <Container className="py-4">
      <section className="hero mb-5">
        <img className="hero__image" src={COFFEE} alt="" />
        <div className="hero__scrim" />
        <div className="hero__content">
          <h1>A day at the coffee shop</h1>
          <p className="lead mb-4">
            Take an order, price it with per-item tax and paired-item offers, and send the customer
            a receipt — all against the Agnos coffee shop API.
          </p>
          <Button as={Link} to="/order" size="lg" className="btn-coffee">
            Start an order
          </Button>
        </div>
      </section>

      <Row className="g-4">
        <Col md={6}>
          <div className="surface p-4 h-100">
            <h2 className="h5 mb-3">On the menu</h2>
            {status === 'success' && items.length === 0 ? (
              <p className="text-secondary mb-0">The menu is empty — add an item to get going.</p>
            ) : (
              <ul className="list-unstyled mb-0">
                {items.slice(0, 5).map((item) => (
                  <li key={item.id} className="totals__row">
                    <span className="text-body">{item.name}</span>
                    <span>
                      {formatMoney(item.price)}{' '}
                      <span className="text-secondary small">
                        + {formatRate(item.tax_rate)} tax
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <Link to="/items" className="d-inline-block mt-3">
              See the whole menu →
            </Link>
          </div>
        </Col>

        <Col md={6}>
          <div className="surface p-4 h-100">
            <h2 className="h5 mb-3">Buy these together</h2>
            {offers.length === 0 ? (
              <p className="text-secondary mb-0">No paired offers are running right now.</p>
            ) : (
              <ul className="list-unstyled mb-0 d-flex flex-column gap-3">
                {offers.map((offer) => (
                  <li key={offer.discount.id}>
                    <div className="fw-semibold">
                      {offer.item.name} + {offer.pairedWith.name}
                    </div>
                    <span className="pill pill--offer mt-1">
                      {formatRate(offer.discount.percentage)} off the {offer.item.name}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Col>
      </Row>
    </Container>
  );
}

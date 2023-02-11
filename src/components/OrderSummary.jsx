import { Button, Modal, Table } from 'react-bootstrap';
import { formatMoney, formatRate } from '../domain/money';

/**
 * The receipt shown once the API has accepted an order.
 *
 * Every field is read defensively: the version this replaces dereferenced
 * `orderDetail.customer.name` and `orderDetail.total_amount.toFixed(2)`
 * unconditionally, so any rejected order -- a sold-out item, say -- took the
 * whole page down with "Cannot read properties of undefined".
 */
export default function OrderSummary({ order, show, onClose, onNewOrder }) {
  const customer = (order && order.customer) || {};
  const items = (order && order.items) || [];
  const total = Number(order && order.total_amount);

  return (
    <Modal show={show} onHide={onClose} centered size="lg" aria-labelledby="order-summary-title">
      <Modal.Header closeButton>
        <Modal.Title id="order-summary-title">
          Order {order && order.id ? `#${order.id}` : ''} confirmed
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p className="mb-3">
          A confirmation is on its way to <strong>{customer.email || 'the customer'}</strong>.
        </p>

        <dl className="row mb-4">
          <dt className="col-sm-3 text-secondary fw-normal">Customer</dt>
          <dd className="col-sm-9">{customer.name || '—'}</dd>
          <dt className="col-sm-3 text-secondary fw-normal">Placed</dt>
          <dd className="col-sm-9">{formatPlacedAt(order && order.created_at)}</dd>
        </dl>

        <Table responsive className="align-middle">
          <thead>
            <tr>
              <th scope="col">#</th>
              <th scope="col">Item</th>
              <th scope="col" className="text-end">
                Price
              </th>
              <th scope="col" className="text-end">
                Tax
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={item.id}>
                <td className="text-secondary">{index + 1}</td>
                <td>{item.name}</td>
                <td className="text-end">{formatMoney(item.price)}</td>
                <td className="text-end">{formatRate(item.tax_rate)}</td>
              </tr>
            ))}
          </tbody>
        </Table>

        <div className="totals__row totals__row--grand">
          <span>Total charged</span>
          <span>{Number.isFinite(total) ? formatMoney(total) : '—'}</span>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button className="btn-outline-coffee" variant="outline-secondary" onClick={onClose}>
          Close
        </Button>
        <Button className="btn-coffee" onClick={onNewOrder}>
          Start another order
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

function formatPlacedAt(value) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString('en-US');
}

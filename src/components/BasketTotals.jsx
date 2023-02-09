import { formatMoney, formatRate } from '../domain/money';

/**
 * The running total, priced in the browser with the same rules the API uses.
 *
 * A till that only learns the price after the order is submitted is not a
 * till. `src/domain/pricing.js` mirrors `Pricing::Calculator`, so this panel
 * shows the customer what they will be charged before anything is posted.
 */
export default function BasketTotals({ quote, offers = [], isEmpty }) {
  if (isEmpty) {
    return (
      <section className="surface p-4 totals" aria-label="Order total">
        <h2 className="h6 text-uppercase text-secondary mb-3">Order total</h2>
        <p className="text-secondary mb-0">
          Pick an item and a quantity and the total will appear here.
        </p>
      </section>
    );
  }

  return (
    <section className="surface p-4 totals" aria-label="Order total">
      <h2 className="h6 text-uppercase text-secondary mb-3">Order total</h2>

      <ul className="list-unstyled mb-3">
        {quote.lines.map((line) => (
          <li key={line.itemId} className="totals__row">
            <span>
              {line.quantity} × {line.name}
            </span>
            <span>{formatMoney(line.subtotal)}</span>
          </li>
        ))}
      </ul>

      <div className="totals__row">
        <span>Subtotal</span>
        <span>{formatMoney(quote.subtotal)}</span>
      </div>
      <div className="totals__row">
        <span>Tax</span>
        <span>{formatMoney(quote.tax)}</span>
      </div>
      {quote.discount < 0 ? (
        <div className="totals__row totals__row--saving">
          <span>Paired-item savings</span>
          <span>{formatMoney(quote.discount)}</span>
        </div>
      ) : null}
      <div className="totals__row totals__row--grand">
        <span>Total</span>
        <span>{formatMoney(quote.total)}</span>
      </div>

      {offers.length > 0 ? (
        <ul className="list-unstyled mt-3 mb-0 d-flex flex-column gap-2">
          {offers.map((offer) => (
            <li key={offer.discount.id}>
              <span className="pill pill--offer">
                {formatRate(offer.discount.percentage)} off {offer.item.name} with{' '}
                {offer.pairedWith.name}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

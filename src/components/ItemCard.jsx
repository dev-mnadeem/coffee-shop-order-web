import { Button } from 'react-bootstrap';
import { formatMoney, formatRate } from '../domain/money';
import ItemThumbnail from './ItemThumbnail';

const LOW_STOCK_THRESHOLD = 25;

/**
 * One item on the menu: what it costs, what it is taxed at, how many are left
 * and which other item takes money off it.
 *
 * Stock and the paired offer both come from the API and neither was shown
 * before, which made the card a name and two raw numbers.
 */
export default function ItemCard({ item, pairings = [], onDelete, isDeleting = false }) {
  const stock = Number(item.available_quantity);
  const hasStock = Number.isFinite(stock);
  const isLow = hasStock && stock <= LOW_STOCK_THRESHOLD;

  return (
    <article className="item-card" aria-label={item.name}>
      <ItemThumbnail name={item.name} />
      <div className="item-card__body">
        <div className="d-flex justify-content-between align-items-start gap-2">
          <h2 className="item-card__name">{item.name}</h2>
          {hasStock ? (
            <span className={`pill ${isLow ? 'pill--low' : 'pill--stock'}`}>
              {stock === 0 ? 'Sold out' : `${stock} left`}
            </span>
          ) : null}
        </div>

        <div className="item-card__price">{formatMoney(item.price)}</div>
        <div className="item-card__meta">
          <span>Tax {formatRate(item.tax_rate)}</span>
          <span>
            {formatMoney(Number(item.price) * (1 + Number(item.tax_rate) / 100))} with tax
          </span>
        </div>

        {pairings.length > 0 ? (
          <ul className="list-unstyled d-flex flex-wrap gap-2 mb-0">
            {pairings.map((pairing) => (
              <li key={pairing.discount.id}>
                <span className="pill pill--offer">
                  {formatRate(pairing.discount.percentage)} off with {pairing.pairedWith.name}
                </span>
              </li>
            ))}
          </ul>
        ) : null}

        {onDelete ? (
          <div className="mt-auto pt-2">
            <Button
              className="btn-outline-coffee w-100"
              variant="outline-secondary"
              size="sm"
              disabled={isDeleting}
              onClick={() => onDelete(item)}
            >
              {isDeleting ? 'Removing…' : 'Remove from menu'}
            </Button>
          </div>
        ) : null}
      </div>
    </article>
  );
}

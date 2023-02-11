import { useState } from 'react';
import { Button, Col, Container, Row } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import ItemCard from '../components/ItemCard';
import PageHeader from '../components/PageHeader';
import StateView from '../components/StateView';
import { deleteItem } from '../api/items';
import { useMenu } from '../context/MenuProvider';

/**
 * The menu, as a grid of cards.
 *
 * Deleting used to read `.status` off whatever the API layer returned, which
 * was `undefined` whenever the request failed -- so a failed delete crashed
 * the page instead of reporting itself.
 */
export default function Items() {
  const { status, error, items, discounts, reload, removeItem } = useMenu();
  const [deletingId, setDeletingId] = useState(null);
  const [deleteError, setDeleteError] = useState(null);

  const pairingsFor = (itemId) =>
    discounts
      .filter((discount) => Number(discount.item_id) === Number(itemId))
      .map((discount) => ({
        discount,
        pairedWith: items.find(
          (item) => Number(item.id) === Number(discount.discount_with_item_id)
        ),
      }))
      .filter((pairing) => pairing.pairedWith);

  const handleDelete = async (item) => {
    setDeleteError(null);
    setDeletingId(item.id);
    try {
      await deleteItem(item.id);
      removeItem(item.id);
    } catch (caught) {
      setDeleteError(caught);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      <PageHeader
        title="Menu"
        description="Everything the shop sells, with its tax rate, stock and paired offers."
        action={
          <Button as={Link} to="/items/new" className="btn-coffee">
            Add an item
          </Button>
        }
      />
      <Container>
        {deleteError ? (
          <div className="alert alert-danger" role="alert">
            {deleteError.message}
          </div>
        ) : null}

        <StateView
          status={status}
          error={error}
          isEmpty={items.length === 0}
          emptyTitle="Nothing on the menu yet"
          emptyBody="Add the first item and it will show up here."
          onRetry={reload}
        >
          <Row className="g-4" data-testid="menu-grid">
            {items.map((item) => (
              <Col key={item.id} sm={6} lg={4} xl={3}>
                <ItemCard
                  item={item}
                  pairings={pairingsFor(item.id)}
                  onDelete={handleDelete}
                  isDeleting={deletingId === item.id}
                />
              </Col>
            ))}
          </Row>
        </StateView>
      </Container>
    </>
  );
}

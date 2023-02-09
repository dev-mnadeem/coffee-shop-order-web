import { useState } from 'react';
import { Button, Col, Container, Row } from 'react-bootstrap';
import { Field, FieldArray, Form, Formik } from 'formik';
import * as Yup from 'yup';
import BasketTotals from '../components/BasketTotals';
import FieldError from '../components/FieldError';
import OrderSummary from '../components/OrderSummary';
import PageHeader from '../components/PageHeader';
import StateView from '../components/StateView';
import { createOrder } from '../api/orders';
import { useMenu } from '../context/MenuProvider';
import { activeDiscounts, toBasketLines } from '../domain/pricing';

const EMPTY_LINE = { item_id: '', quantity: 1 };

const INITIAL_VALUES = {
  customer: { name: '', email: '' },
  order_items: [{ ...EMPTY_LINE }],
};

const ValidationSchema = Yup.object().shape({
  customer: Yup.object().shape({
    name: Yup.string().trim().required('Who is this order for?'),
    email: Yup.string().trim().email('That does not look like an email').required('Required'),
  }),
  order_items: Yup.array()
    .of(
      Yup.object().shape({
        item_id: Yup.string().required('Pick an item'),
        quantity: Yup.number()
          .typeError('Quantity must be a number')
          .integer('Whole cups only')
          .min(1, 'At least one')
          .required('Required'),
      })
    )
    .min(1, 'An order needs at least one item'),
});

/**
 * The till.
 *
 * The form itself is close to the original -- Formik with a `FieldArray` of
 * lines was the right call -- but the money is new: `src/domain/pricing.js`
 * runs the same tax-then-paired-discount pipeline the API runs, so the total
 * is visible before the order is posted rather than only afterwards.
 */
export default function Order() {
  const { status, error, items, discounts, pricing, reload } = useMenu();
  const [placedOrder, setPlacedOrder] = useState(null);
  const [submitError, setSubmitError] = useState(null);

  const handleSubmit = async (values, actions) => {
    setSubmitError(null);
    try {
      const order = await createOrder(values);
      setPlacedOrder(order);
      actions.resetForm();
      await reload();
    } catch (caught) {
      setSubmitError(caught);
    } finally {
      actions.setSubmitting(false);
    }
  };

  return (
    <>
      <PageHeader
        title="New order"
        description="Add the customer, add the cups, and the total updates as you type."
      />
      <Container>
        <StateView
          status={status}
          error={error}
          isEmpty={items.length === 0}
          emptyTitle="The menu is empty"
          emptyBody="Add an item before taking an order."
          onRetry={reload}
        >
          <Formik
            initialValues={INITIAL_VALUES}
            validationSchema={ValidationSchema}
            onSubmit={handleSubmit}
          >
            {({ values, isSubmitting }) => {
              const lines = toBasketLines(values.order_items, items);
              const quote = pricing.quote(lines);
              const offers = activeDiscounts(lines, discounts, items);

              return (
                <Form noValidate>
                  <Row className="g-4">
                    <Col lg={7}>
                      <section className="surface p-4 mb-4">
                        <h2 className="h5 mb-3">Customer</h2>
                        <Row className="g-3">
                          <Col sm={6}>
                            <label className="form-label" htmlFor="customer-name">
                              Name
                            </label>
                            <Field
                              id="customer-name"
                              name="customer.name"
                              type="text"
                              className="form-control"
                              placeholder="Ada Lovelace"
                            />
                            <FieldError name="customer.name" />
                          </Col>
                          <Col sm={6}>
                            <label className="form-label" htmlFor="customer-email">
                              Email
                            </label>
                            <Field
                              id="customer-email"
                              name="customer.email"
                              type="email"
                              className="form-control"
                              placeholder="ada@example.com"
                            />
                            <FieldError name="customer.email" />
                          </Col>
                        </Row>
                        <p className="text-secondary small mb-0 mt-3">
                          A returning customer is matched on their email — no duplicate row is
                          created.
                        </p>
                      </section>

                      <section className="surface pb-3">
                        <div className="d-flex justify-content-between align-items-center p-4 pb-3">
                          <h2 className="h5 mb-0">Items</h2>
                        </div>

                        <FieldArray name="order_items">
                          {({ push, remove }) => (
                            <>
                              {values.order_items.map((line, index) => (
                                /* eslint-disable-next-line react/no-array-index-key */
                                <div className="basket-line" key={index}>
                                  <div>
                                    <label
                                      className="form-label visually-hidden"
                                      htmlFor={`item-${index}`}
                                    >
                                      Item
                                    </label>
                                    <Field
                                      as="select"
                                      id={`item-${index}`}
                                      name={`order_items.${index}.item_id`}
                                      className="form-select"
                                    >
                                      <option value="">Choose an item…</option>
                                      {items.map((item) => (
                                        <option key={item.id} value={item.id}>
                                          {item.name}
                                        </option>
                                      ))}
                                    </Field>
                                    <FieldError name={`order_items.${index}.item_id`} />
                                  </div>
                                  <div>
                                    <label
                                      className="form-label visually-hidden"
                                      htmlFor={`quantity-${index}`}
                                    >
                                      Quantity
                                    </label>
                                    <Field
                                      id={`quantity-${index}`}
                                      name={`order_items.${index}.quantity`}
                                      type="number"
                                      min="1"
                                      className="form-control"
                                      placeholder="Qty"
                                    />
                                    <FieldError name={`order_items.${index}.quantity`} />
                                  </div>
                                  <Button
                                    type="button"
                                    variant="outline-secondary"
                                    className="btn-outline-coffee"
                                    disabled={values.order_items.length === 1}
                                    aria-label={`Remove line ${index + 1}`}
                                    onClick={() => remove(index)}
                                  >
                                    Remove
                                  </Button>
                                </div>
                              ))}

                              <div className="px-4 pt-3">
                                <Button
                                  type="button"
                                  variant="outline-secondary"
                                  className="btn-outline-coffee"
                                  onClick={() => push({ ...EMPTY_LINE })}
                                >
                                  + Add another item
                                </Button>
                              </div>
                            </>
                          )}
                        </FieldArray>
                      </section>
                    </Col>

                    <Col lg={5}>
                      <BasketTotals quote={quote} offers={offers} isEmpty={lines.length === 0} />

                      {submitError ? (
                        <div className="alert alert-danger mt-3" role="alert">
                          {submitError.message}
                        </div>
                      ) : null}

                      <div className="d-grid mt-3">
                        <Button
                          type="submit"
                          size="lg"
                          className="btn-coffee"
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? 'Placing order…' : 'Place order'}
                        </Button>
                      </div>
                    </Col>
                  </Row>
                </Form>
              );
            }}
          </Formik>
        </StateView>
      </Container>

      <OrderSummary
        order={placedOrder}
        show={Boolean(placedOrder)}
        onClose={() => setPlacedOrder(null)}
        onNewOrder={() => setPlacedOrder(null)}
      />
    </>
  );
}

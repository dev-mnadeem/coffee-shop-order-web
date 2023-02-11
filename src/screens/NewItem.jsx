import { useState } from 'react';
import { Button, Col, Container, Row } from 'react-bootstrap';
import { Field, Form, Formik } from 'formik';
import { useNavigate } from 'react-router-dom';
import * as Yup from 'yup';
import FieldError from '../components/FieldError';
import PageHeader from '../components/PageHeader';
import { createItem } from '../api/items';
import { useMenu } from '../context/MenuProvider';

const ValidationSchema = Yup.object().shape({
  name: Yup.string().trim().required('Give the item a name'),
  price: Yup.number()
    .typeError('Price must be a number')
    .min(0, 'Price cannot be negative')
    .required('Required'),
  tax_rate: Yup.number()
    .typeError('Tax rate must be a number')
    .min(0, 'Tax rate cannot be negative')
    .max(100, 'Tax rate cannot exceed 100%')
    .required('Required'),
  available_quantity: Yup.number()
    .typeError('Stock must be a number')
    .integer('Stock must be a whole number')
    .min(0, 'Stock cannot be negative')
    .required('Required'),
});

const INITIAL_VALUES = { name: '', price: '', tax_rate: '', available_quantity: '' };

const FIELDS = [
  { name: 'name', label: 'Name', type: 'text', placeholder: 'Flat White' },
  { name: 'price', label: 'Price', type: 'number', step: '0.01', placeholder: '3.80' },
  { name: 'tax_rate', label: 'Tax rate (%)', type: 'number', step: '0.1', placeholder: '5' },
  { name: 'available_quantity', label: 'Stock', type: 'number', step: '1', placeholder: '150' },
];

/**
 * Add an item to the menu.
 *
 * The version this replaces awaited a create that could not fail -- the API
 * layer swallowed errors -- and navigated away regardless, so a rejected item
 * looked exactly like a saved one. Now a failure stays on the form and shows
 * what the API objected to.
 */
export default function NewItem() {
  const navigate = useNavigate();
  const { reload } = useMenu();
  const [submitError, setSubmitError] = useState(null);

  const handleSubmit = async (values, actions) => {
    setSubmitError(null);
    try {
      await createItem({
        name: values.name.trim(),
        price: Number(values.price),
        tax_rate: Number(values.tax_rate),
        available_quantity: Number(values.available_quantity),
      });
      await reload();
      navigate('/items');
    } catch (caught) {
      setSubmitError(caught);
      actions.setSubmitting(false);
    }
  };

  return (
    <>
      <PageHeader title="Add an item" description="It goes straight onto the menu." />
      <Container>
        <Row>
          <Col lg={6} xl={5}>
            <div className="surface p-4">
              {submitError ? (
                <div className="alert alert-danger" role="alert">
                  {submitError.message}
                </div>
              ) : null}

              <Formik
                initialValues={INITIAL_VALUES}
                validationSchema={ValidationSchema}
                onSubmit={handleSubmit}
              >
                {({ isSubmitting }) => (
                  <Form noValidate>
                    {FIELDS.map((field) => (
                      <div className="mb-3" key={field.name}>
                        <label className="form-label" htmlFor={field.name}>
                          {field.label}
                        </label>
                        <Field
                          id={field.name}
                          name={field.name}
                          type={field.type}
                          step={field.step}
                          className="form-control"
                          placeholder={field.placeholder}
                        />
                        <FieldError name={field.name} />
                      </div>
                    ))}

                    <div className="d-flex gap-2 mt-4">
                      <Button type="submit" className="btn-coffee" disabled={isSubmitting}>
                        {isSubmitting ? 'Saving…' : 'Save item'}
                      </Button>
                      <Button
                        type="button"
                        variant="outline-secondary"
                        className="btn-outline-coffee"
                        onClick={() => navigate('/items')}
                      >
                        Cancel
                      </Button>
                    </div>
                  </Form>
                )}
              </Formik>
            </div>
          </Col>
        </Row>
      </Container>
    </>
  );
}

import { getIn, useFormikContext } from 'formik';

/** A Formik validation message for one field, shown once it has been touched. */
export default function FieldError({ name }) {
  const { errors, touched } = useFormikContext();
  const error = getIn(errors, name);
  const isTouched = getIn(touched, name);
  if (!isTouched || !error) return null;
  return (
    <span className="field-error" role="alert">
      {error}
    </span>
  );
}

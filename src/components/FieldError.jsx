import { getIn, useFormikContext } from 'formik';

/**
 * A Formik validation message for one field.
 *
 * The version this replaces used `<Field render={...}>` -- removed from
 * Formik's public API in all but name, and warned about four times on every
 * render of the order form -- and set `class="text-danger"` on a component
 * that renders no DOM node, so the errors came out unstyled black text.
 */
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

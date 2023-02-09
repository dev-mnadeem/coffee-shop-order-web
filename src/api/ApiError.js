/**
 * A failure the UI can render.
 *
 * The API answers every error with the same body -- `{ "errors": [...] }` --
 * so one class covers validation failures, missing records and the network
 * being down. Screens render `error.message`; forms that care about the
 * individual complaints read `error.errors`.
 */
export default class ApiError extends Error {
  /**
   * @param {string} message
   * @param {{ status?: number|null, errors?: string[], cause?: unknown }} [options]
   */
  constructor(message, { status = null, errors = [], cause = undefined } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors.length > 0 ? errors : [message];
    this.cause = cause;
  }

  /** True when retrying the same request might succeed. */
  get isRetryable() {
    return this.status === null || this.status >= 500;
  }
}

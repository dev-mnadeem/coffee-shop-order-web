import '@testing-library/jest-dom';
import { server } from './test/server';

/**
 * Every test runs against the mock API in `src/test/server.js`.
 *
 * `onUnhandledRequest: 'error'` is deliberate: if a change starts calling an
 * endpoint nobody has mocked, the suite fails loudly instead of quietly
 * attempting a real request.
 */
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

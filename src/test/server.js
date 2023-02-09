import { setupServer } from 'msw/node';
import { handlers } from './handlers';

/**
 * A stand-in for the Rails API, at the network boundary.
 *
 * Mocking axios itself would test the mock; intercepting HTTP means the URL
 * the client builds, the query string it sends and the envelope it unwraps are
 * all under test. No test in this suite reaches a real server.
 */
export const server = setupServer(...handlers);

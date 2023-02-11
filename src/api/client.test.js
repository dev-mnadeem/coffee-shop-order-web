import { rest } from 'msw';
import { server } from '../test/server';
import { API } from '../test/handlers';
import ApiError from './ApiError';
import { get, resolveBaseUrl, toApiError } from './client';

describe('resolveBaseUrl', () => {
  it('falls back to the documented default', () => {
    expect(resolveBaseUrl({}, {})).toBe('http://localhost:3001/api/v1');
  });

  it('reads the environment and strips the trailing slash', () => {
    expect(resolveBaseUrl({ REACT_APP_API_BASE_URL: 'https://api.example.com/api/v1/' }, {})).toBe(
      'https://api.example.com/api/v1'
    );
  });

  it('ignores an env var that is set but blank', () => {
    expect(resolveBaseUrl({ REACT_APP_API_BASE_URL: '   ' }, {})).toBe(
      'http://localhost:3001/api/v1'
    );
  });

  it('lets runtime config from public/config.js override the baked-in value', () => {
    // This is what makes one Docker image serve more than one environment.
    expect(
      resolveBaseUrl(
        { REACT_APP_API_BASE_URL: 'https://built-in.example.com/api/v1' },
        { apiBaseUrl: 'https://staging.example.com/api/v1' }
      )
    ).toBe('https://staging.example.com/api/v1');
  });

  it('falls back to the build-time value when runtime config is empty', () => {
    expect(
      resolveBaseUrl({ REACT_APP_API_BASE_URL: 'https://built-in.example.com/api/v1' }, {})
    ).toBe('https://built-in.example.com/api/v1');
  });
});

describe('errors', () => {
  it('surfaces the API’s own messages from a 422', async () => {
    server.use(
      rest.get(`${API}/items`, (_req, res, ctx) =>
        res(ctx.status(422), ctx.json({ errors: ['Item 99 does not exist'] }))
      )
    );

    // The version this replaces called alert() and returned undefined, so the
    // caller crashed on `response.data` before anyone saw the message.
    await expect(get('/items')).rejects.toThrow(ApiError);
    await expect(get('/items')).rejects.toThrow('Item 99 does not exist');
  });

  it('gives a 500 a message a customer can read, and marks it retryable', async () => {
    server.use(rest.get(`${API}/items`, (_req, res, ctx) => res(ctx.status(500))));

    const error = await get('/items').catch((caught) => caught);
    expect(error.status).toBe(500);
    expect(error.message).toMatch(/bad day/i);
    expect(error.isRetryable).toBe(true);
  });

  it('explains a connection failure rather than leaking axios internals', async () => {
    server.use(rest.get(`${API}/items`, (_req, res) => res.networkError('ECONNREFUSED')));

    const error = await get('/items').catch((caught) => caught);
    expect(error).toBeInstanceOf(ApiError);
    expect(error.message).toMatch(/Could not reach the coffee shop API/);
    expect(error.status).toBeNull();
  });

  it('passes an ApiError through untouched', () => {
    const original = new ApiError('already wrapped');
    expect(toApiError(original)).toBe(original);
  });
});

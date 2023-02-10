import axios from 'axios';
import ApiError from './ApiError';

/**
 * The one place this app talks to the network.
 *
 * Two things live here and nowhere else: where the API is (read from the
 * environment, not hardcoded to a laptop) and what a failure looks like
 * (an `ApiError`, never an `alert()` and never an undefined that explodes
 * two call frames later).
 */

export const DEFAULT_BASE_URL = 'http://localhost:3001/api/v1';
export const DEFAULT_TIMEOUT_MS = 10000;

/**
 * Where the API is.
 *
 * Runtime configuration wins over build-time: a create-react-app bundle bakes
 * `process.env.*` in at compile time, which would otherwise mean one Docker
 * image per environment. `public/config.js` is rewritten by the container
 * entrypoint, so one image can serve staging and production.
 *
 * @param {Record<string, string|undefined>} [env]
 * @param {{ apiBaseUrl?: string }} [runtime]
 * @returns {string} base URL with no trailing slash
 */
export function resolveBaseUrl(env = process.env, runtime = readRuntimeConfig()) {
  const configured = ((runtime && runtime.apiBaseUrl) || env.REACT_APP_API_BASE_URL || '').trim();
  return (configured || DEFAULT_BASE_URL).replace(/\/+$/, '');
}

/** @returns {{ apiBaseUrl?: string }} */
function readRuntimeConfig() {
  return (typeof window !== 'undefined' && window.__APP_CONFIG__) || {};
}

export const http = axios.create({
  baseURL: resolveBaseUrl(),
  timeout: Number(process.env.REACT_APP_API_TIMEOUT_MS) || DEFAULT_TIMEOUT_MS,
  headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
});

/**
 * Turn anything axios can throw into an ApiError with a message worth showing.
 *
 * @param {unknown} error
 * @returns {ApiError}
 */
export function toApiError(error) {
  if (error instanceof ApiError) return error;

  const response = error && error.response;
  if (response) {
    const messages = Array.isArray(response.data && response.data.errors)
      ? response.data.errors.filter(Boolean).map(String)
      : [];
    const message = messages.length > 0 ? messages.join(', ') : statusMessage(response.status);
    return new ApiError(message, { status: response.status, errors: messages, cause: error });
  }

  if (error && error.code === 'ECONNABORTED') {
    return new ApiError('The server took too long to answer. Please try again.', { cause: error });
  }

  return new ApiError('Could not reach the coffee shop API. Is the server running?', {
    cause: error,
  });
}

/** @param {number} status */
function statusMessage(status) {
  if (status === 404) return 'Not found.';
  if (status === 401 || status === 403) return 'You are not allowed to do that.';
  if (status >= 500) return 'The coffee shop API is having a bad day. Please try again.';
  return `Request failed (HTTP ${status}).`;
}

/**
 * @template T
 * @param {'get'|'post'|'put'|'patch'|'delete'} method
 * @param {string} path
 * @param {{ data?: unknown, params?: Record<string, unknown>, signal?: AbortSignal }} [options]
 * @returns {Promise<T>}
 */
export async function request(method, path, { data, params, signal } = {}) {
  try {
    const response = await http.request({ method, url: path, data, params, signal });
    return response.data;
  } catch (error) {
    throw toApiError(error);
  }
}

export const get = (path, options) => request('get', path, options);
export const post = (path, data, options) => request('post', path, { ...options, data });
export const put = (path, data, options) => request('put', path, { ...options, data });
export const del = (path, options) => request('delete', path, options);

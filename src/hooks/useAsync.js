import { useCallback, useEffect, useRef, useState } from 'react';

/** @typedef {'idle'|'loading'|'success'|'error'} AsyncStatus */

/**
 * Run an async function and expose its state as `{ status, data, error }`.
 *
 * Every screen in this app needs the same four states -- idle, loading,
 * loaded, failed -- and the original code had none of them: it called
 * `.then(setState)` and rendered "No Data Retrieved" whether the list was
 * genuinely empty or the request had blown up. One hook fixes that
 * everywhere, and it aborts in flight so a screen unmounted mid-request
 * neither warns nor overwrites fresher state.
 *
 * `fn` is a dependency: when it changes the hook re-runs, which is how the
 * customers screen turns a page. Callers must therefore wrap it in
 * `useCallback` with the inputs it closes over, exactly as they would for
 * `useEffect`.
 *
 * @template T
 * @param {(options: { signal: AbortSignal }) => Promise<T>} fn
 * @param {{ immediate?: boolean, initialData?: T }} [options]
 */
export default function useAsync(fn, { immediate = true, initialData = undefined } = {}) {
  const [status, setStatus] = useState(immediate ? 'loading' : 'idle');
  const [data, setData] = useState(initialData);
  const [error, setError] = useState(null);

  const controllerRef = useRef(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (controllerRef.current) controllerRef.current.abort();
    };
  }, []);

  const run = useCallback(async () => {
    if (controllerRef.current) controllerRef.current.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    setStatus('loading');
    setError(null);
    try {
      const result = await fn({ signal: controller.signal });
      if (!mountedRef.current || controller.signal.aborted) return undefined;
      setData(result);
      setStatus('success');
      return result;
    } catch (caught) {
      if (!mountedRef.current || controller.signal.aborted) return undefined;
      setError(caught);
      setStatus('error');
      return undefined;
    }
  }, [fn]);

  useEffect(() => {
    if (immediate) run();
  }, [immediate, run]);

  return { status, data, error, reload: run, setData };
}

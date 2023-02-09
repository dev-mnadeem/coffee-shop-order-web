import { useCallback, useEffect, useRef, useState } from 'react';

/** @typedef {'idle'|'loading'|'success'|'error'} AsyncStatus */

/**
 * Run an async function and expose its state as `{ status, data, error }`.
 *
 * Every screen needs the same four states -- idle, loading, loaded, failed --
 * so they live in one hook. It aborts in flight, so a screen unmounted
 * mid-request neither warns nor overwrites fresher state.
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
  const [state, setState] = useState({
    source: null,
    status: immediate ? 'loading' : 'idle',
    data: initialData,
    error: null,
  });
  const controllerRef = useRef(null);

  // State is only written after the await, never synchronously, so calling
  // this from an effect does not cascade renders.
  const execute = useCallback(
    async (controller) => {
      if (controllerRef.current) controllerRef.current.abort();
      controllerRef.current = controller;
      try {
        const result = await fn({ signal: controller.signal });
        if (controller.signal.aborted) return undefined;
        setState((current) => ({
          ...current,
          source: fn,
          status: 'success',
          data: result,
          error: null,
        }));
        return result;
      } catch (caught) {
        if (controller.signal.aborted) return undefined;
        setState((current) => ({ ...current, source: fn, status: 'error', error: caught }));
        return undefined;
      }
    },
    [fn]
  );

  useEffect(() => {
    if (!immediate) return undefined;
    const controller = new AbortController();
    execute(controller);
    return () => controller.abort();
  }, [immediate, execute]);

  const reload = useCallback(() => {
    setState((current) => ({ ...current, status: 'loading', error: null }));
    return execute(new AbortController());
  }, [execute]);

  const setData = useCallback(
    (update) =>
      setState((current) => ({
        ...current,
        data: typeof update === 'function' ? update(current.data) : update,
      })),
    []
  );

  // A new `fn` (the customers screen turning a page) is loading until it settles.
  const status =
    immediate && state.source !== fn && state.status !== 'idle' ? 'loading' : state.status;

  return { status, data: state.data, error: state.error, reload, setData };
}

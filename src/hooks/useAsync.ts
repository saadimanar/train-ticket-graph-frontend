import { useCallback, useEffect, useRef, useState } from 'react';
import { type ApiError, toApiError } from '../api/client';

export interface AsyncState<T> {
  status: 'idle' | 'loading' | 'error' | 'ready';
  /** Kept from the previous request while a new one is loading. */
  data: T | null;
  error: ApiError | null;
}

type Loader<T> = (signal: AbortSignal) => Promise<T>;

/**
 * Runs `load` whenever `key` changes, aborting the previous request.
 * Pass `null` as the loader to stay idle.
 */
export function useAsync<T>(load: Loader<T> | null, key: string) {
  const [state, setState] = useState<AsyncState<T>>({
    status: load ? 'loading' : 'idle',
    data: null,
    error: null,
  });
  const [attempt, setAttempt] = useState(0);

  const loadRef = useRef(load);
  loadRef.current = load;

  useEffect(() => {
    const run = loadRef.current;
    if (!run) {
      setState({ status: 'idle', data: null, error: null });
      return;
    }

    const controller = new AbortController();
    setState((previous) => ({ status: 'loading', data: previous.data, error: null }));

    run(controller.signal).then(
      (data) => {
        if (!controller.signal.aborted) setState({ status: 'ready', data, error: null });
      },
      (cause: unknown) => {
        if (!controller.signal.aborted) {
          setState({ status: 'error', data: null, error: toApiError(cause) });
        }
      },
    );

    return () => controller.abort();
  }, [key, attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  return { ...state, retry };
}

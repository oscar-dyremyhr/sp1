import { useCallback, useEffect, useState } from "react";

type State<T> = { key: string; base: string; data?: T; error?: Error };

/**
 * Tiny data-loading hook for the mock service, so loading states are real.
 * `key` identifies the request; change it to load again.
 */
export function useQuery<T>(key: string, fetcher: () => Promise<T>) {
  const [tick, setTick] = useState(0);
  const fullKey = `${key}#${tick}`;
  const [state, setState] = useState<State<T>>({ key: "", base: "" });

  useEffect(() => {
    let live = true;
    fetcher().then(
      (data) => live && setState({ key: fullKey, base: key, data }),
      (error: Error) => live && setState({ key: fullKey, base: key, error }),
    );
    return () => {
      live = false;
    };
    // The fetcher is identified by its key.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fullKey]);

  const reload = useCallback(() => setTick((t) => t + 1), []);
  const fresh = state.key === fullKey;
  return {
    /** Keeps showing the last data while a reload is in flight. */
    data: state.base === key ? state.data : undefined,
    error: fresh ? state.error : undefined,
    loading: !fresh,
    reload,
  };
}

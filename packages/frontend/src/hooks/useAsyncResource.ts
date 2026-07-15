import { useCallback, useEffect, useRef, useState } from "react";

interface UseAsyncResourceOptions {
  enabled?: boolean;
}

/**
 * Loads async data when `enabled` and whenever `deps` or reload() change.
 *
 * Callers typically pass an inline `loader` that closes over values listed in
 * `deps`. The latest loader is kept in a ref so re-renders with stable deps
 * do not re-fetch (which would loop forever if `loader` were an effect dep).
 */
export const useAsyncResource = <T>(
  loader: () => Promise<T>,
  deps: React.DependencyList,
  options: UseAsyncResourceOptions = {}
) => {
  const { enabled = true } = options;
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState<boolean>(enabled);
  const [reloadToken, setReloadToken] = useState(0);
  const loaderRef = useRef(loader);
  loaderRef.current = loader;

  const reload = useCallback(() => {
    setReloadToken((token) => token + 1);
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: re-fetch only when deps/reloadToken/enabled change; loader is read via ref
  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    let mounted = true;
    setLoading(true);
    setError(null);
    loaderRef
      .current()
      .then((result) => {
        if (mounted) {
          setData(result);
        }
      })
      .catch((err) => {
        if (mounted) {
          setError(
            err instanceof Error ? err : new Error("Unknown error occurred")
          );
        }
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [enabled, reloadToken, ...deps]);

  return { data, error, loading, reload };
};

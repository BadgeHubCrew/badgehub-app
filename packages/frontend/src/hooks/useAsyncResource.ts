import { useCallback, useEffect, useState } from "react";

interface UseAsyncResourceOptions {
  enabled?: boolean;
}

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

  const reload = useCallback(() => {
    setReloadToken((token) => token + 1);
  }, []);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    let mounted = true;
    setLoading(true);
    setError(null);
    loader()
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

import { useState, useEffect } from 'react';

export interface UseApiOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  autoFetch?: boolean;
}

export interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

export function useApi<T>(
  apiFunction: () => Promise<T>,
  options: UseApiOptions<T> = {}
) {
  const { onSuccess, onError, autoFetch = true } = options;
  
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: autoFetch,
    error: null,
  });

  const execute = async () => {
    setState({ data: null, loading: true, error: null });
    
    try {
      const result = await apiFunction();
      setState({ data: result, loading: false, error: null });
      onSuccess?.(result);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setState({ data: null, loading: false, error });
      onError?.(error);
      throw error;
    }
  };

  useEffect(() => {
    if (autoFetch) {
      execute();
    }
  }, []);

  return {
    ...state,
    execute,
    refetch: execute,
  };
}

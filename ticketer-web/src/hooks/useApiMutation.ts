import { useState } from 'react';

export function useApiMutation<TData, TVariables = void>(
  apiFunction: (variables: TVariables) => Promise<TData>
) {
  const [data, setData] = useState<TData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = async (variables: TVariables) => {
    setLoading(true);
    setError(null);

    try {
      const result = await apiFunction(variables);
      setData(result);
      setLoading(false);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      setLoading(false);
      throw error;
    }
  };

  const reset = () => {
    setData(null);
    setError(null);
    setLoading(false);
  };

  return {
    mutate,
    data,
    loading,
    error,
    reset,
  };
}

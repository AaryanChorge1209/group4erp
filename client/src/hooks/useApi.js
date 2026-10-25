import { useState, useEffect, useCallback } from 'react';
import api from '../lib/api';

export function useApi(url, options = {}) {
  const { immediate = true, params } = options;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState(null);

  const execute = useCallback(
    async (customParams) => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.get(url, { params: customParams || params });
        setData(response.data);
        return response.data;
      } catch (err) {
        setError(err.response?.data?.error || err.message || 'Something went wrong');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [url, JSON.stringify(params)]
  );

  useEffect(() => {
    if (immediate && url) {
      execute();
    }
  }, [execute, immediate, url]);

  return { data, loading, error, refetch: execute, setData };
}

export default useApi;

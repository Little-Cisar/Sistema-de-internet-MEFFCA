import { useCallback, useEffect, useState } from 'react';
import { errorMessage } from '../utils/apiHelpers';

export default function useApiResource(loader, dependencies = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const reload = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await loader();
      setData(response.data);
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setLoading(false);
    }
  // `dependencies` is intentionally supplied by each caller to define when data must reload.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);

  useEffect(() => { reload(); }, [reload]);
  return { data, setData, loading, error, reload };
}

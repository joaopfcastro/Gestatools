import { useEffect, useState, useCallback } from 'react';
import { ClinicalCodesCatalog } from '../types';
import { loadClinicalCodesCatalog, resetCatalogCache } from '../services/clinicalCodesCatalog';

export type CatalogStatus = 'loading' | 'success' | 'error';

export function useClinicalCodesCatalog() {
  const [catalog, setCatalog] = useState<ClinicalCodesCatalog | null>(null);
  const [status, setStatus] = useState<CatalogStatus>('loading');
  const [error, setError] = useState<string | null>(null);

  const fetchCatalog = useCallback(() => {
    setStatus('loading');
    setError(null);

    let isSubscribed = true;

    loadClinicalCodesCatalog()
      .then((data) => {
        if (isSubscribed) {
          setCatalog(data);
          setStatus('success');
        }
      })
      .catch((err) => {
        if (isSubscribed) {
          console.error('[useClinicalCodesCatalog error]', err);
          setError(err.message || 'Erro ao carregar base de códigos');
          setStatus('error');
        }
      });

    return () => {
      isSubscribed = false;
    };
  }, []);

  useEffect(() => {
    const cleanup = fetchCatalog();
    return cleanup;
  }, [fetchCatalog]);

  const reload = useCallback(() => {
    resetCatalogCache();
    fetchCatalog();
  }, [fetchCatalog]);

  return { catalog, status, error, reload };
}

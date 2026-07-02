// ── Hook condiviso per il pull-to-refresh: ricarica tutti i dati da Supabase a comando ──
import { useCallback, useState } from 'react';
import { useFinanceStore } from '../store/useFinanceStore';

export function usePullToRefresh() {
  const caricaDati = useFinanceStore((s) => s.caricaDati);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await caricaDati();
    setRefreshing(false);
  }, [caricaDati]);

  return { refreshing, onRefresh };
}

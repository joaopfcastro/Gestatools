import { useState, useCallback, useEffect } from 'react';
import {
  Cid10Record,
  ClinicalCodeMode,
  RecentClinicalCodeItem,
  RecentClinicalCodesState,
  SigtapProcedureRecord,
} from '../types';
import {
  getRecentItems,
  recordRecentItem,
  clearRecentHistory,
  RECENT_CODES_STORAGE_KEY,
} from '../services/clinicalCodesRecent';

export function useRecentClinicalCodes() {
  const [recentState, setRecentState] = useState<RecentClinicalCodesState>(() => getRecentItems());

  const refreshRecent = useCallback(() => {
    setRecentState(getRecentItems());
  }, []);

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === RECENT_CODES_STORAGE_KEY || event.key === null) {
        refreshRecent();
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('storage', handleStorage);
    };
  }, [refreshRecent]);

  const recordAccess = useCallback(
    (mode: ClinicalCodeMode, item: Cid10Record | SigtapProcedureRecord) => {
      const updated = recordRecentItem(mode, item);
      setRecentState(updated);
    },
    []
  );

  const clearHistory = useCallback((mode?: ClinicalCodeMode) => {
    const updated = clearRecentHistory(mode);
    setRecentState(updated);
  }, []);

  const isRecent = useCallback(
    (mode: ClinicalCodeMode, code: string): boolean => {
      const list = mode === 'cid' ? recentState.cids : recentState.procedures;
      return list.some((i) => i.code === code);
    },
    [recentState]
  );

  const activeRecentItems: RecentClinicalCodeItem[] =
    recentState.cids.length > 0 || recentState.procedures.length > 0
      ? []
      : [];

  return {
    recentState,
    recentCids: recentState.cids,
    recentProcedures: recentState.procedures,
    recordAccess,
    clearHistory,
    isRecent,
    refreshRecent,
  };
}

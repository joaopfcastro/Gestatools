import {
  Cid10Record,
  ClinicalCodeMode,
  RecentClinicalCodeItem,
  RecentClinicalCodesState,
  SigtapProcedureRecord,
} from '../types';

export const RECENT_CODES_STORAGE_KEY = 'gestatools_clinical_codes_recent_v1';
export const MAX_RECENT_ITEMS_PER_MODE = 3;

function createEmptyState(): RecentClinicalCodesState {
  return {
    version: 1,
    cids: [],
    procedures: [],
  };
}

export function getRecentItems(): RecentClinicalCodesState {
  if (typeof window === 'undefined' || !window.localStorage) {
    return createEmptyState();
  }

  try {
    const raw = localStorage.getItem(RECENT_CODES_STORAGE_KEY);
    if (!raw) {
      return createEmptyState();
    }

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') {
      return createEmptyState();
    }

    // Sanitize state arrays
    const cids = Array.isArray(parsed.cids)
      ? parsed.cids
          .filter((item: unknown): item is RecentClinicalCodeItem => {
            return (
              Boolean(item) &&
              typeof item === 'object' &&
              typeof (item as RecentClinicalCodeItem).code === 'string' &&
              typeof (item as RecentClinicalCodeItem).displayCode === 'string' &&
              typeof (item as RecentClinicalCodeItem).accessedAt === 'string'
            );
          })
          .slice(0, MAX_RECENT_ITEMS_PER_MODE)
      : [];

    const procedures = Array.isArray(parsed.procedures)
      ? parsed.procedures
          .filter((item: unknown): item is RecentClinicalCodeItem => {
            return (
              Boolean(item) &&
              typeof item === 'object' &&
              typeof (item as RecentClinicalCodeItem).code === 'string' &&
              typeof (item as RecentClinicalCodeItem).displayCode === 'string' &&
              typeof (item as RecentClinicalCodeItem).accessedAt === 'string'
            );
          })
          .slice(0, MAX_RECENT_ITEMS_PER_MODE)
      : [];

    return {
      version: 1,
      cids,
      procedures,
    };
  } catch (err) {
    console.warn('[RecentCodes] Erro ao ler histórico do localStorage:', err);
    return createEmptyState();
  }
}

function saveRecentState(state: RecentClinicalCodesState): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    localStorage.setItem(RECENT_CODES_STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.warn('[RecentCodes] Erro ao salvar histórico no localStorage:', err);
  }
}

export function recordRecentItem(
  mode: ClinicalCodeMode,
  item: Cid10Record | SigtapProcedureRecord
): RecentClinicalCodesState {
  const currentState = getRecentItems();
  const nowIso = new Date().toISOString();

  const isCid = mode === 'cid';
  const targetList = isCid ? [...currentState.cids] : [...currentState.procedures];

  // Remove existing entry with matching code if present
  const filtered = targetList.filter((existing) => existing.code !== item.code);

  const newItem: RecentClinicalCodeItem = {
    code: item.code,
    displayCode: item.displayCode,
    description: isCid
      ? (item as Cid10Record).description
      : (item as SigtapProcedureRecord).name,
    accessedAt: nowIso,
  };

  // Add new item to front of list
  const updatedList = [newItem, ...filtered].slice(0, MAX_RECENT_ITEMS_PER_MODE);

  const newState: RecentClinicalCodesState = {
    ...currentState,
    [isCid ? 'cids' : 'procedures']: updatedList,
  };

  saveRecentState(newState);
  return newState;
}

export function clearRecentHistory(mode?: ClinicalCodeMode): RecentClinicalCodesState {
  const currentState = getRecentItems();
  let newState: RecentClinicalCodesState;

  if (!mode) {
    newState = createEmptyState();
  } else if (mode === 'cid') {
    newState = {
      ...currentState,
      cids: [],
    };
  } else {
    newState = {
      ...currentState,
      procedures: [],
    };
  }

  saveRecentState(newState);
  return newState;
}

export function isRecentItem(mode: ClinicalCodeMode, code: string): boolean {
  const state = getRecentItems();
  const targetList = mode === 'cid' ? state.cids : state.procedures;
  return targetList.some((item) => item.code === code);
}

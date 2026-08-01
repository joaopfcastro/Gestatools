import { describe, it, expect, beforeEach, beforeAll } from 'vitest';
import {
  getRecentItems,
  recordRecentItem,
  clearRecentHistory,
  isRecentItem,
} from '../src/services/clinicalCodesRecent';
import { Cid10Record, SigtapProcedureRecord } from '../src/types';

function createLocalStorageMock() {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = String(value);
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
}

describe('clinicalCodesRecent service', () => {
  beforeAll(() => {
    Object.defineProperty(globalThis, 'window', {
      value: {
        localStorage: createLocalStorageMock(),
      },
      writable: true,
    });
    Object.defineProperty(globalThis, 'localStorage', {
      value: (globalThis.window as any).localStorage,
      writable: true,
    });
  });

  beforeEach(() => {
    localStorage.clear();
  });

  const sampleCid: Cid10Record = {
    code: 'O80',
    displayCode: 'O80',
    description: 'PARTO UNICO ESPONTANEO',
    searchText: 'O80 PARTO UNICO ESPONTANEO',
  };

  const sampleProc: SigtapProcedureRecord = {
    code: '0310010039',
    displayCode: '03.10.01.003-9',
    name: 'PARTO NORMAL',
    searchText: '0310010039 PARTO NORMAL',
  };

  it('starts with empty history', () => {
    const history = getRecentItems();
    expect(history.cids).toEqual([]);
    expect(history.procedures).toEqual([]);
  });

  it('records a CID item and retrieves it in recent history', () => {
    recordRecentItem('cid', sampleCid);
    const history = getRecentItems();
    expect(history.cids).toHaveLength(1);
    expect(history.cids[0].code).toBe('O80');
    expect(history.cids[0].description).toBe('PARTO UNICO ESPONTANEO');
    expect(isRecentItem('cid', 'O80')).toBe(true);
    expect(isRecentItem('cid', 'O82')).toBe(false);
  });

  it('records a Procedure item and retrieves it in recent history', () => {
    recordRecentItem('procedure', sampleProc);
    const history = getRecentItems();
    expect(history.procedures).toHaveLength(1);
    expect(history.procedures[0].code).toBe('0310010039');
    expect(history.procedures[0].description).toBe('PARTO NORMAL');
    expect(isRecentItem('procedure', '0310010039')).toBe(true);
  });

  it('moves existing item to top when accessed again', () => {
    const cid1: Cid10Record = { ...sampleCid, code: 'O80', displayCode: 'O80' };
    const cid2: Cid10Record = { ...sampleCid, code: 'O82', displayCode: 'O82' };

    recordRecentItem('cid', cid1);
    recordRecentItem('cid', cid2);

    let history = getRecentItems();
    expect(history.cids.map((c) => c.code)).toEqual(['O82', 'O80']);

    // Record cid1 again
    recordRecentItem('cid', cid1);
    history = getRecentItems();
    expect(history.cids.map((c) => c.code)).toEqual(['O80', 'O82']);
  });

  it('limits history to max 3 items per mode', () => {
    for (let i = 1; i <= 15; i++) {
      const cid: Cid10Record = {
        code: `O8${i}`,
        displayCode: `O8${i}`,
        description: `PARTO ${i}`,
        searchText: `O8${i} PARTO ${i}`,
      };
      recordRecentItem('cid', cid);
    }

    const history = getRecentItems();
    expect(history.cids).toHaveLength(3);
    // Most recent is O815
    expect(history.cids[0].code).toBe('O815');
    // Oldest retained is O813
    expect(history.cids[2].code).toBe('O813');
  });

  it('clears recent history completely or by mode', () => {
    recordRecentItem('cid', sampleCid);
    recordRecentItem('procedure', sampleProc);

    clearRecentHistory('cid');
    let history = getRecentItems();
    expect(history.cids).toHaveLength(0);
    expect(history.procedures).toHaveLength(1);

    clearRecentHistory();
    history = getRecentItems();
    expect(history.cids).toHaveLength(0);
    expect(history.procedures).toHaveLength(0);
  });
});

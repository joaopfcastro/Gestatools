import { describe, it, expect } from 'vitest';
import {
  normalizeClinicalText,
  normalizeCidCode,
  normalizeProcedureCode,
  formatSigtapCode,
  formatCidCode,
  rankCidResult,
  rankProcedureResult,
} from '../src/utils/clinicalCodes';
import { Cid10Record, SigtapProcedureRecord } from '../src/types';

describe('clinicalCodes utilities', () => {
  it('normalizes clinical text removing accents, special chars and casing', () => {
    expect(normalizeClinicalText('Pré-eclâmpsia')).toBe('PRE ECLAMPSIA');
    expect(normalizeClinicalText('PARTO ÚNICO ESPONTÂNEO')).toBe('PARTO UNICO ESPONTANEO');
    expect(normalizeClinicalText('  hipertensão  gestacional  ')).toBe('HIPERTENSAO GESTACIONAL');
  });

  it('normalizes CID-10 codes', () => {
    expect(normalizeCidCode('o26.8')).toBe('O268');
    expect(normalizeCidCode('O80')).toBe('O80');
    expect(normalizeCidCode(' z34.0 ')).toBe('Z340');
  });

  it('normalizes SIGTAP procedure codes to digits', () => {
    expect(normalizeProcedureCode('03.10.01.003-9')).toBe('0310010039');
    expect(normalizeProcedureCode('0310010039')).toBe('0310010039');
  });

  it('formats SIGTAP procedure codes with standard dot/dash notation', () => {
    expect(formatSigtapCode('0310010039')).toBe('03.10.01.003-9');
    expect(formatSigtapCode('123')).toBe('123');
  });

  it('formats CID-10 code with dot notation', () => {
    expect(formatCidCode('O268')).toBe('O26.8');
    expect(formatCidCode('O80')).toBe('O80');
  });

  it('ranks CID-10 search results deterministically', () => {
    const cidRecord: Cid10Record = {
      code: 'O80',
      displayCode: 'O80',
      description: 'PARTO UNICO ESPONTANEO',
      searchText: 'O80 PARTO UNICO ESPONTANEO',
    };

    // Exact code match
    expect(rankCidResult(cidRecord, 'O80', 'O80', 'O80')).toBe(1000);

    // Prefix match
    expect(rankCidResult(cidRecord, 'O8', 'O8', 'O8')).toBe(900);

    // Description match
    expect(rankCidResult(cidRecord, 'PARTO', 'PARTO', '')).toBe(800);
  });

  it('ranks SIGTAP procedure search results deterministically', () => {
    const procRecord: SigtapProcedureRecord = {
      code: '0310010039',
      displayCode: '03.10.01.003-9',
      name: 'PARTO NORMAL',
      searchText: '0310010039 PARTO NORMAL',
    };

    // Exact 10-digit code match
    expect(rankProcedureResult(procRecord, '0310010039', '0310010039', '0310010039')).toBe(1000);

    // Code prefix match
    expect(rankProcedureResult(procRecord, '0310', '0310', '0310')).toBe(900);

    // Name match
    expect(rankProcedureResult(procRecord, 'PARTO', 'PARTO', '')).toBe(800);
  });
});

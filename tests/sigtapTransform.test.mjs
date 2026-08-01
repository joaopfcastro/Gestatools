import { describe, it, expect } from 'vitest';
import {
  transformCidRecords,
  transformProcedureRecords,
  transformRelationRecords,
  createManifest,
} from '../scripts/lib/sigtapTransform.mjs';

describe('sigtapTransform', () => {
  it('transforms raw CID records into Cid10Record format', () => {
    const raw = [
      { CO_CID: 'O80', NO_CID: 'Parto único espontâneo' },
      { CO_CID: 'O26.8', NO_CID: 'Outras afecções especificadas ligadas à gravidez' },
    ];
    const cids = transformCidRecords(raw);

    expect(cids).toHaveLength(2);
    expect(cids[0].code).toBe('O268');
    expect(cids[0].displayCode).toBe('O26.8');
    expect(cids[1].code).toBe('O80');
    expect(cids[1].displayCode).toBe('O80');
  });

  it('transforms raw procedure records into SigtapProcedureRecord format', () => {
    const raw = [
      { CO_PROCEDIMENTO: '0310010039', NO_PROCEDIMENTO: 'Parto normal', DS_PROCEDIMENTO: 'Assistência ao parto normal' },
    ];
    const procedures = transformProcedureRecords(raw);

    expect(procedures).toHaveLength(1);
    expect(procedures[0].code).toBe('0310010039');
    expect(procedures[0].displayCode).toBe('03.10.01.003-9');
    expect(procedures[0].name).toBe('PARTO NORMAL');
  });

  it('filters orphan relations', () => {
    const rawRelations = [
      { CO_CID: 'O80', CO_PROCEDIMENTO: '0310010039', ST_PRINCIPAL: 'S' },
      { CO_CID: 'O99', CO_PROCEDIMENTO: '0310010039', ST_PRINCIPAL: 'S' }, // O99 invalid
    ];

    const validCids = new Set(['O80']);
    const validProcedures = new Set(['0310010039']);

    const relations = transformRelationRecords(rawRelations, validCids, validProcedures);
    expect(relations).toHaveLength(1);
    expect(relations[0].cidCode).toBe('O80');
    expect(relations[0].relationType).toBe('principal');
  });

  it('creates valid manifest', () => {
    const manifest = createManifest('202607', { cids: 10, procedures: 5, relations: 15 });
    expect(manifest.competence).toBe('202607');
    expect(manifest.competenceLabel).toBe('07/2026');
    expect(manifest.counts.cids).toBe(10);
  });
});

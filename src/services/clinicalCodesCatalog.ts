import {
  Cid10Record,
  CidProcedureRelation,
  ClinicalCodesCatalog,
  ClinicalCodesManifest,
  ClinicalCodeSearchMode,
  SigtapProcedureRecord,
} from '../types';
import {
  normalizeCidCode,
  normalizeClinicalText,
  normalizeProcedureCode,
  rankCidResult,
  rankProcedureResult,
} from '../utils/clinicalCodes';

let catalogPromise: Promise<ClinicalCodesCatalog> | null = null;

export function resetCatalogCache() {
  catalogPromise = null;
}

export function loadClinicalCodesCatalog(): Promise<ClinicalCodesCatalog> {
  if (!catalogPromise) {
    catalogPromise = fetchAndBuildCatalog().catch((err) => {
      catalogPromise = null; // Clear on error so retry works
      throw err;
    });
  }
  return catalogPromise;
}

async function fetchAndBuildCatalog(): Promise<ClinicalCodesCatalog> {
  const manifestRes = await fetch('/data/clinical-codes/manifest.json');
  if (!manifestRes.ok) {
    throw new Error(`Falha ao carregar manifesto (${manifestRes.status})`);
  }

  const manifest: ClinicalCodesManifest = await manifestRes.json();
  const basePath = manifest.basePath || `/data/clinical-codes/${manifest.competence}`;

  const [cidsRes, procsRes, relsRes] = await Promise.all([
    fetch(`${basePath}/${manifest.files.cids}`),
    fetch(`${basePath}/${manifest.files.procedures}`),
    fetch(`${basePath}/${manifest.files.relations}`),
  ]);

  if (!cidsRes.ok || !procsRes.ok || !relsRes.ok) {
    throw new Error('Falha ao baixar arquivos do catálogo de códigos');
  }

  const cids: Cid10Record[] = await cidsRes.json();
  const procedures: SigtapProcedureRecord[] = await procsRes.json();
  const relations: CidProcedureRelation[] = await relsRes.json();

  const cidByCode = new Map<string, Cid10Record>();
  for (const item of cids) {
    cidByCode.set(item.code, item);
  }

  const procedureByCode = new Map<string, SigtapProcedureRecord>();
  for (const item of procedures) {
    procedureByCode.set(item.code, item);
  }

  const proceduresByCid = new Map<string, CidProcedureRelation[]>();
  const cidsByProcedure = new Map<string, CidProcedureRelation[]>();

  for (const rel of relations) {
    if (!cidByCode.has(rel.cidCode) || !procedureByCode.has(rel.procedureCode)) {
      continue;
    }

    // Map procedures for a given CID
    if (!proceduresByCid.has(rel.cidCode)) {
      proceduresByCid.set(rel.cidCode, []);
    }
    proceduresByCid.get(rel.cidCode)!.push(rel);

    // Map CIDs for a given procedure
    if (!cidsByProcedure.has(rel.procedureCode)) {
      cidsByProcedure.set(rel.procedureCode, []);
    }
    cidsByProcedure.get(rel.procedureCode)!.push(rel);
  }

  return {
    manifest,
    cids,
    procedures,
    relations,
    cidByCode,
    procedureByCode,
    proceduresByCid,
    cidsByProcedure,
  };
}

export function searchCids(catalog: ClinicalCodesCatalog, rawQuery: string): Cid10Record[] {
  const normQuery = normalizeClinicalText(rawQuery);
  const normCodeQuery = normalizeCidCode(rawQuery);

  if (!normQuery && !normCodeQuery) return [];

  const ranked: { record: Cid10Record; score: number }[] = [];

  for (const record of catalog.cids) {
    const score = rankCidResult(record, rawQuery, normQuery, normCodeQuery);
    if (score > 0) {
      ranked.push({ record, score });
    }
  }

  ranked.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (a.record.description.length !== b.record.description.length) {
      return a.record.description.length - b.record.description.length;
    }
    return a.record.code.localeCompare(b.record.code);
  });

  return ranked.map((r) => r.record);
}

export function searchProcedures(catalog: ClinicalCodesCatalog, rawQuery: string): SigtapProcedureRecord[] {
  const normQuery = normalizeClinicalText(rawQuery);
  const normDigitsQuery = normalizeProcedureCode(rawQuery);

  if (!normQuery && !normDigitsQuery) return [];

  const ranked: { record: SigtapProcedureRecord; score: number }[] = [];

  for (const record of catalog.procedures) {
    const score = rankProcedureResult(record, rawQuery, normQuery, normDigitsQuery);
    if (score > 0) {
      ranked.push({ record, score });
    }
  }

  ranked.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (a.record.name.length !== b.record.name.length) {
      return a.record.name.length - b.record.name.length;
    }
    return a.record.code.localeCompare(b.record.code);
  });

  return ranked.map((r) => r.record);
}

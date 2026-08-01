/**
 * SIGTAP data transformation, validation, and indexing helpers.
 */

export function normalizeClinicalText(value) {
  if (!value) return '';
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function formatSigtapCode(code) {
  const digits = String(code).replace(/\D/g, '');
  if (digits.length !== 10) return code;
  return `${digits.slice(0, 2)}.${digits.slice(2, 4)}.${digits.slice(4, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

export function formatCidCode(code) {
  if (!code) return '';
  const clean = String(code).toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (clean.length > 3 && !code.includes('.')) {
    return `${clean.slice(0, 3)}.${clean.slice(3)}`;
  }
  return String(code).toUpperCase();
}

export function transformCidRecords(rawCids) {
  const cids = [];
  const seen = new Set();

  for (const raw of rawCids) {
    const rawCode = (raw.CO_CID || raw.code || raw.CO_DIAGNOSTICO || '').trim().toUpperCase();
    const rawDesc = (raw.NO_CID || raw.description || raw.NO_DIAGNOSTICO || '').trim();

    if (!rawCode) continue;

    const code = rawCode.replace(/[^A-Z0-9]/g, '');
    if (seen.has(code)) continue;
    seen.add(code);

    const displayCode = formatCidCode(code);
    const normDesc = normalizeClinicalText(rawDesc);
    const searchText = `${code} ${displayCode.replace('.', '')} ${normDesc}`;

    cids.push({
      code,
      displayCode,
      description: rawDesc.toUpperCase(),
      searchText,
    });
  }

  // Sort by code
  cids.sort((a, b) => a.code.localeCompare(b.code));
  return cids;
}

export function transformProcedureRecords(rawProcedures, groupsMap = {}, subgroupsMap = {}, orgsMap = {}) {
  const procedures = [];
  const seen = new Set();

  for (const raw of rawProcedures) {
    const rawCode = (raw.CO_PROCEDIMENTO || raw.code || '').trim();
    const rawName = (raw.NO_PROCEDIMENTO || raw.name || '').trim();
    if (!rawCode) continue;

    const digits = rawCode.replace(/\D/g, '');
    if (digits.length !== 10) continue;
    if (seen.has(digits)) continue;
    seen.add(digits);

    const displayCode = formatSigtapCode(digits);
    const normName = normalizeClinicalText(rawName);

    const groupCode = raw.CO_GRUPO || digits.slice(0, 2);
    const subgroupCode = raw.CO_SUB_GRUPO || digits.slice(2, 4);
    const organizationCode = raw.CO_FORMA_ORGANIZACAO || digits.slice(4, 6);

    const groupName = groupsMap[groupCode] || raw.groupName || '';
    const subgroupName = subgroupsMap[`${groupCode}${subgroupCode}`] || raw.subgroupName || '';
    const organizationName = orgsMap[`${groupCode}${subgroupCode}${organizationCode}`] || raw.organizationName || '';

    const description = (raw.DS_PROCEDIMENTO || raw.description || '').trim();

    const searchText = `${digits} ${displayCode} ${normName} ${normalizeClinicalText(description)}`;

    procedures.push({
      code: digits,
      displayCode,
      name: rawName.toUpperCase(),
      description: description ? description.toUpperCase() : '',
      groupCode,
      groupName: groupName ? groupName.toUpperCase() : '',
      subgroupCode,
      subgroupName: subgroupName ? subgroupName.toUpperCase() : '',
      organizationCode,
      organizationName: organizationName ? organizationName.toUpperCase() : '',
      searchText,
    });
  }

  // Sort by name, then code
  procedures.sort((a, b) => a.name.localeCompare(b.name) || a.code.localeCompare(b.code));
  return procedures;
}

export function transformRelationRecords(rawRelations, validCidsSet, validProceduresSet) {
  const relations = [];
  const seen = new Set();

  for (const raw of rawRelations) {
    let cidCode = (raw.CO_CID || raw.cidCode || raw.CO_DIAGNOSTICO || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    let procedureCode = (raw.CO_PROCEDIMENTO || raw.procedureCode || '').trim().replace(/\D/g, '');

    if (!cidCode || !procedureCode) continue;

    if (!validCidsSet.has(cidCode) || !validProceduresSet.has(procedureCode)) {
      // Ignore orphan relation
      continue;
    }

    const key = `${cidCode}:${procedureCode}`;
    if (seen.has(key)) continue;
    seen.add(key);

    let relationType = 'unspecified';
    const st = (raw.ST_PRINCIPAL || raw.relationType || '').trim().toLowerCase();
    if (st === 's' || st === '1' || st === 'principal' || st === 'p') {
      relationType = 'principal';
    } else if (st === 'n' || st === '0' || st === 'secondary' || st === 'secundario' || st === 'secundária') {
      relationType = 'secondary';
    }

    relations.push({
      cidCode,
      procedureCode,
      relationType,
    });
  }

  // Sort: principal first, then cidCode, then procedureCode
  relations.sort((a, b) => {
    if (a.relationType !== b.relationType) {
      if (a.relationType === 'principal') return -1;
      if (b.relationType === 'principal') return 1;
    }
    if (a.cidCode !== b.cidCode) return a.cidCode.localeCompare(b.cidCode);
    return a.procedureCode.localeCompare(b.procedureCode);
  });

  return relations;
}

export function createManifest(
  competence,
  counts,
  basePath = `/data/clinical-codes/${competence}`,
  sourceFiles = [],
  hashes = undefined,
  sizes = undefined
) {
  const mm = competence.slice(4, 6);
  const yyyy = competence.slice(0, 4);

  const manifest = {
    schemaVersion: 2,
    competence,
    competenceLabel: `${mm}/${yyyy}`,
    generatedAt: new Date().toISOString(),
    source: 'SIGTAP/DATASUS',
    basePath,
    counts,
    files: {
      cids: 'cids.json',
      procedures: 'procedures.json',
      relations: 'relations.json',
    },
  };

  if (sourceFiles && sourceFiles.length > 0) {
    manifest.sourceFiles = sourceFiles;
  }
  if (sizes) {
    manifest.sizes = sizes;
  }
  if (hashes) {
    manifest.hashes = hashes;
  }

  return manifest;
}


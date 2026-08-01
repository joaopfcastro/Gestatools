import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    dir: path.resolve(__dirname, '../public/data/clinical-codes'),
    competence: '',
    allowSampleData: false,
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--dir' && args[i + 1]) {
      options.dir = args[++i];
    } else if (args[i] === '--competence' && args[i + 1]) {
      options.competence = args[++i];
    } else if (args[i] === '--allow-sample-data' || args[i] === '--allow-fixture') {
      options.allowSampleData = true;
    }
  }

  return options;
}

function computeSha256(content) {
  return crypto.createHash('sha256').update(content, 'utf-8').digest('hex');
}

export function validateClinicalCodesCatalog(options) {
  const errors = [];
  const warnings = [];

  const manifestPath = path.join(options.dir, 'manifest.json');
  if (!fs.existsSync(manifestPath)) {
    return { valid: false, errors: [`Manifesto não encontrado em "${manifestPath}"`], warnings };
  }

  let manifest;
  try {
    manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
  } catch (e) {
    return { valid: false, errors: [`Erro ao ler manifesto JSON: ${e.message}`], warnings };
  }

  // 1. Competence format
  if (!manifest.competence || !/^\d{6}$/.test(manifest.competence)) {
    errors.push(`Competência inválida no manifesto: "${manifest.competence}". Esperado formato AAAAMM.`);
  }

  if (options.competence && manifest.competence !== options.competence) {
    errors.push(`Competência do manifesto (${manifest.competence}) diverge da solicitada (${options.competence}).`);
  }

  // 2. Base path and files existence
  const competenceDir = path.join(options.dir, manifest.competence);
  if (!fs.existsSync(competenceDir)) {
    errors.push(`Diretório da competência não encontrado: "${competenceDir}"`);
    return { valid: false, errors, warnings };
  }

  const cidsFile = path.join(competenceDir, manifest.files?.cids || 'cids.json');
  const procsFile = path.join(competenceDir, manifest.files?.procedures || 'procedures.json');
  const relsFile = path.join(competenceDir, manifest.files?.relations || 'relations.json');

  if (!fs.existsSync(cidsFile)) errors.push(`Arquivo de CIDs não encontrado: "${cidsFile}"`);
  if (!fs.existsSync(procsFile)) errors.push(`Arquivo de procedimentos não encontrado: "${procsFile}"`);
  if (!fs.existsSync(relsFile)) errors.push(`Arquivo de relações não encontrado: "${relsFile}"`);

  if (errors.length > 0) {
    return { valid: false, errors, warnings };
  }

  // 3. File content and parsing
  let cids = [];
  let procedures = [];
  let relations = [];

  try {
    const cidsRaw = fs.readFileSync(cidsFile, 'utf-8');
    cids = JSON.parse(cidsRaw);
    if (manifest.hashes?.cids) {
      const hash = computeSha256(cidsRaw);
      if (hash !== manifest.hashes.cids) {
        errors.push(`Hash SHA-256 do cids.json diverge do manifesto.`);
      }
    }
  } catch (e) {
    errors.push(`Falha ao ler/parsear cids.json: ${e.message}`);
  }

  try {
    const procsRaw = fs.readFileSync(procsFile, 'utf-8');
    procedures = JSON.parse(procsRaw);
    if (manifest.hashes?.procedures) {
      const hash = computeSha256(procsRaw);
      if (hash !== manifest.hashes.procedures) {
        errors.push(`Hash SHA-256 do procedures.json diverge do manifesto.`);
      }
    }
  } catch (e) {
    errors.push(`Falha ao ler/parsear procedures.json: ${e.message}`);
  }

  try {
    const relsRaw = fs.readFileSync(relsFile, 'utf-8');
    relations = JSON.parse(relsRaw);
    if (manifest.hashes?.relations) {
      const hash = computeSha256(relsRaw);
      if (hash !== manifest.hashes.relations) {
        errors.push(`Hash SHA-256 do relations.json diverge do manifesto.`);
      }
    }
  } catch (e) {
    errors.push(`Falha ao ler/parsear relations.json: ${e.message}`);
  }

  if (errors.length > 0) {
    return { valid: false, errors, warnings };
  }

  // 4. Record count checks
  if (cids.length !== manifest.counts.cids) {
    errors.push(`Contagem real de CIDs (${cids.length}) difere do manifesto (${manifest.counts.cids}).`);
  }

  if (procedures.length !== manifest.counts.procedures) {
    errors.push(`Contagem real de procedimentos (${procedures.length}) difere do manifesto (${manifest.counts.procedures}).`);
  }

  if (relations.length !== manifest.counts.relations) {
    errors.push(`Contagem real de relações (${relations.length}) difere do manifesto (${manifest.counts.relations}).`);
  }

  // 5. Code Uniqueness
  const cidCodes = new Set();
  for (const c of cids) {
    if (!c.code) {
      errors.push(`CID com código vazio detectado.`);
      continue;
    }
    if (cidCodes.has(c.code)) {
      errors.push(`Código CID duplicado em cids.json: "${c.code}"`);
    }
    cidCodes.add(c.code);
  }

  const procCodes = new Set();
  for (const p of procedures) {
    if (!p.code) {
      errors.push(`Procedimento com código vazio detectado.`);
      continue;
    }
    if (procCodes.has(p.code)) {
      errors.push(`Código de procedimento duplicado em procedures.json: "${p.code}"`);
    }
    procCodes.add(p.code);
  }

  // 6. Relation Integrity (No Orphans)
  const relKeys = new Set();
  let orphanCount = 0;
  for (const r of relations) {
    if (!r.cidCode || !r.procedureCode) {
      errors.push(`Relação com código ausente detectada.`);
      continue;
    }
    if (!cidCodes.has(r.cidCode)) {
      errors.push(`Relação órfã: CID "${r.cidCode}" não existe em cids.json.`);
      orphanCount++;
    }
    if (!procCodes.has(r.procedureCode)) {
      errors.push(`Relação órfã: Procedimento "${r.procedureCode}" não existe em procedures.json.`);
      orphanCount++;
    }

    const key = `${r.cidCode}:${r.procedureCode}:${r.relationType}`;
    if (relKeys.has(key)) {
      errors.push(`Relação duplicada detectada: ${key}`);
    }
    relKeys.add(key);
  }

  // 7. Small dataset detection
  if (!options.allowSampleData && (cids.length < 500 || procedures.length < 200)) {
    errors.push(
      `Erro: catálogo SIGTAP inválido (suspeitosamente pequeno). Foram encontrados apenas ${cids.length} CIDs e ${procedures.length} procedimentos. Uma base oficial completa era esperada. Verifique os arquivos informados em --input.`
    );
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    summary: {
      competence: manifest.competence,
      competenceLabel: manifest.competenceLabel,
      cids: cids.length,
      procedures: procedures.length,
      relations: relations.length,
      orphans: orphanCount,
    },
  };
}

function runCLI() {
  const options = parseArgs();
  console.log(`[SIGTAP Validate] Validando catálogo em: ${options.dir}`);

  const result = validateClinicalCodesCatalog(options);

  if (!result.valid) {
    console.error('\n[SIGTAP Validate ERROR] A validação falhou com os seguintes erros:');
    result.errors.forEach((err) => console.error(` - ${err}`));
    process.exit(1);
  }

  if (result.warnings.length > 0) {
    console.warn('\n[SIGTAP Validate WARNINGS]:');
    result.warnings.forEach((w) => console.warn(` - ${w}`));
  }

  console.log('\n[SIGTAP Validate SUCCESS] Catálogo validado com sucesso!');
  console.log(` - Competência: ${result.summary.competenceLabel} (${result.summary.competence})`);
  console.log(` - CIDs válidos: ${result.summary.cids}`);
  console.log(` - Procedimentos válidos: ${result.summary.procedures}`);
  console.log(` - Relações íntegras: ${result.summary.relations}`);
}

// Only execute CLI if run directly
if (process.argv[1] && process.argv[1].endsWith('validate-clinical-codes.mjs')) {
  runCLI();
}

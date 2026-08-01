import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import {
  parseLayoutFile,
  parseFixedWidthData,
} from './lib/fixedWidthParser.mjs';
import {
  transformCidRecords,
  transformProcedureRecords,
  transformRelationRecords,
  createManifest,
} from './lib/sigtapTransform.mjs';
import {
  SAMPLE_CIDS,
  SAMPLE_PROCEDURES,
  SAMPLE_RELATIONS,
} from '../tests/fixtures/clinical-codes/sampleData.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to parse CLI args
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    input: '',
    competence: '202607',
    output: path.resolve(__dirname, '../public/data/clinical-codes'),
    strict: false,
    allowSampleData: false,
    pretty: false,
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--input' && args[i + 1]) {
      options.input = args[++i];
    } else if (args[i] === '--competence' && args[i + 1]) {
      options.competence = args[++i];
    } else if (args[i] === '--output' && args[i + 1]) {
      options.output = args[++i];
    } else if (args[i] === '--strict') {
      options.strict = true;
    } else if (args[i] === '--allow-sample-data' || args[i] === '--allow-fixture') {
      options.allowSampleData = true;
    } else if (args[i] === '--pretty') {
      options.pretty = true;
    }
  }

  return options;
}

// Case-insensitive file resolver in a directory
function findFileInDir(dir, targetName) {
  if (!fs.existsSync(dir)) return null;
  const files = fs.readdirSync(dir);
  const targetLower = targetName.toLowerCase();
  for (const f of files) {
    if (f.toLowerCase() === targetLower) {
      return path.join(dir, f);
    }
  }
  return null;
}

function computeSha256(content) {
  return crypto.createHash('sha256').update(content, 'utf-8').digest('hex');
}

function buildDataset() {
  const options = parseArgs();

  console.log(`[SIGTAP Build] Target competence: ${options.competence}`);
  console.log(`[SIGTAP Build] Output directory: ${options.output}`);
  if (options.strict) {
    console.log('[SIGTAP Build] Strict mode enabled. Fallbacks and partial data are forbidden.');
  }

  let rawCids = null;
  let rawProcedures = null;
  let rawRelations = null;
  const sourceFiles = [];

  if (options.input) {
    if (!fs.existsSync(options.input)) {
      console.error(`[SIGTAP Build Error] A pasta informada em --input não existe: "${options.input}"`);
      process.exit(1);
    }

    console.log(`[SIGTAP Build] Lendo diretório oficial em --input: ${options.input}`);

    const cidLayoutPath = findFileInDir(options.input, 'tb_cid_layout.txt');
    const cidDataPath = findFileInDir(options.input, 'tb_cid.txt');
    const procLayoutPath = findFileInDir(options.input, 'tb_procedimento_layout.txt');
    const procDataPath = findFileInDir(options.input, 'tb_procedimento.txt');
    const relLayoutPath = findFileInDir(options.input, 'rl_procedimento_cid_layout.txt');
    const relDataPath = findFileInDir(options.input, 'rl_procedimento_cid.txt');

    const missingFiles = [];
    if (!cidLayoutPath) missingFiles.push('tb_cid_layout.txt');
    if (!cidDataPath) missingFiles.push('tb_cid.txt');
    if (!procLayoutPath) missingFiles.push('tb_procedimento_layout.txt');
    if (!procDataPath) missingFiles.push('tb_procedimento.txt');
    if (!relLayoutPath) missingFiles.push('rl_procedimento_cid_layout.txt');
    if (!relDataPath) missingFiles.push('rl_procedimento_cid.txt');

    if (missingFiles.length > 0) {
      console.error(`[SIGTAP Build Error] Arquivos obrigatórios ausentes na pasta informada:\n - ${missingFiles.join('\n - ')}`);
      process.exit(1);
    }

    try {
      const cidLayout = parseLayoutFile(fs.readFileSync(cidLayoutPath, 'latin1'));
      rawCids = parseFixedWidthData(fs.readFileSync(cidDataPath, 'latin1'), cidLayout);
      sourceFiles.push(path.basename(cidDataPath));

      const procLayout = parseLayoutFile(fs.readFileSync(procLayoutPath, 'latin1'));
      rawProcedures = parseFixedWidthData(fs.readFileSync(procDataPath, 'latin1'), procLayout);
      sourceFiles.push(path.basename(procDataPath));

      const relLayout = parseLayoutFile(fs.readFileSync(relLayoutPath, 'latin1'));
      rawRelations = parseFixedWidthData(fs.readFileSync(relDataPath, 'latin1'), relLayout);
      sourceFiles.push(path.basename(relDataPath));
    } catch (err) {
      console.error(`[SIGTAP Build Error] Falha ao ler ou interpretar arquivos do SIGTAP: ${err.message}`);
      process.exit(1);
    }
  }

  // Handle fallback / sample data rules
  if (!rawCids || !rawProcedures || !rawRelations) {
    if (options.strict || !options.allowSampleData) {
      console.error('[SIGTAP Build Error] Nenhuma pasta válida contendo os arquivos oficiais do SIGTAP foi informada.');
      console.error('Para gerar a base oficial em produção, informe --input com o caminho para a competência completa.');
      console.error('O uso de dados de amostra/fixture sem --allow-sample-data é estritamente proibido.');
      process.exit(1);
    }

    console.warn('[SIGTAP Build Warning] Usando dados de amostra/fixture ativados explicitamente (--allow-sample-data).');
    rawCids = SAMPLE_CIDS;
    rawProcedures = SAMPLE_PROCEDURES;
    rawRelations = SAMPLE_RELATIONS;
    sourceFiles.push('SAMPLE_FIXTURE_DATA');
  }

  const cids = transformCidRecords(rawCids);
  const procedures = transformProcedureRecords(rawProcedures);

  const validCidsSet = new Set(cids.map((c) => c.code));
  const validProceduresSet = new Set(procedures.map((p) => p.code));

  const relations = transformRelationRecords(rawRelations, validCidsSet, validProceduresSet);

  // Validate output completeness
  if (cids.length === 0 || procedures.length === 0 || relations.length === 0) {
    console.error('[SIGTAP Build Error] O catálogo gerado está vazio.');
    process.exit(1);
  }

  // Check for suspiciously small counts if not using sample fixture explicitly
  if (!options.allowSampleData && (cids.length < 500 || procedures.length < 200)) {
    console.error(`[SIGTAP Build Error] Catálogo SIGTAP suspeitamente pequeno detectado:`);
    console.error(` - CIDs: ${cids.length} (esperado > 500 para base oficial completa)`);
    console.error(` - Procedimentos: ${procedures.length} (esperado > 200 para base oficial completa)`);
    console.error('Uma base oficial completa era esperada. Verifique os arquivos informados em --input.');
    process.exit(1);
  }

  const competenceDir = path.join(options.output, options.competence);
  const tmpDir = path.join(options.output, `.tmp-${options.competence}`);

  if (fs.existsSync(tmpDir)) {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
  fs.mkdirSync(tmpDir, { recursive: true });

  const cidsContent = JSON.stringify(cids, null, options.pretty ? 2 : undefined);
  const procsContent = JSON.stringify(procedures, null, options.pretty ? 2 : undefined);
  const relsContent = JSON.stringify(relations, null, options.pretty ? 2 : undefined);

  // Write temporary files
  fs.writeFileSync(path.join(tmpDir, 'cids.json'), cidsContent, 'utf-8');
  fs.writeFileSync(path.join(tmpDir, 'procedures.json'), procsContent, 'utf-8');
  fs.writeFileSync(path.join(tmpDir, 'relations.json'), relsContent, 'utf-8');

  const sizes = {
    cids: Buffer.byteLength(cidsContent, 'utf-8'),
    procedures: Buffer.byteLength(procsContent, 'utf-8'),
    relations: Buffer.byteLength(relsContent, 'utf-8'),
  };

  const hashes = {
    cids: computeSha256(cidsContent),
    procedures: computeSha256(procsContent),
    relations: computeSha256(relsContent),
  };

  const counts = {
    cids: cids.length,
    procedures: procedures.length,
    relations: relations.length,
  };

  const manifest = createManifest(
    options.competence,
    counts,
    `/data/clinical-codes/${options.competence}`,
    sourceFiles,
    hashes,
    sizes
  );

  // Safely swap/move tmpDir to competenceDir
  if (fs.existsSync(competenceDir)) {
    fs.rmSync(competenceDir, { recursive: true, force: true });
  }
  fs.renameSync(tmpDir, competenceDir);

  // Write top-level manifest
  fs.mkdirSync(options.output, { recursive: true });
  fs.writeFileSync(
    path.join(options.output, 'manifest.json'),
    JSON.stringify(manifest, null, 2),
    'utf-8'
  );

  console.log('[SIGTAP Build Success] Catálogo de códigos clínicos criado com sucesso:');
  console.log(` - Competência: ${manifest.competenceLabel} (${manifest.competence})`);
  console.log(` - Schema Version: ${manifest.schemaVersion}`);
  console.log(` - CIDs: ${counts.cids}`);
  console.log(` - Procedimentos: ${counts.procedures}`);
  console.log(` - Relações oficiais: ${counts.relations}`);
  console.log(` - Tamanhos: CIDs ${(sizes.cids / 1024).toFixed(1)} KB | Procs ${(sizes.procedures / 1024).toFixed(1)} KB | Rels ${(sizes.relations / 1024).toFixed(1)} KB`);
}

buildDataset();


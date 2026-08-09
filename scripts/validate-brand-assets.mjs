import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const ROOT_DIR = process.cwd();

function getPngDimensions(filePath) {
  const buf = fs.readFileSync(filePath);
  // PNG signature: 89 50 4E 47 0D 0A 1A 0A
  if (buf.length < 24 || buf[0] !== 0x89 || buf[1] !== 0x50 || buf[2] !== 0x4e || buf[3] !== 0x47) {
    return null;
  }
  const width = buf.readUInt32BE(16);
  const height = buf.readUInt32BE(20);
  return { width, height };
}

function computeSha256(filePath) {
  const fileBuffer = fs.readFileSync(filePath);
  const hashSum = crypto.createHash('sha256');
  hashSum.update(fileBuffer);
  return hashSum.digest('hex');
}

async function validateBrandAssets() {
  console.log('=== Iniciando Validação dos Assets Oficiais do GestaTools ===\n');

  let hasErrors = false;

  // 1. Validar SHA-256 e existência de todos os assets aprovados
  const shaFile = path.join(ROOT_DIR, 'branding', 'approved-assets.sha256');
  if (!fs.existsSync(shaFile)) {
    console.error(`[ERRO CRÍTICO] Arquivo de checksums não encontrado: ${shaFile}`);
    process.exit(1);
  }

  const shaLines = fs.readFileSync(shaFile, 'utf-8').trim().split('\n');
  console.log(`Verificando ${shaLines.length} arquivos no arquivo de checksums...`);

  for (const line of shaLines) {
    if (!line.trim()) continue;
    const [expectedHash, relativePath] = line.trim().split(/\s+/);
    const absolutePath = path.join(ROOT_DIR, relativePath);

    if (!fs.existsSync(absolutePath)) {
      console.error(`❌ [AUSENTE] Arquivo oficial não encontrado: ${relativePath}`);
      hasErrors = true;
      continue;
    }

    const actualHash = computeSha256(absolutePath);
    if (actualHash !== expectedHash) {
      console.error(`❌ [HASH DIVERGENTE] O arquivo foi modificado/recomprimido!`);
      console.error(`   Arquivo: ${relativePath}`);
      console.error(`   Esperado: ${expectedHash}`);
      console.error(`   Obtido:   ${actualHash}`);
      hasErrors = true;
    } else {
      console.log(`✅ [OK] ${relativePath}`);
    }

    // Validação de dimensões se for PNG
    if (relativePath.endsWith('.png')) {
      const dims = getPngDimensions(absolutePath);
      if (dims) {
        // Verificar dimensões esperadas a partir do nome do arquivo
        let expectedDim = null;
        if (relativePath.includes('1200x630')) {
          expectedDim = { w: 1200, h: 630 };
        } else if (relativePath.includes('1500x1040') || relativePath.includes('preview-kit-identidade')) {
          expectedDim = { w: 1500, h: 1040 };
        } else {
          const match = relativePath.match(/(\d+)x(\d+)|-(\d+)\.png|icon-(\d+)\.png|maskable-(\d+)\.png|mstile-(\d+)\.png/);
          if (match) {
            const sizeStr = match[1] || match[3] || match[4] || match[5] || match[6];
            if (sizeStr) {
              const size = parseInt(sizeStr, 10);
              expectedDim = { w: size, h: size };
            }
          }
        }

        if (expectedDim && (dims.width !== expectedDim.w || dims.height !== expectedDim.h)) {
          console.error(`❌ [DIMENSÃO INCORRETA] ${relativePath} tem ${dims.width}x${dims.height}, esperado ${expectedDim.w}x${expectedDim.h}`);
          hasErrors = true;
        }
      }
    }
  }

  // 2. Validar public/manifest.json
  console.log('\n--- Validando public/manifest.json ---');
  const manifestPath = path.join(ROOT_DIR, 'public', 'manifest.json');
  if (!fs.existsSync(manifestPath)) {
    console.error(`❌ [ERRO] public/manifest.json não existe`);
    hasErrors = true;
  } else {
    const manifestContent = fs.readFileSync(manifestPath, 'utf-8');
    if (manifestContent.includes('icon.svg')) {
      console.error(`❌ [ERRO] public/manifest.json referencia icon.svg!`);
      hasErrors = true;
    }
    if (manifestContent.includes('any maskable')) {
      console.error(`❌ [ERRO] public/manifest.json utiliza "purpose": "any maskable" (proibido)!`);
      hasErrors = true;
    }

    const manifest = JSON.parse(manifestContent);
    if (Array.isArray(manifest.icons)) {
      for (const icon of manifest.icons) {
        const iconPath = path.join(ROOT_DIR, 'public', icon.src.replace(/^\//, ''));
        if (!fs.existsSync(iconPath)) {
          console.error(`❌ [ERRO] Ícone referenciado no manifesto não existe: ${icon.src}`);
          hasErrors = true;
        }
      }
    }
    console.log(`✅ public/manifest.json validado.`);
  }

  // 3. Validar index.html
  console.log('\n--- Validando index.html ---');
  const indexPath = path.join(ROOT_DIR, 'index.html');
  if (fs.existsSync(indexPath)) {
    const indexContent = fs.readFileSync(indexPath, 'utf-8');
    if (indexContent.includes('icon.svg')) {
      console.error(`❌ [ERRO] index.html referencia icon.svg!`);
      hasErrors = true;
    }
    console.log(`✅ index.html validado.`);
  }

  // 4. Validar public/sw.js
  console.log('\n--- Validando public/sw.js ---');
  const swPath = path.join(ROOT_DIR, 'public', 'sw.js');
  if (fs.existsSync(swPath)) {
    const swContent = fs.readFileSync(swPath, 'utf-8');
    if (swContent.includes('icon.svg')) {
      console.error(`❌ [ERRO] public/sw.js referencia icon.svg!`);
      hasErrors = true;
    }
    console.log(`✅ public/sw.js validado.`);
  }

  if (hasErrors) {
    console.error('\n❌ VALIDAÇÃO FALHOU: Um ou mais erros foram encontrados nos assets ou referências.');
    process.exit(1);
  } else {
    console.log('\n✨ VALIDAÇÃO CONCLUÍDA COM SUCESSO: Todos os assets oficiais estão intactos e validados!');
  }
}

validateBrandAssets();

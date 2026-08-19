import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const ROOT_DIR = process.cwd();
const SOURCE_DIR = path.join(ROOT_DIR, 'GestaTools_Identidade_Visual');

function copyRecursive(src, dest) {
  const stats = fs.statSync(src);
  if (stats.isDirectory()) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    const entries = fs.readdirSync(src);
    for (const entry of entries) {
      copyRecursive(path.join(src, entry), path.join(dest, entry));
    }
  } else if (stats.isFile()) {
    const parent = path.dirname(dest);
    if (!fs.existsSync(parent)) {
      fs.mkdirSync(parent, { recursive: true });
    }
    fs.copyFileSync(src, dest);
    console.log(`Synchronized asset: ${path.relative(ROOT_DIR, dest)}`);
  }
}

console.log('Synchronizing authentic user brand assets from GestaTools_Identidade_Visual...');

// 1. Copy GestaTools_Identidade_Visual/public/* to public/*
copyRecursive(path.join(SOURCE_DIR, 'public'), path.join(ROOT_DIR, 'public'));

// 2. Copy GestaTools_Identidade_Visual/branding/* to branding/*
if (fs.existsSync(path.join(SOURCE_DIR, 'branding'))) {
  copyRecursive(path.join(SOURCE_DIR, 'branding'), path.join(ROOT_DIR, 'branding'));
}

// 3. Copy GestaTools_Identidade_Visual/previews/* to branding/previews/*
if (fs.existsSync(path.join(SOURCE_DIR, 'previews'))) {
  copyRecursive(path.join(SOURCE_DIR, 'previews'), path.join(ROOT_DIR, 'branding', 'previews'));
}

// 4. Generate standard iOS apple-touch-icon aliases in public/
const iosAliases = [
  ['public/apple-touch-icon.png', 'public/apple-touch-icon-precomposed.png'],
  ['public/icons/gestatools-v2/icon-180.png', 'public/apple-touch-icon-180x180.png'],
  ['public/icons/gestatools-v2/icon-180.png', 'public/apple-touch-icon-180x180-precomposed.png'],
  ['public/icons/gestatools-v2/icon-167.png', 'public/apple-touch-icon-167x167.png'],
  ['public/icons/gestatools-v2/icon-167.png', 'public/apple-touch-icon-167x167-precomposed.png'],
  ['public/icons/gestatools-v2/icon-152.png', 'public/apple-touch-icon-152x152.png'],
  ['public/icons/gestatools-v2/icon-152.png', 'public/apple-touch-icon-152x152-precomposed.png'],
  ['public/icons/gestatools-v2/icon-128.png', 'public/apple-touch-icon-120x120.png'],
  ['public/icons/gestatools-v2/icon-128.png', 'public/apple-touch-icon-120x120-precomposed.png'],
  ['public/icons/gestatools-v2/icon-144.png', 'public/apple-touch-icon-144x144.png'],
  ['public/icons/gestatools-v2/icon-144.png', 'public/apple-touch-icon-144x144-precomposed.png'],
  ['public/icons/gestatools-v2/icon-72.png', 'public/apple-touch-icon-76x76.png'],
  ['public/icons/gestatools-v2/icon-72.png', 'public/apple-touch-icon-76x76-precomposed.png'],
  ['public/icons/gestatools-v2/icon-64.png', 'public/apple-touch-icon-57x57.png'],
  ['public/icons/gestatools-v2/icon-64.png', 'public/apple-touch-icon-57x57-precomposed.png'],
  ['public/icons/gestatools-v2/icon-192.png', 'public/apple-touch-icon-192x192.png'],
  ['public/icons/gestatools-v2/icon-192.png', 'public/apple-touch-icon-192x192-precomposed.png'],
];

iosAliases.forEach(([src, dest]) => {
  const srcPath = path.join(ROOT_DIR, src);
  const destPath = path.join(ROOT_DIR, dest);
  if (fs.existsSync(srcPath)) {
    fs.copyFileSync(srcPath, destPath);
  }
});

console.log('Rebuilding SHA256 checksums based on user assets...');

const shaFile = path.join(ROOT_DIR, 'branding', 'approved-assets.sha256');
if (fs.existsSync(shaFile)) {
  const shaLines = fs.readFileSync(shaFile, 'utf-8').trim().split('\n');
  const updatedLines = [];
  for (const line of shaLines) {
    if (!line.trim()) continue;
    const [, relativePath] = line.trim().split(/\s+/);
    const absPath = path.join(ROOT_DIR, relativePath);
    if (fs.existsSync(absPath)) {
      const buf = fs.readFileSync(absPath);
      const hash = crypto.createHash('sha256').update(buf).digest('hex');
      updatedLines.push(`${hash}  ${relativePath}`);
    }
  }
  fs.writeFileSync(shaFile, updatedLines.join('\n') + '\n');
}

console.log('✅ User brand assets synchronized successfully.');

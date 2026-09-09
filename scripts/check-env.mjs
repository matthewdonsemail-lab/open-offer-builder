// Pre-push check: every env var referenced in code must be documented in .env.example.
// Fails listing the missing keys so pushes can't silently depend on undocumented vars.
//
// Usage: node scripts/check-env.mjs   (run from repo root)
import { readFileSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');

function exampleKeys() {
  const file = path.join(ROOT, '.env.example');
  if (!existsSync(file)) {
    console.error('check-env: .env.example not found');
    process.exit(1);
  }
  const keys = new Set();
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z][A-Z0-9_]*)\s*=/);
    if (m) keys.add(m[1]);
  }
  return keys;
}

function lsFiles(...patterns) {
  try {
    const out = execSync(
      `git -C "${ROOT}" ls-files ${patterns.map((p) => `"${p}"`).join(' ')}`,
      { encoding: 'utf8' },
    );
    return out.split('\n').map((s) => s.trim()).filter(Boolean);
  } catch {
    return [];
  }
}

function refsIn(files, regex) {
  const found = new Map(); // key -> Set<file>
  for (const file of files) {
    let text;
    try {
      text = readFileSync(path.join(ROOT, file), 'utf8');
    } catch {
      continue;
    }
    for (const m of text.matchAll(regex)) {
      if (!found.has(m[1])) found.set(m[1], new Set());
      found.get(m[1]).add(file);
    }
  }
  return found;
}

const documented = exampleKeys();
const missing = [];

// Backend: process.env.X
for (const [key, where] of refsIn(lsFiles('backend/src/**/*.ts'), /process\.env\.([A-Z][A-Z0-9_]*)/g)) {
  if (!documented.has(key)) missing.push({ key, where: [...where], kind: 'process.env' });
}

// Frontend: import.meta.env.VITE_X
for (const [key, where] of refsIn(
  lsFiles('frontend/src/**/*.ts', 'frontend/src/**/*.tsx'),
  /import\.meta\.env\.(VITE_[A-Z0-9_]*)/g,
)) {
  if (!documented.has(key)) missing.push({ key, where: [...where], kind: 'import.meta.env' });
}

if (missing.length > 0) {
  console.error('check-env: FAIL — env vars used in code but missing from .env.example:');
  for (const { key, where, kind } of missing) {
    console.error(`  ${key} (${kind}) used in: ${where.join(', ')}`);
  }
  console.error('Add them to .env.example (with placeholder values, never secrets).');
  process.exit(1);
}

console.log('check-env: OK — all referenced env vars are documented in .env.example');

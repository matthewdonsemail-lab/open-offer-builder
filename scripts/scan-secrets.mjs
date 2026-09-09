// Pre-push check: fail if staged changes smuggle in secrets or real env files.
// Scans the *staged* content (git show :path), not the worktree.
//
// Usage: node scripts/scan-secrets.mjs   (run from repo root)
import { execSync } from 'node:child_process';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');

// Text-ish extensions only; binary assets (fonts, images) are skipped.
const SKIP_EXT = new Set([
  '.woff', '.woff2', '.ttf', '.otf', '.eot',
  '.png', '.jpg', '.jpeg', '.gif', '.webp', '.ico', '.svg',
  '.mp4', '.webm', '.mp3', '.pdf', '.zip',
]);

const PATTERNS = [
  {
    name: 'JWT token',
    // eyJ header + two more base64url segments, long enough to skip docs
    regex: /eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}/g,
  },
  {
    name: 'private key block',
    regex: /-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/g,
  },
  {
    name: 'credentialed connection URL (postgres/mongo/mysql/redis)',
    regex: /(?:postgres(?:ql)?|mongodb(?:\+srv)?|mysql|redis):\/\/[^/\s:]+:[^/\s@]+@/gi,
  },
  {
    name: 'live secret prefix (sk-live / xox / ghp / AKIA)',
    regex: /\b(?:sk-live-[A-Za-z0-9]{8,}|xox[bpas]-[A-Za-z0-9-]+|ghp_[A-Za-z0-9]{20,}|AKIA[0-9A-Z]{16})\b/g,
  },
];

function stagedFiles() {
  try {
    const out = execSync('git -C "' + ROOT + '" diff --cached --name-only --diff-filter=ACM -z', {
      encoding: 'buffer',
    });
    return out.toString('utf8').split('\0').map((s) => s.trim()).filter(Boolean);
  } catch {
    return [];
  }
}

function stagedContent(file) {
  try {
    return execSync(`git -C "${ROOT}" show :"${file}"`, {
      encoding: 'utf8',
      maxBuffer: 10 * 1024 * 1024,
    });
  } catch {
    return null; // deleted/unreadable — skip
  }
}

const findings = [];

for (const file of stagedFiles()) {
  const base = path.basename(file);
  // Real env files must never be staged (.env.example is the only exception)
  if (base.startsWith('.env') && base !== '.env.example') {
    findings.push({ file, line: 0, name: 'real env file staged', match: base });
    continue;
  }
  if (SKIP_EXT.has(path.extname(file).toLowerCase())) continue;
  const text = stagedContent(file);
  if (text == null || text.includes('\0')) continue; // binary — skip
  const lines = text.split('\n');
  for (const { name, regex } of PATTERNS) {
    regex.lastIndex = 0;
    lines.forEach((line, i) => {
      // Allow-list: placeholders and docs that merely mention formats
      if (/your-|change-me|example\.com|placeholder/i.test(line)) return;
      regex.lastIndex = 0;
      const m = line.match(regex);
      if (m) findings.push({ file, line: i + 1, name, match: m[0].slice(0, 60) });
    });
  }
}

if (findings.length > 0) {
  console.error('scan-secrets: FAIL — possible secrets in staged changes:');
  for (const f of findings) {
    console.error(`  ${f.file}:${f.line} [${f.name}] ${f.match}`);
  }
  console.error('Remove the secret (use .env.local, which is git-ignored) and re-stage.');
  process.exit(1);
}

console.log('scan-secrets: OK — no secrets detected in staged changes');

#!/usr/bin/env node
// Enforces the SDK/CLI import boundary: src/core/** must never import from
// src/cli/** or from terminal/output libraries. The core is the SDK; keeping it
// output-free is what lets a REST API (v1.x) reuse it unchanged.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const CORE_DIR = join(ROOT, 'src', 'core');
const FORBIDDEN = [
  /from\s+['"]\.\.?\/.*cli/,
  /from\s+['"]\.\.?\/.*api/,
  /from\s+['"]commander['"]/,
  /from\s+['"]picocolors['"]/,
];

/** @param {string} dir @returns {string[]} */
function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (entry.endsWith('.ts')) out.push(full);
  }
  return out;
}

const violations = [];
for (const file of walk(CORE_DIR)) {
  const text = readFileSync(file, 'utf8');
  text.split('\n').forEach((line, i) => {
    if (FORBIDDEN.some((re) => re.test(line))) {
      violations.push(`${relative(ROOT, file)}:${i + 1}  ${line.trim()}`);
    }
  });
}

if (violations.length > 0) {
  console.error('Import-boundary violations (src/core must not import CLI/output code):');
  for (const v of violations) console.error(`  ${v}`);
  process.exit(1);
}
console.log('Import boundary clean: src/core is SDK-only.');

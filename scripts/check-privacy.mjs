#!/usr/bin/env node
// Privacy gate: templates/ and docs/ must contain zero business-private data. The
// public product is generic. `op://` (the sanctioned reference form) and the public
// repo URL (ohxhavel/baab-kit) are allowed; everything else on the list is not.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const SCAN_DIRS = ['templates', 'docs'];

// Word-boundaried so "havel" does not match inside "ohxhavel" (the public org).
const FORBIDDEN = [
  /\bsimpl/i,
  /\bhnwiii\b/i,
  /\bhavel\b/i,
  /\bsavor\b/i,
  /\bcarddex\b/i,
  /\bstrikesync\b/i,
  /\bfeel-good\b/i,
  /\bheritage-farms\b/i,
  /\bgxa\b/i,
];

/** @param {string} dir @returns {string[]} */
function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

const hits = [];
for (const d of SCAN_DIRS) {
  for (const file of walk(join(ROOT, d))) {
    const text = readFileSync(file, 'utf8');
    text.split('\n').forEach((line, i) => {
      for (const re of FORBIDDEN) {
        if (re.test(line)) hits.push(`${relative(ROOT, file)}:${i + 1}  ${line.trim()}`);
      }
    });
  }
}

if (hits.length > 0) {
  console.error('Privacy gate FAILED — private data found in templates/docs:');
  for (const h of hits) console.error(`  ${h}`);
  process.exit(1);
}
console.log('Privacy gate clean: no private data in templates/ or docs/.');

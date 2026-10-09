#!/usr/bin/env node
// Verifies that every relative Markdown link in the repository points to an
// existing file and, when it has a #fragment, to an existing heading anchor.
// External (http/https/mailto) links are not checked. Zero dependencies.
//
// Usage: node scripts/check-md-links.mjs [root]

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.argv[2] ?? '.');
const IGNORED_DIRS = new Set(['node_modules', '.git', 'dist', 'build', '.next', 'coverage']);

/** @param {string} dir @returns {string[]} */
function findMarkdownFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return IGNORED_DIRS.has(entry.name) ? [] : findMarkdownFiles(full);
    return entry.name.endsWith('.md') ? [full] : [];
  });
}

/**
 * GitHub's heading anchor algorithm (as implemented by github-slugger):
 * lowercase, drop everything except letters, marks, numbers, connector
 * punctuation, spaces and hyphens, then turn spaces into hyphens.
 * @param {string} heading
 */
function slugify(heading) {
  return heading
    .toLowerCase()
    .replace(/[^\p{L}\p{M}\p{N}\p{Pc} -]/gu, '')
    .replace(/ /g, '-');
}

/** @type {Map<string, Set<string>>} */
const anchorCache = new Map();

/** @param {string} file @returns {Set<string>} */
function anchorsFor(file) {
  const cached = anchorCache.get(file);
  if (cached) return cached;
  const anchors = new Set();
  const counts = new Map();
  let inFence = false;
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    if (/^\s*(```|~~~)/.test(line)) inFence = !inFence;
    if (inFence) continue;
    const match = line.match(/^#{1,6}\s+(.+?)\s*#*\s*$/);
    if (!match) continue;
    const text = match[1].replace(/`([^`]*)`/g, '$1').replace(/\[([^\]]*)\]\([^)]*\)/g, '$1');
    const base = slugify(text);
    const n = counts.get(base) ?? 0;
    counts.set(base, n + 1);
    anchors.add(n === 0 ? base : `${base}-${n}`);
  }
  anchorCache.set(file, anchors);
  return anchors;
}

const LINK = /\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
/** @type {string[]} */
const problems = [];
let checked = 0;

for (const file of findMarkdownFiles(root)) {
  let inFence = false;
  readFileSync(file, 'utf8')
    .split('\n')
    .forEach((line, index) => {
      if (/^\s*(```|~~~)/.test(line)) inFence = !inFence;
      if (inFence) return;
      for (const [, target] of line.matchAll(LINK)) {
        if (/^(https?:|mailto:)/.test(target)) continue;
        // Template placeholders such as (<path-to-file>) are not real links.
        if (target.includes('<')) continue;
        checked++;
        const [rawPath, fragment] = target.split('#');
        const resolved = rawPath ? path.resolve(path.dirname(file), decodeURI(rawPath)) : file;
        const where = `${path.relative(root, file)}:${index + 1}`;
        if (!existsSync(resolved)) {
          problems.push(`${where}  missing file: ${target}`);
          continue;
        }
        if (fragment && statSync(resolved).isFile() && resolved.endsWith('.md')) {
          if (!anchorsFor(resolved).has(fragment)) problems.push(`${where}  missing anchor: ${target}`);
        }
      }
    });
}

if (problems.length > 0) {
  console.error(`Found ${problems.length} broken link(s) out of ${checked} checked:\n`);
  for (const problem of problems) console.error(`  ${problem}`);
  process.exit(1);
}
console.log(`All ${checked} relative Markdown links are valid.`);

import { promises as fs, constants } from 'node:fs';
import path from 'node:path';
import { checkDirectoryAncestors } from './store.mjs';

const MAX_TEMPLATE_BYTES = 64 * 1024;
const MAX_KEYS = 256;
const KEY = /^[A-Za-z_][A-Za-z0-9_]{0,127}$/;

/**
 * Parse only empty-value .env.example templates. Never parse or echo .env files
 * containing real values. This is an inventory of expected *names*, not a
 * secret retrieval, OS environment injection or an authenticated agent grant.
 */
export function parseEnvExample(content) {
  if (typeof content !== 'string' || Buffer.byteLength(content, 'utf8') > MAX_TEMPLATE_BYTES) {
    throw new Error('Invalid or oversized example template.');
  }
  const result = [];
  const found = new Set();
  for (const raw of content.split(/\r?\n/)) {
    if (raw === '' || /^\s*#/.test(raw)) continue;
    const match = /^([A-Za-z_][A-Za-z0-9_]{0,127})=$/.exec(raw);
    if (!match) throw new Error('Invalid template syntax or a non-empty value. Use NAME= only.');
    if (found.has(match[1])) throw new Error('Duplicate template variable name.');
    found.add(match[1]);
    result.push(match[1]);
    if (result.length > MAX_KEYS) throw new Error('Template variable count limit exceeded.');
  }
  return Object.freeze(result);
}

/** Reject .env, environment files, symlinks and oversized data. */
export async function readEnvExample(filename) {
  const absolute = path.resolve(filename);
  if (path.basename(absolute) !== '.env.example') {
    throw new Error('Only files named .env.example can be audited.');
  }
  await checkDirectoryAncestors(path.dirname(absolute));
  const stat = await fs.lstat(absolute);
  if (!stat.isFile() || stat.isSymbolicLink() || stat.size > MAX_TEMPLATE_BYTES) {
    throw new Error('Unsafe or oversized example template.');
  }
  const flags = constants.O_RDONLY | (constants.O_NOFOLLOW || 0);
  const handle = await fs.open(absolute, flags);
  try {
    const actual = await handle.stat();
    if (!actual.isFile() || actual.size > MAX_TEMPLATE_BYTES) {
      throw new Error('Unsafe or oversized example template.');
    }
    const bytes = await handle.readFile();
    try { return parseEnvExample(new TextDecoder('utf-8', { fatal: true }).decode(bytes)); }
    catch { throw new Error('Invalid or non-empty example template.'); }
    finally { bytes.fill(0); }
  } finally { await handle.close(); }
}

/**
 * Compare key names to unlocked local vault item *names*. Never return a name
 * or secret in the result: aggregate counts are the only allowed output.
 */
export function auditEnvCoverage(requiredKeys, vaultItemNames) {
  if (!Array.isArray(requiredKeys) || !Array.isArray(vaultItemNames) ||
      requiredKeys.length > MAX_KEYS || vaultItemNames.length > 1000 ||
      requiredKeys.some(k => typeof k !== 'string' || !KEY.test(k)) ||
      vaultItemNames.some(k => typeof k !== 'string')) {
    throw new Error('Invalid template or Vault inventory.');
  }
  if (new Set(requiredKeys).size !== requiredKeys.length) {
    throw new Error('Duplicate template variable name.');
  }
  const available = new Set(vaultItemNames);
  const matched = requiredKeys.filter(key => available.has(key)).length;
  return Object.freeze({
    required: requiredKeys.length,
    matched,
    missing: requiredKeys.length - matched
  });
}

import { promises as fs, constants } from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { validateEnvelope } from './vault.mjs';

const MAX_BYTES = 12 * 1024 * 1024;
const noFollow = constants.O_NOFOLLOW || 0;

/** Reject already present symlink ancestors, including paths supplied for restore.
 * This is not a replacement for dirfd/openat2 against malicious same-UID races. */
export async function checkDirectoryAncestors(directory) {
  const absolute = path.resolve(directory);
  const root = path.parse(absolute).root;
  let current = root;
  for (const segment of absolute.slice(root.length).split(path.sep).filter(Boolean)) {
    current = path.join(current, segment);
    let stat;
    try { stat = await fs.lstat(current); }
    catch (error) {
      if (error.code === 'ENOENT') continue; // A subsequent mkdir will create it.
      throw error;
    }
    if (stat.isSymbolicLink() || !stat.isDirectory()) {
      throw new Error('Unsafe vault directory ancestry (symlink or non-directory).');
    }
  }
}
async function safeDirectory(directory) {
  await checkDirectoryAncestors(directory);
  await fs.mkdir(directory, { recursive: true, mode: 0o700 });
  await checkDirectoryAncestors(directory);
  const s = await fs.lstat(directory);
  if (!s.isDirectory() || s.isSymbolicLink() || (s.mode & 0o077)) {
    throw new Error('Vault directory must be non-symlink mode 0700.');
  }
}
async function safeFile(filename) {
  const s = await fs.lstat(filename);
  if (!s.isFile() || s.isSymbolicLink() || (s.mode & 0o077) || s.size < 2 || s.size > MAX_BYTES) {
    throw new Error('Unsafe vault file, permissions, or size.');
  }
}
export async function readVaultFile(filename) {
  await checkDirectoryAncestors(path.dirname(path.resolve(filename)));
  await safeFile(filename);
  const handle = await fs.open(filename, constants.O_RDONLY | noFollow);
  try {
    const s = await handle.stat();
    if (!s.isFile() || (s.mode & 0o077) || s.size > MAX_BYTES) throw new Error('Unsafe vault file.');
    return validateEnvelope(JSON.parse(await handle.readFile('utf8')));
  } finally { await handle.close(); }
}
export async function withVaultLock(filename, callback) {
  await safeDirectory(path.dirname(path.resolve(filename)));
  const lockName = filename + '.lock';
  let lock;
  try { lock = await fs.open(lockName, constants.O_CREAT | constants.O_EXCL | constants.O_WRONLY | noFollow, 0o600); }
  catch (e) {
    if (e.code === 'EEXIST') throw new Error('Vault is locked. Do not remove an active lock.');
    throw e;
  }
  try { return await callback(); }
  finally { await lock.close(); await fs.unlink(lockName); }
}
/** Must be called under withVaultLock for writes. */
export async function writeVaultFile(filename, envelope, { createOnly = false } = {}) {
  // Never persist an unencrypted payload or unrecognized cleartext metadata.
  validateEnvelope(envelope);
  const directory = path.dirname(path.resolve(filename));
  await safeDirectory(directory);
  if (createOnly) {
    try { await fs.lstat(filename); throw new Error('Vault already exists.'); }
    catch (e) { if (e.code !== 'ENOENT') throw e; }
  } else await safeFile(filename);
  const content = JSON.stringify(envelope, null, 2) + '\n';
  if (Buffer.byteLength(content) > MAX_BYTES) throw new Error('Vault exceeds size limit.');
  const temp = path.join(directory, '.carnoa-' + randomUUID() + '.tmp');
  const handle = await fs.open(temp, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | noFollow, 0o600);
  try { await handle.writeFile(content, 'utf8'); await handle.sync(); }
  finally { await handle.close(); }
  try {
    // Atomic create-if-absent: rename would overwrite a file created after lstat.
    if (createOnly) {
      await fs.link(temp, filename);
      await fs.unlink(temp);
    } else {
      await fs.rename(temp, filename);
    }
    const parent = await fs.open(directory, constants.O_RDONLY);
    try { await parent.sync(); } finally { await parent.close(); }
  } catch (e) { await fs.rm(temp, { force: true }).catch(() => {}); throw e; }
}

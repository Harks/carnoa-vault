import test from 'node:test';
import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { encryptVault, decryptVault } from '../src/vault.mjs';
import { readVaultFile, withVaultLock, writeVaultFile } from '../src/store.mjs';
const pass = 'correct horse battery staple!';
test('owner-only file, private directory, encrypted roundtrip, no overwriting init', async () => {
  const directory = await fs.mkdtemp(path.join(tmpdir(), 'carnoa-test-'));
  try {
    const filename = path.join(directory, 'vault.json');
    const data = await encryptVault({items:[]}, pass);
    await withVaultLock(filename, () => writeVaultFile(filename, data, {createOnly:true}));
    assert.equal((await fs.stat(filename)).mode & 0o777, 0o600);
    assert.equal((await fs.stat(directory)).mode & 0o777, 0o700);
    assert.deepEqual((await decryptVault(await readVaultFile(filename), pass)).items, []);
    await assert.rejects(withVaultLock(filename, () => writeVaultFile(filename, data, {createOnly:true})), /already exists/);
  } finally { await fs.rm(directory, {recursive:true, force:true}); }
});
test('rejects world-readable files and symlinks', async () => {
  const directory = await fs.mkdtemp(path.join(tmpdir(), 'carnoa-test-'));
  try {
    const filename = path.join(directory, 'vault.json');
    await withVaultLock(filename, () => writeVaultFile(filename, {dummy:true}, {createOnly:true}));
    await fs.chmod(filename, 0o644);
    await assert.rejects(readVaultFile(filename), /Unsafe/);
    await fs.chmod(filename, 0o600);
    const alias = path.join(directory, 'alias.json');
    await fs.symlink(filename, alias);
    await assert.rejects(readVaultFile(alias), /Unsafe/);
    await assert.rejects(withVaultLock(alias, () => writeVaultFile(alias, {}, {})), /Unsafe/);
  } finally { await fs.rm(directory, {recursive:true, force:true}); }
});
test('concurrent writes blocked and lock removed after successful callback', async () => {
  const directory = await fs.mkdtemp(path.join(tmpdir(), 'carnoa-test-'));
  try {
    const filename = path.join(directory, 'vault.json');
    await withVaultLock(filename, async () => {
      await assert.rejects(withVaultLock(filename, async()=>{}), /locked/);
    });
    await assert.rejects(fs.stat(filename + '.lock'), {code:'ENOENT'});
  } finally { await fs.rm(directory, {recursive:true, force:true}); }
});

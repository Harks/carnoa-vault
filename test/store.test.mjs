import test from 'node:test';
import assert from 'node:assert/strict';
import { promises as fs, realpathSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { encryptVault, decryptVault } from '../src/vault.mjs';
import { readVaultFile, withVaultLock, writeVaultFile } from '../src/store.mjs';
const pass = 'correct horse battery staple!';
test('owner-only file, private directory, encrypted roundtrip, no overwriting init', async () => {
  const directory = await fs.mkdtemp(path.join(realpathSync(tmpdir()), 'carnoa-test-'));
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
  const directory = await fs.mkdtemp(path.join(realpathSync(tmpdir()), 'carnoa-test-'));
  try {
    const filename = path.join(directory, 'vault.json');
    await withVaultLock(filename, async () => writeVaultFile(filename, await encryptVault({items:[]}, pass), {createOnly:true}));
    await fs.chmod(filename, 0o644);
    await assert.rejects(readVaultFile(filename), /Unsafe/);
    await fs.chmod(filename, 0o600);
    const alias = path.join(directory, 'alias.json');
    await fs.symlink(filename, alias);
    await assert.rejects(readVaultFile(alias), /Unsafe/);
    await assert.rejects(withVaultLock(alias, async () => writeVaultFile(alias, await encryptVault({items:[]}, pass), {})), /Unsafe/);
  } finally { await fs.rm(directory, {recursive:true, force:true}); }
});
test('concurrent writes blocked and lock removed after successful callback', async () => {
  const directory = await fs.mkdtemp(path.join(realpathSync(tmpdir()), 'carnoa-test-'));
  try {
    const filename = path.join(directory, 'vault.json');
    await withVaultLock(filename, async () => {
      await assert.rejects(withVaultLock(filename, async()=>{}), /locked/);
    });
    await assert.rejects(fs.stat(filename + '.lock'), {code:'ENOENT'});
  } finally { await fs.rm(directory, {recursive:true, force:true}); }
});

test('storage boundary rejects plaintext or appended cleartext metadata before creating any file', async () => {
  const directory = await fs.mkdtemp(path.join(realpathSync(tmpdir()), 'carnoa-test-'));
  try {
    const filename = path.join(directory, 'vault.json');
    await assert.rejects(
      writeVaultFile(filename, { secret: 'synthetic-cleartext' }, { createOnly: true }),
      /invalid vault format/
    );
    await assert.rejects(fs.stat(filename), { code: 'ENOENT' });
    const good = await encryptVault({items: []}, pass);
    await assert.rejects(
      writeVaultFile(filename, { ...good, secret: 'synthetic-cleartext' }, { createOnly: true }),
      /invalid vault format/
    );
    await assert.rejects(fs.stat(filename), { code: 'ENOENT' });
  } finally { await fs.rm(directory, {recursive: true, force: true}); }
});

test('read and write reject parent-directory symlink without following it', async () => {
  const base = await fs.mkdtemp(path.join(realpathSync(tmpdir()), 'carnoa-test-'));
  try {
    const actual = path.join(base, 'actual');
    const alias = path.join(base, 'alias');
    const encrypted = await encryptVault({items:[]}, pass);
    await withVaultLock(path.join(actual, 'vault.json'), () =>
      writeVaultFile(path.join(actual, 'vault.json'), encrypted, {createOnly:true}));
    await fs.symlink(actual, alias, 'dir');
    await assert.rejects(readVaultFile(path.join(alias, 'vault.json')), /Unsafe vault directory ancestry/);
    await assert.rejects(
      withVaultLock(path.join(alias, 'new.json'), () =>
        writeVaultFile(path.join(alias, 'new.json'), encrypted, {createOnly:true})),
      /Unsafe vault directory ancestry/
    );
    await assert.rejects(fs.stat(path.join(actual, 'new.json')), {code:'ENOENT'});
  } finally { await fs.rm(base, {recursive: true, force: true}); }
});

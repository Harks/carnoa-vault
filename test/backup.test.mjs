import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { promises as fs, realpathSync } from 'node:fs';
import { encryptVault, decryptVault, putItem } from '../src/vault.mjs';
import { readVaultFile, writeVaultFile, withVaultLock } from '../src/store.mjs';
import { exportEncryptedBackup, restoreEncryptedBackup } from '../src/backup.mjs';

const pass = 'synthetic test-only passphrase 2026';
const different = 'a different test-only passphrase 2026';

async function fixture(run) {
  const base = await fs.mkdtemp(path.join(realpathSync(tmpdir()), 'carnoa-backup-test-'));
  const vault = path.join(base, 'current', 'vault.json');
  const copies = path.join(base, 'backups');
  try {
    const state = putItem({ items: [] }, 'example-synthetic-token', 'sample-only-secret-0001');
    await withVaultLock(vault, async () => {
      await writeVaultFile(vault, await encryptVault(state, pass), { createOnly: true });
    });
    await run({ base, vault, copies, state });
  } finally { await fs.rm(base, { force: true, recursive: true }); }
}

test('encrypted backup roundtrip restores same data with no plaintext on disk', async () => {
  await fixture(async ({ base, vault, copies, state }) => {
    const backup = await exportEncryptedBackup(vault, copies, pass);
    const raw = await fs.readFile(backup, 'utf8');
    assert.doesNotMatch(raw, /example-synthetic-token|sample-only-secret-0001/);
    assert.equal((await fs.stat(backup)).mode & 0o777, 0o600);
    assert.equal((await fs.stat(copies)).mode & 0o777, 0o700);
    const restoredPath = path.join(base, 'restored', 'vault.json');
    assert.deepEqual(await restoreEncryptedBackup(restoredPath, backup, pass), { restored: true });
    assert.deepEqual((await decryptVault(await readVaultFile(restoredPath), pass)).items, state.items);
  });
});

test('wrong passphrase on export or restore leaves no new backup/vault', async () => {
  await fixture(async ({ base, vault, copies }) => {
    await assert.rejects(exportEncryptedBackup(vault, copies, different), /unlock failed/);
    await assert.rejects(fs.stat(copies), { code: 'ENOENT' });
    const backup = await exportEncryptedBackup(vault, copies, pass);
    const dest = path.join(base, 'empty', 'vault.json');
    await assert.rejects(restoreEncryptedBackup(dest, backup, different), /unlock failed/);
    await assert.rejects(fs.stat(dest), { code: 'ENOENT' });
  });
});

test('corrupt authenticated backup fails closed without touching destination', async () => {
  await fixture(async ({ base, vault, copies }) => {
    const backup = await exportEncryptedBackup(vault, copies, pass);
    const serialized = JSON.parse(await fs.readFile(backup, 'utf8'));
    const tag = Buffer.from(serialized.cipher.tag, 'base64');
    tag[0] ^= 1;
    serialized.cipher.tag = tag.toString('base64');
    await fs.writeFile(backup, JSON.stringify(serialized), { mode: 0o600 });
    const dest = path.join(base, 'empty', 'vault.json');
    await assert.rejects(restoreEncryptedBackup(dest, backup, pass), /unlock failed/);
    await assert.rejects(fs.stat(dest), { code: 'ENOENT' });
  });
});

test('restore refuses overwrite and original ciphertext remains unchanged', async () => {
  await fixture(async ({ base, vault, copies }) => {
    const backup = await exportEncryptedBackup(vault, copies, pass);
    const before = await fs.readFile(vault);
    await assert.rejects(restoreEncryptedBackup(vault, backup, pass), /already exists/);
    assert.deepEqual(await fs.readFile(vault), before);
    const symlink = path.join(base, 'backup-symlink.json');
    await fs.symlink(backup, symlink);
    await assert.rejects(restoreEncryptedBackup(path.join(base, 'other', 'vault.json'), symlink, pass), /Unsafe/);
  });
});

test('backup source cannot be target and orphan writer locks are not silently removed', async () => {
  await fixture(async ({ base, vault }) => {
    await assert.rejects(restoreEncryptedBackup(vault, vault, pass), /cannot be/);
    await fs.writeFile(vault + '.lock', 'synthetic-lock', { mode: 0o600 });
    await assert.rejects(exportEncryptedBackup(vault, path.join(base, 'backups'), pass), /locked/);
  });
});

test('parallel create-only files have exactly one winner and do not clobber it', async () => {
  const dir = await fs.mkdtemp(path.join(realpathSync(tmpdir()), 'carnoa-atomic-test-'));
  try {
    const dest = path.join(dir, 'vault.json');
    const first = await encryptVault({items:[]}, pass);
    const second = await encryptVault({items:[]}, pass);
    const outcome = await Promise.allSettled([
      writeVaultFile(dest, first, { createOnly: true }),
      writeVaultFile(dest, second, { createOnly: true })
    ]);
    assert.equal(outcome.filter(x => x.status === 'fulfilled').length, 1);
    assert.equal(outcome.filter(x => x.status === 'rejected').length, 1);
    assert.ok([first.id, second.id].includes((await readVaultFile(dest)).id));
  } finally { await fs.rm(dir, { force: true, recursive: true }); }
});

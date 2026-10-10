import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { decryptVault } from './vault.mjs';
import { readVaultFile, writeVaultFile, withVaultLock } from './store.mjs';

/**
 * Make an encrypted, independently decryptable local snapshot. No plaintext export.
 * The destination must be a private directory; never overwrite an existing snapshot.
 * There is NO rollback protection against an older, valid backup (see threat model).
 */
export async function exportEncryptedBackup(vaultPath, backupsDirectory, passphrase) {
  return withVaultLock(vaultPath, async () => {
    const envelope = await readVaultFile(vaultPath);
    await decryptVault(envelope, passphrase);
    const snapshotName = 'vault-' + new Date().toISOString().replaceAll(':', '-') + '-' + randomUUID() + '.json';
    const backupPath = path.join(backupsDirectory, snapshotName);
    await writeVaultFile(backupPath, envelope, { createOnly: true });
    return backupPath;
  });
}

/**
 * Restore an authenticated encrypted backup, only to a vault path that does NOT exist.
 * A force-overwrite switch is intentionally not supported.
 */
export async function restoreEncryptedBackup(vaultPath, backupPath, passphrase) {
  if (path.resolve(vaultPath) === path.resolve(backupPath)) {
    throw new Error('Backup source cannot be the destination.');
  }
  return withVaultLock(vaultPath, async () => {
    const envelope = await readVaultFile(backupPath);
    await decryptVault(envelope, passphrase);
    await writeVaultFile(vaultPath, envelope, { createOnly: true });
    return { restored: true };
  });
}

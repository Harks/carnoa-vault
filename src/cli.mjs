#!/usr/bin/env node
import path from 'node:path';
import { homedir } from 'node:os';
import { timingSafeEqual } from 'node:crypto';
import { stdin, stdout, stderr } from 'node:process';
import { encryptVault, decryptVault, putItem, removeItem } from './vault.mjs';
import { readVaultFile, withVaultLock, writeVaultFile } from './store.mjs';
import { exportEncryptedBackup, restoreEncryptedBackup } from './backup.mjs';

const vaultPath = path.join(homedir(), '.carnoa', 'vault.json');
const usage = 'Usage: carnoa-vault <init | put NAME | list | remove NAME | backup | restore ENCRYPTED_FILE>\nSecrets cannot be supplied via argv/env/stdin pipes.\n';
function safeCompare(a, b) {
  const x = Buffer.from(a, 'utf8'), y = Buffer.from(b, 'utf8');
  const matches = x.length === y.length && timingSafeEqual(x, y);
  x.fill(0); y.fill(0);
  return matches;
}
function hiddenPrompt(label) {
  if (!stdin.isTTY || !stdin.setRawMode) throw new Error('Interactive local terminal required.');
  stdout.write(label);
  return new Promise((resolve, reject) => {
    let value = '', settled = false;
    function finish(error) {
      if (settled) return;
      settled = true;
      stdin.off('data', onData);
      stdin.setRawMode(false);
      stdin.pause();
      stdout.write('\n');
      if (error) reject(error); else resolve(value);
    }
    function onData(chunk) {
      for (const c of String(chunk)) {
        if (c === '\r' || c === '\n') return finish();
        if (c === '\u0003' || c === '\u0004') return finish(new Error('Cancelled.'));
        if (c === '\u007f' || c === '\b') value = Array.from(value).slice(0, -1).join('');
        else if (c >= ' ') {
          value += c;
          if (Buffer.byteLength(value, 'utf8') > 65536) return finish(new Error('Input too long.'));
        }
      }
    }
    stdin.setEncoding('utf8');
    stdin.setRawMode(true);
    stdin.resume();
    stdin.on('data', onData);
  });
}
async function main() {
  const [action, name, ...extra] = process.argv.slice(2);
  if (action === '--help' || action === 'help') { stdout.write(usage); return; }
  if (extra.length || !['init','put','list','remove','backup','restore'].includes(action) ||
      (['put','remove','restore'].includes(action) !== (typeof name === 'string'))) throw new Error(usage.trim());
  if (action === 'init') {
    const passphrase = await hiddenPrompt('New passphrase: ');
    const confirmation = await hiddenPrompt('Confirm passphrase: ');
    if (!safeCompare(passphrase, confirmation)) throw new Error('Passphrases did not match.');
    const data = await encryptVault({ items: [] }, passphrase);
    await withVaultLock(vaultPath, () => writeVaultFile(vaultPath, data, { createOnly: true }));
    stdout.write('Local vault initialized. No operator recovery is possible.\n');
    return;
  }
  const passphrase = await hiddenPrompt('Master passphrase: ');
  if (action === 'list') {
    const state = await decryptVault(await readVaultFile(vaultPath), passphrase);
    for (const item of state.items) stdout.write(item.name + '\n');
    return;
  }
  if (action === 'backup') {
    const backupPath = await exportEncryptedBackup(
      vaultPath, path.join(homedir(), '.carnoa', 'backups'), passphrase
    );
    stdout.write('Encrypted snapshot saved to: ' + backupPath + '\n');
    stdout.write('Keep both this encrypted file and your passphrase; no operator recovery exists.\n');
    return;
  }
  if (action === 'restore') {
    const confirmation = await hiddenPrompt('Type RESTORE to create a new vault (never overwrite): ');
    if (confirmation !== 'RESTORE') throw new Error('Cancelled.');
    await restoreEncryptedBackup(vaultPath, path.resolve(name), passphrase);
    stdout.write('Authenticated encrypted vault restored without overwriting an existing vault.\n');
    return;
  }
  if (action === 'put') {
    const secret = await hiddenPrompt('Secret: ');
    await withVaultLock(vaultPath, async () => {
      const state = await decryptVault(await readVaultFile(vaultPath), passphrase);
      await writeVaultFile(vaultPath, await encryptVault(putItem(state, name, secret), passphrase));
    });
    stdout.write('Encrypted item saved. Secret not printed.\n');
    return;
  }
  const confirmation = await hiddenPrompt('Type DELETE to confirm: ');
  if (confirmation !== 'DELETE') throw new Error('Cancelled.');
  await withVaultLock(vaultPath, async () => {
    const state = await decryptVault(await readVaultFile(vaultPath), passphrase);
    await writeVaultFile(vaultPath, await encryptVault(removeItem(state, name), passphrase));
  });
  stdout.write('Entry removed.\n');
}
main().catch(error => { stderr.write('Error: ' + error.message + '\n'); process.exitCode = 1; });

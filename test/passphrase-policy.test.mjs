import test from 'node:test';
import assert from 'node:assert/strict';
import { validateNewMasterPassphrase } from '../src/passphrase-policy.mjs';
import { encryptVault, decryptVault } from '../src/vault.mjs';

test('new Vault onboarding requires 15 Unicode code points and accepts long passphrases', () => {
  assert.throws(() => validateNewMasterPassphrase('abcdefghijklmn'), /at least 15/);
  assert.throws(() => validateNewMasterPassphrase(' '.repeat(20)), /non-whitespace/);
  assert.equal(validateNewMasterPassphrase('correct horse battery staple!'), true);
  assert.equal(validateNewMasterPassphrase('安全なパスフレーズを長めに設定します'), true);
  assert.equal(validateNewMasterPassphrase('  many spaces and punctuation allowed  '), true);
});

test('offline local screen rejects common and repeated values, never prints input', () => {
  const values = [
    'passwordpassword', 'password12345678', '123456789012345',
    'qwertyuiopasdfgh', 'carnoacarnoacarnoa', 'aaaaaaaaaaaaaaaa',
    'abcdabcdabcdabcd', '１２３４５６７８９０１２３４５'
  ];
  for (const input of values) {
    assert.throws(() => validateNewMasterPassphrase(input), (err) =>
      !err.message.includes(input) && /predictable|pattern/.test(err.message));
  }
});

test('no composition requirement: Unicode, whitespace, and long passwords remain allowed', () => {
  assert.equal(validateNewMasterPassphrase('これは十分に長い日本語の合言葉です'), true);
  assert.equal(validateNewMasterPassphrase('❄️ winter snowfall inside my passphrase'), true);
  assert.throws(() => validateNewMasterPassphrase('😀'.repeat(1100)), /4096-byte/);
});

test('legacy 14-character Vaults can still unlock without migrating or truncating', async () => {
  const legacy = 'abcdefghijklmn'; // Synthetic; not suitable for a new Vault.
  assert.throws(() => validateNewMasterPassphrase(legacy), /at least 15/);
  const ciphertext = await encryptVault({items:[]}, legacy);
  assert.deepEqual((await decryptVault(ciphertext, legacy)).items, []);
});

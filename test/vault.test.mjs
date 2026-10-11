import test from 'node:test';
import assert from 'node:assert/strict';
import { encryptVault, decryptVault, validateEnvelope, putItem, removeItem } from '../src/vault.mjs';
const pass = 'correct horse battery staple!';
const wrong = 'something else that is long';
test('no plaintext names/secrets in persisted ciphertext and roundtrip works', async () => {
  const first = putItem({items: []}, 'github-production', 'synthetic-top-secret-123');
  const ciphertext = await encryptVault(first, pass);
  assert.ok(!JSON.stringify(ciphertext).includes('github-production'));
  assert.ok(!JSON.stringify(ciphertext).includes('synthetic-top-secret'));
  assert.deepEqual((await decryptVault(ciphertext, pass)).items, first.items);
});
test('random new salt, nonce and ciphertext every save', async () => {
  const a = await encryptVault({items:[]}, pass);
  const b = await encryptVault({id:a.id, items:[]}, pass);
  assert.notEqual(a.kdf.salt, b.kdf.salt);
  assert.notEqual(a.cipher.nonce, b.cipher.nonce);
  assert.notEqual(a.cipher.data, b.cipher.data);
});
test('wrong passphrase and tag/ID/ciphertext tampering fail closed', async () => {
  const encrypted = await encryptVault({items:[]}, pass);
  await assert.rejects(decryptVault(encrypted, wrong), /unlock failed/);
  const tagChanged = structuredClone(encrypted);
  const tag = Buffer.from(tagChanged.cipher.tag, 'base64'); tag[0] ^= 1;
  tagChanged.cipher.tag = tag.toString('base64');
  await assert.rejects(decryptVault(tagChanged, pass), /unlock failed/);
  const idChanged = structuredClone(encrypted);
  idChanged.id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  await assert.rejects(decryptVault(idChanged, pass), /unlock failed/);
  const dataChanged = structuredClone(encrypted);
  dataChanged.cipher.data = Buffer.from('bad').toString('base64');
  await assert.rejects(decryptVault(dataChanged, pass), /unlock failed/);
});
test('unsupported KDF parameters fail before expensive derivation', async () => {
  const envelope = await encryptVault({items:[]}, pass);
  envelope.kdf.N = 2 ** 25;
  assert.throws(() => validateEnvelope(envelope), /format/);
});
test('weak passphrase and malformed items rejected; upsert and remove deterministic', async () => {
  await assert.rejects(encryptVault({items:[]}, 'short'), /Passphrase/);
  await assert.rejects(encryptVault({items:[{secret:'invalid'}]}, pass), /Invalid vault data/);
  const one = putItem({items:[]}, 'token-a', 'value-a');
  const two = putItem(one, 'token-a', 'value-b');
  assert.equal(two.items.length, 1);
  assert.equal(two.items[0].id, one.items[0].id);
  assert.equal(one.items[0].secret, 'value-a');
  assert.deepEqual(removeItem(two, 'token-a').items, []);
  assert.throws(() => removeItem({items:[]}, 'token-a'), /not found/);
});

test('strict authenticated envelope schema forbids cleartext extensions', async () => {
  const envelope = await encryptVault({items:[]}, pass);
  assert.throws(() => validateEnvelope({...envelope, secret: 'synthetic-cleartext'}), /invalid vault format/);
  assert.throws(() => validateEnvelope({...envelope, kdf: {...envelope.kdf, password: 'synthetic'}}), /invalid vault format/);
  assert.throws(() => validateEnvelope({...envelope, cipher: {...envelope.cipher, description: 'synthetic'}}), /invalid vault format/);
  assert.throws(() => validateEnvelope({ ...envelope, version: 2 }), /vault format/);
});

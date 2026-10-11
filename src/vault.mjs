import { createCipheriv, createDecipheriv, randomBytes, randomUUID, scrypt } from 'node:crypto';
import { promisify } from 'node:util';

const derive = promisify(scrypt);
const N = 131072, R = 8, P = 1, MAXMEM = 256 * 1024 * 1024;
const MAX_CIPHER = 8 * 1024 * 1024;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const BASE64 = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;
function exactFields(object, fields) {
  if (!object || typeof object !== 'object' || Array.isArray(object) ||
      Object.getPrototypeOf(object) !== Object.prototype ||
      Object.keys(object).sort().join(',') !== [...fields].sort().join(',')) {
    throw new Error('Unsupported or invalid vault format.');
  }
}
const b64 = (bytes) => bytes.toString('base64');
function parse64(value, length) {
  if (typeof value !== 'string' || value.length > 12_000_000 || !BASE64.test(value)) throw new Error('Invalid vault format.');
  const bytes = Buffer.from(value, 'base64');
  if (b64(bytes) !== value || (length !== undefined && bytes.length !== length)) throw new Error('Invalid vault format.');
  return bytes;
}
function validPassphrase(value) {
  if (typeof value !== 'string' || [...value].length < 14 || Buffer.byteLength(value, 'utf8') > 4096) {
    throw new Error('Passphrase must be 14+ characters and at most 4096 bytes.');
  }
}
function validateItems(items) {
  if (!Array.isArray(items) || items.length > 1000) throw new Error('Invalid vault data.');
  const names = new Set();
  for (const x of items) {
    if (!x || typeof x !== 'object' || !UUID.test(x.id) ||
      typeof x.name !== 'string' || !x.name.length || x.name.length > 256 ||
      /[\x00-\x1f\x7f]/.test(x.name) ||
      typeof x.secret !== 'string' || Buffer.byteLength(x.secret, 'utf8') > 65536 ||
      typeof x.createdAt !== 'string' || !Number.isFinite(Date.parse(x.createdAt)) ||
      typeof x.updatedAt !== 'string' || !Number.isFinite(Date.parse(x.updatedAt)) ||
      names.has(x.name)) throw new Error('Invalid vault data.');
    names.add(x.name);
  }
}
function aad(id) { return Buffer.from('carnoa-vault:v1:' + id, 'utf8'); }
async function keyFor(passphrase, salt) {
  return /** @type {Buffer} */ (await derive(passphrase, salt, 32, { N, r: R, p: P, maxmem: MAXMEM }));
}
export function validateEnvelope(x) {
  exactFields(x, ['format', 'version', 'id', 'kdf', 'cipher']);
  exactFields(x.kdf, ['name', 'N', 'r', 'p', 'salt']);
  exactFields(x.cipher, ['name', 'nonce', 'tag', 'data']);
  if (!x || typeof x !== 'object' || Array.isArray(x) ||
      x.format !== 'carnoa-vault' || x.version !== 1 || !UUID.test(x.id) ||
      !x.kdf || x.kdf.name !== 'scrypt' || x.kdf.N !== N || x.kdf.r !== R || x.kdf.p !== P ||
      !x.cipher || x.cipher.name !== 'AES-256-GCM') throw new Error('Unsupported or invalid vault format.');
  parse64(x.kdf.salt, 32); parse64(x.cipher.nonce, 12); parse64(x.cipher.tag, 16);
  const data = parse64(x.cipher.data);
  if (!data.length || data.length > MAX_CIPHER) throw new Error('Invalid vault size.');
  return x;
}
/** Client-side encryption. No server, network access, telemetry, or plaintext metadata. */
export async function encryptVault({ id = randomUUID(), items = [] }, passphrase) {
  validPassphrase(passphrase);
  if (!UUID.test(id)) throw new Error('Invalid vault ID.');
  validateItems(items);
  const salt = randomBytes(32), nonce = randomBytes(12);
  const key = await keyFor(passphrase, salt);
  const plaintext = Buffer.from(JSON.stringify({ items }), 'utf8');
  try {
    const cipher = createCipheriv('aes-256-gcm', key, nonce);
    cipher.setAAD(aad(id));
    const data = Buffer.concat([cipher.update(plaintext), cipher.final()]);
    return {
      format: 'carnoa-vault', version: 1, id,
      kdf: { name: 'scrypt', N, r: R, p: P, salt: b64(salt) },
      cipher: { name: 'AES-256-GCM', nonce: b64(nonce), tag: b64(cipher.getAuthTag()), data: b64(data) }
    };
  } finally { key.fill(0); plaintext.fill(0); }
}
/** Reject wrong passphrases, tampering, and unsupported KDF settings. */
export async function decryptVault(envelope, passphrase) {
  validPassphrase(passphrase);
  validateEnvelope(envelope);
  const key = await keyFor(passphrase, parse64(envelope.kdf.salt, 32));
  let plaintext;
  try {
    const decipher = createDecipheriv('aes-256-gcm', key, parse64(envelope.cipher.nonce, 12));
    decipher.setAAD(aad(envelope.id));
    decipher.setAuthTag(parse64(envelope.cipher.tag, 16));
    plaintext = Buffer.concat([decipher.update(parse64(envelope.cipher.data)), decipher.final()]);
    const payload = JSON.parse(plaintext.toString('utf8'));
    validateItems(payload.items);
    return { id: envelope.id, items: payload.items };
  } catch {
    throw new Error('Vault unlock failed (wrong passphrase or integrity violation).');
  } finally { key.fill(0); if (plaintext) plaintext.fill(0); }
}
export function putItem(vault, name, secret) {
  if (typeof name !== 'string' || name.length < 1 || name.length > 256 ||
      /[\x00-\x1f\x7f]/.test(name) || typeof secret !== 'string' || !secret.length ||
      Buffer.byteLength(secret, 'utf8') > 65536) throw new Error('Invalid name or secret.');
  const now = new Date().toISOString(), items = vault.items.map(x => ({ ...x }));
  const index = items.findIndex(x => x.name === name);
  if (index !== -1) items[index] = { ...items[index], secret, updatedAt: now };
  else {
    if (items.length >= 1000) throw new Error('Vault capacity exceeded.');
    items.push({ id: randomUUID(), name, secret, createdAt: now, updatedAt: now });
  }
  return { id: vault.id, items };
}
export function removeItem(vault, name) {
  const items = vault.items.filter(x => x.name !== name);
  if (items.length === vault.items.length) throw new Error('Item not found.');
  return { id: vault.id, items };
}

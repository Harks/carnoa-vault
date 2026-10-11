import { verify as verifyEd25519 } from 'node:crypto';

/**
 * OFFLINE, NON-EXECUTABLE reference contract for a *future* agent broker.
 *
 * Caller-supplied expected principal/key are NOT proof of a verified process.
 * A real broker must authenticate peers, pin issuer keys, persist revocation
 * and replay state, enforce provider method/path/body, and require user consent.
 * Do not expose these functions as an authorization API or provider proxy.
 */
const DENIED = Object.freeze({ status: 'invalid', executable: false });
const MAX_AGE_MS = 5 * 60 * 1000;
const SHA256_B64 = /^(?:[A-Za-z0-9+/]{4}){10}[A-Za-z0-9+/]{3}=$/;
const B64 = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;
const FIELDS = [
  'version','issuer','subject','audience','resource','operation',
  'issuedAt','expiresAt','nonce','requestHash'
];
const ENVELOPE_KEYS = ['payload','signature'];

function exactRecord(value, keys) {
  return value !== null && typeof value === 'object' && !Array.isArray(value) &&
    Object.getPrototypeOf(value) === Object.prototype &&
    Object.keys(value).sort().join(',') === [...keys].sort().join(',');
}
function asIdentifier(v) {
  return typeof v === 'string' && /^[A-Za-z0-9:_-]{4,100}$/.test(v);
}
function scopedResource(v) {
  if (typeof v !== 'string' || v.length > 160) return false;
  const match = /^github:repo\/([A-Za-z0-9][A-Za-z0-9_.-]{0,38})\/([A-Za-z0-9][A-Za-z0-9_.-]{0,99})$/.exec(v);
  return !!match && match[1] !== '..' && match[2] !== '..';
}
function canonical(payload) {
  return Buffer.from(JSON.stringify(FIELDS.map(key => payload[key])), 'utf8');
}

/**
 * Decode and verify only a synthetic Ed25519 grant contract.
 * Does not execute a provider operation or prove real agent/user consent.
 *
 * @param {{payload: object, signature: string}} envelope
 * @param {import('node:crypto').KeyObject} trustedPublicKey provided by future trusted host, NEVER AI input
 * @param {{subject:string,audience:string,resource:string,operation:string,requestHash:string,now:number,seenNonces:Set<string>}} expected
 */
export function inspectSignedGrant(envelope, trustedPublicKey, expected) {
  try {
    if (!exactRecord(envelope, ENVELOPE_KEYS) || !exactRecord(envelope.payload, FIELDS)) return DENIED;
    const p = envelope.payload;
    if (p.version !== 1 ||
        !asIdentifier(p.issuer) || !asIdentifier(p.subject) || !asIdentifier(p.audience) ||
        !scopedResource(p.resource) || p.operation !== 'github.pulls.list' ||
        typeof p.nonce !== 'string' || !/^[A-Za-z0-9_-]{16,64}$/.test(p.nonce) ||
        typeof p.requestHash !== 'string' || !SHA256_B64.test(p.requestHash) ||
        !Number.isSafeInteger(p.issuedAt) || !Number.isSafeInteger(p.expiresAt) || p.issuedAt < 0 ||
        p.issuedAt >= p.expiresAt || p.expiresAt - p.issuedAt > MAX_AGE_MS) return DENIED;

    if (!exactRecord(expected, ['subject','audience','resource','operation','requestHash','now','seenNonces']) ||
        !Number.isSafeInteger(expected.now) || expected.now < 0 || !(expected.seenNonces instanceof Set) ||
        p.subject !== expected.subject || p.audience !== expected.audience ||
        p.resource !== expected.resource || p.operation !== expected.operation ||
        p.requestHash !== expected.requestHash ||
        p.issuedAt > expected.now || p.expiresAt <= expected.now ||
        expected.seenNonces.has(p.nonce)) return DENIED;

    if (typeof envelope.signature !== 'string' || envelope.signature.length !== 88 ||
        !B64.test(envelope.signature)) return DENIED;
    const signature = Buffer.from(envelope.signature, 'base64');
    if (signature.length !== 64 || signature.toString('base64') !== envelope.signature) return DENIED;
    if (!trustedPublicKey || trustedPublicKey.type !== 'public' ||
        trustedPublicKey.asymmetricKeyType !== 'ed25519' ||
        !verifyEd25519(null, canonical(p), trustedPublicKey, signature)) return DENIED;

    // A local ephemeral set does NOT implement durable revocation, peer identity
    // authentication, consent, crash-safe replay protection or real authorization.
    expected.seenNonces.add(p.nonce);
    return Object.freeze({ status: 'verified-reference', executable: false });
  } catch {
    return DENIED;
  }
}

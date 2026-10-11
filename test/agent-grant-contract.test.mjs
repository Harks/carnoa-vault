import test from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPairSync, sign, createHash } from 'node:crypto';
import { inspectSignedGrant } from '../src/agent-grant-contract.mjs';

const { publicKey, privateKey } = generateKeyPairSync('ed25519'); // ephemeral synthetic test keys
const { publicKey: foreignKey } = generateKeyPairSync('ed25519');
const FIELDS = ['version','issuer','subject','audience','resource','operation',
  'issuedAt','expiresAt','nonce','requestHash'];
const t = 1_780_000_000_000;
const digest = createHash('sha256').update('GET /repos/Harks/demo/pulls?state=open').digest('base64');
const base = Object.freeze({
  version:1,issuer:'issuer:localtest',subject:'agent:synthetic',
  audience:'carnoa-local-broker-demo',resource:'github:repo/Harks/demo',
  operation:'github.pulls.list',issuedAt:t-1_000,expiresAt:t+60_000,
  nonce:'0123456789_example_nonce',requestHash:digest
});
const canonical = payload => Buffer.from(JSON.stringify(FIELDS.map(key => payload[key])), 'utf8');
const wrap = payload => ({
  payload,
  signature:sign(null,canonical(payload),privateKey).toString('base64')
});
function expected(overrides={}) {
  return {
    subject:base.subject,audience:base.audience,resource:base.resource,
    operation:base.operation,requestHash:base.requestHash,now:t,
    seenNonces:new Set(),...overrides
  };
}

test('synthetic signature validates but NEVER authorizes execution', () => {
  assert.deepEqual(inspectSignedGrant(wrap({...base}),publicKey,expected()),
    {status:'verified-reference', executable:false});
});
test('tampered grant body or extra cleartext fields always fail closed', () => {
  const signed=wrap({...base});
  for(const payload of [{...signed.payload,resource:'github:repo/Harks/other'},
                        {...signed.payload,scope:'*'},
                        {...signed.payload,operation:'github.repos.delete'}]) {
    assert.equal(inspectSignedGrant({...signed,payload},publicKey,expected()).status,'invalid');
  }
  assert.equal(inspectSignedGrant({...signed,token:'fake'},publicKey,expected()).status,'invalid');
});
test('wrong issuer public key or malformed signature is denied', () => {
  const signed=wrap({...base});
  assert.equal(inspectSignedGrant(signed,foreignKey,expected()).status,'invalid');
  assert.equal(inspectSignedGrant({...signed,signature:'invalid'},publicKey,expected()).status,'invalid');
});
test('bound principal, audience, resource, operation and request digest cannot change', () => {
  const signed=wrap({...base});
  for(const fields of [{subject:'agent:other'},{audience:'remote'},
                       {resource:'github:repo/Harks/other'},{operation:'write'},
                       {requestHash:'changed'}]) {
    assert.equal(inspectSignedGrant(signed,publicKey,expected(fields)).status,'invalid');
  }
});
test('expired, future, oversized TTL and malformed timestamps are rejected', () => {
  for(const p of [{...base,expiresAt:t-1},{...base,issuedAt:t+1},
                  {...base,expiresAt:t+10*60*1000},{...base,issuedAt:1.5},
                  {...base,issuedAt:-1}]) {
    assert.equal(inspectSignedGrant(wrap(p),publicKey,expected()).status,'invalid');
  }
});
test('ephemeral nonce replay is detected within a single process only', () => {
  const signed=wrap({...base});
  const seen=expected();
  assert.equal(inspectSignedGrant(signed,publicKey,seen).status,'verified-reference');
  assert.equal(inspectSignedGrant(signed,publicKey,seen).status,'invalid');
});
test('forged verified boolean cannot replace trusted context', () => {
  const signed=wrap({...base});
  assert.equal(inspectSignedGrant({...signed,verified:true},publicKey,expected()).status,'invalid');
  assert.equal(inspectSignedGrant(signed,publicKey,{...expected(),verified:true}).status,'invalid');
  assert.equal(inspectSignedGrant(signed,publicKey,null).status,'invalid');
});
test('wildcards, URLs, non-read operations and noncanonical resource cannot pass', () => {
  for(const r of ['github:repo/Harks/*','https://github.com/Harks/demo',
                  'github:repo/Harks/../demo','github:repo/../demo','github:repo/Harks/demo?token=abc']) {
    assert.equal(inspectSignedGrant(wrap({...base,resource:r}),publicKey,expected({resource:r})).status,'invalid');
  }
});

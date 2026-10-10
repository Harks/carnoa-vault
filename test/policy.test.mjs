import test from 'node:test';
import assert from 'node:assert/strict';
import {evaluateAgentRead} from '../src/policy.mjs';
const now = 1780000000000;
const context = {verifiedPrincipal:true, principal:'agent:coder'};
const req = {principal:'agent:coder', action:'read', resource:'github:repo/Harks/demo'};
const grant = {id:'grant-1', principal:'agent:coder', action:'read', resource:req.resource, issuedAt:now-1000, expiresAt:now+60000};
test('denies unverified actors by default', () => {
  assert.equal(evaluateAgentRead(req, grant, null, now).reason,'unverified-principal');
  assert.equal(evaluateAgentRead(req, grant, {principal:'agent:coder'}, now).decision,'deny');
});
test('allows only exact verified short-lived read scope', () => {
  assert.deepEqual(evaluateAgentRead(req, grant, context, now), {decision:'allow',reason:'exact-read-grant', grantId:'grant-1'});
  assert.equal(evaluateAgentRead({...req,resource:'other'},grant,context,now).decision,'deny');
  assert.equal(evaluateAgentRead({...req,principal:'other'},grant,context,now).decision,'deny');
});
test('denies writes, expiry, future grants, and excessive grant duration', () => {
  assert.equal(evaluateAgentRead({...req,action:'write'},grant,context,now).decision,'deny');
  assert.equal(evaluateAgentRead(req,{...grant,expiresAt:now-1},context,now).decision,'deny');
  assert.equal(evaluateAgentRead(req,{...grant,issuedAt:now+1},context,now).decision,'deny');
  assert.equal(evaluateAgentRead(req,{...grant,expiresAt:now+10_000_000},context,now).decision,'deny');
});

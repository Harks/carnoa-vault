import test from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPairSync, sign } from 'node:crypto';
import { planSyntheticGitHubPullList } from '../src/github-pull-list-reference.mjs';
import { inspectSignedGrant } from '../src/agent-grant-contract.mjs';

const request = () => ({
  resource: 'github:repo/ExampleOrg/synthetic-repo',
  page: 1,
  perPage: 20
});

test('fixed host, GET operation, exact allowlisted path and NO execution', () => {
  const planned = planSyntheticGitHubPullList(request());
  assert.deepEqual(planned, {
    status: 'proposed-reference',
    executable: false,
    host: 'api.github.com',
    method: 'GET',
    relativePath: '/repos/ExampleOrg/synthetic-repo/pulls?state=open&per_page=20&page=1',
    redirectPolicy: 'deny',
    credentialPolicy: 'none',
    body: null,
    requestHash: planned.requestHash
  });
  assert.ok(Object.isFrozen(planned));
  assert.match(planned.requestHash, /^[A-Za-z0-9+/]{43}=$/);
  assert.ok(!Object.keys(planned).some(k => /secret|token|authorization|apiKey|header/i.test(k)));
});

test('full request fingerprint changes whenever resource or pagination differs', () => {
  const base = planSyntheticGitHubPullList(request());
  const changes = [
    {...request(), page: 2},
    {...request(), perPage: 21},
    {...request(), resource: 'github:repo/ExampleOrg/other-repo'}
  ];
  for (const changed of changes) {
    const result = planSyntheticGitHubPullList(changed);
    assert.equal(result.status, 'proposed-reference');
    assert.notEqual(result.requestHash, base.requestHash);
  }
  assert.equal(planSyntheticGitHubPullList(request()).requestHash, base.requestHash);
});

test('untrusted URLs, path tricks, extra HTTP parameters and write actions never produce a request', () => {
  const invalidResources = [
    'https://api.github.com/repos/ExampleOrg/synthetic-repo',
    'http://127.0.0.1/secret',
    'github:repo/../other',
    'github:repo/ExampleOrg/../secret',
    'github:repo/ExampleOrg/%2e%2e',
    'github:repo/ExampleOrg/repo?token=synthetic',
    'github:repo/ExampleOrg/repo#fragment',
    'github:repo/ExampleOrg/repo\\path',
    'github:repo/ExampleOrg/*',
    'github:repo/ExampleOrg/repo.',
    'github:repo/ExampleOrg./repo',
    'github:repo/東京/demo'
  ];
  for (const resource of invalidResources) {
    assert.deepEqual(planSyntheticGitHubPullList({...request(),resource}),
      {status:'invalid-reference',executable:false},resource);
  }
  for (const extra of [
    {method:'DELETE'},{url:'http://127.0.0.1'},{host:'evil.test'},
    {headers:{Authorization:'Bearer synthetic'}},{body:'credential value'},
    {state:'closed'},{allowRedirects:true}
  ]) {
    assert.equal(planSyntheticGitHubPullList({...request(),...extra}).status,'invalid-reference');
  }
});

test('invalid integer, coercion and missing resource/params fail closed', () => {
  for (const bad of [
    null,undefined,[],{},Object.create(null),new Date(),
    {...request(),page:0},{...request(),page:-1},{...request(),page:101},
    {...request(),page:1.5},{...request(),page:'1'},{...request(),page:Infinity},
    {...request(),perPage:0},{...request(),perPage:101},
    {...request(),perPage:'20'}, {...request(),perPage:NaN},
    {resource:request().resource,page:1}, {resource:request().resource,perPage:20}
  ]) {
    assert.deepEqual(planSyntheticGitHubPullList(bad), {
      status:'invalid-reference',executable:false
    });
  }
});

test('signed reference binds exact digest but cannot authorize anything', () => {
  const plan = planSyntheticGitHubPullList(request());
  const { publicKey, privateKey } = generateKeyPairSync('ed25519');
  const fields = ['version','issuer','subject','audience','resource','operation',
    'issuedAt','expiresAt','nonce','requestHash'];
  const now = 1_780_000_000_000;
  const payload = {
    version:1,issuer:'issuer:synthetic',subject:'agent:synthetic',
    audience:'carnoa-local-broker-demo', resource:request().resource,
    operation:'github.pulls.list', issuedAt:now-1000, expiresAt:now+60_000,
    nonce:'synthetic_nonce_1234567890', requestHash:plan.requestHash
  };
  const envelope = {
    payload,
    signature:sign(null, Buffer.from(JSON.stringify(fields.map(x=>payload[x]))),
      privateKey).toString('base64')
  };
  const expected = (hash) => ({
    subject:payload.subject, audience:payload.audience,resource:payload.resource,
    operation:payload.operation,requestHash:hash,now,seenNonces:new Set()
  });
  assert.deepEqual(inspectSignedGrant(envelope, publicKey, expected(plan.requestHash)),
    {status:'verified-reference',executable:false});
  const modifiedPage = planSyntheticGitHubPullList({...request(),page:2});
  assert.equal(inspectSignedGrant(envelope,publicKey,expected(modifiedPage.requestHash)).status,'invalid');
  assert.equal(inspectSignedGrant(envelope,publicKey,expected('synthetic-digest')).status,'invalid');
  assert.equal(plan.executable, false);
});

test('synthetic request result has no secret values and never connects to a provider', () => {
  const planned=planSyntheticGitHubPullList(request());
  assert.equal(typeof planned.requestHash,'string');
  assert.equal(planned.body,null);
  assert.equal(planned.credentialPolicy,'none');
  assert.equal(planned.redirectPolicy,'deny');
  assert.ok(!JSON.stringify(planned).includes('Bearer'));
  assert.ok(!JSON.stringify(planned).includes('examplePassword'));
  assert.equal('execute' in planned,false);
  assert.equal('fetch' in planned,false);
});

test('malicious getters/proxies fail closed instead of throwing', () => {
  const throwingGetter = {
    get resource() { throw new Error('do-not-echo-input'); },
    page: 1,
    perPage: 20
  };
  const throwingProxy = new Proxy(request(), {
    ownKeys() { throw new Error('do-not-echo-proxy-data'); }
  });
  for (const dangerous of [throwingGetter,throwingProxy]) {
    assert.deepEqual(planSyntheticGitHubPullList(dangerous), {
      status:'invalid-reference', executable:false
    });
  }
});

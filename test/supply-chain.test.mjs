import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('runtime intentionally has zero third-party dependency executables', () => {
  const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
  for (const field of ['dependencies', 'optionalDependencies', 'devDependencies']) {
    assert.deepEqual(pkg[field] || {}, {}, field + ' requires a dedicated supply-chain/security review');
  }
});
test('CI workflow actions are pinned to immutable full 40-byte SHA', () => {
  const workflow = readFileSync(new URL('../.github/workflows/ci.yml', import.meta.url), 'utf8');
  const references = workflow.matchAll(/^\s*-\s+uses:\s+([^\s#]+)/gm);
  const names = [...references].map(match => match[1]);
  assert.ok(names.length >= 4);
  for (const action of names) {
    assert.match(action, /^[\w-]+\/[\w-]+(?:\/[\w-]+)*@[0-9a-f]{40}$/, action + ' must be SHA-pinned');
  }
  assert.doesNotMatch(workflow, /pull_request_target/);
});

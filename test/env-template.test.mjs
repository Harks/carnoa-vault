import test from 'node:test';
import assert from 'node:assert/strict';
import { promises as fs, realpathSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { parseEnvExample, readEnvExample, auditEnvCoverage } from '../src/env-template.mjs';

test('reads only empty-value example names and summarizes local Vault name coverage', () => {
  const names = parseEnvExample('# No secrets here\nGITHUB_TOKEN=\nDB_PASSWORD=\r\nFEATURE_FLAG=\n');
  assert.deepEqual(names, ['GITHUB_TOKEN', 'DB_PASSWORD', 'FEATURE_FLAG']);
  const result = auditEnvCoverage(names, ['GITHUB_TOKEN', 'SOMETHING_ELSE']);
  assert.deepEqual(result, { required: 3, matched: 1, missing: 2 });
  assert.deepEqual(Object.keys(result).sort(), ['matched','missing','required']);
  assert.equal(Object.isFrozen(result), true);
});

test('fails closed on values, duplicates, dangerous syntax and oversized input', () => {
  const invalid = [
    'TOKEN=synthetic-secret-value',
    'TOKEN="synthetic"',
    'TOKEN=\nTOKEN=',
    'export TOKEN=',
    'TOKEN= # comment',
    'Token=$(curl https://example.invalid)',
    'TOKEN =',
    '1INVALID=',
    'TOKEN\r=',
    'TOKEN=\0',
    'A='.repeat(257),
    'A='.padEnd(70_000, 'X')
  ];
  for (const content of invalid) {
    assert.throws(() => parseEnvExample(content), Error);
  }
  assert.throws(() => auditEnvCoverage(['TOKEN','TOKEN'], []), /Duplicate/);
  assert.throws(() => auditEnvCoverage(['TOKEN'], [null]), /Invalid/);
});

test('rejects .env, symlinks and any template containing a secret value', async () => {
  const root = await fs.mkdtemp(path.join(realpathSync(tmpdir()), 'carnoa-env-template-'));
  try {
    const project = path.join(root, 'project');
    await fs.mkdir(project);
    const template = path.join(project, '.env.example');
    await fs.writeFile(template, '# synthetic only\nGITHUB_TOKEN=\n', { mode: 0o644 });
    assert.deepEqual(await readEnvExample(template), ['GITHUB_TOKEN']);
    const actualEnv = path.join(project, '.env');
    await fs.writeFile(actualEnv, 'GITHUB_TOKEN=synthetic-secret');
    await assert.rejects(readEnvExample(actualEnv), /Only files named/);
    await fs.writeFile(template, 'GITHUB_TOKEN=synthetic-secret');
    await assert.rejects(readEnvExample(template), /Invalid or non-empty/);
    const alias = path.join(root, 'link');
    await fs.symlink(project, alias, 'dir');
    await assert.rejects(readEnvExample(path.join(alias, '.env.example')), /Unsafe vault directory ancestry/);
    const second = path.join(root, 'second');
    await fs.mkdir(second);
    await fs.symlink(template, path.join(second, '.env.example'));
    await assert.rejects(readEnvExample(path.join(second, '.env.example')), /Unsafe or oversized/);
  } finally { await fs.rm(root, { recursive: true, force: true }); }
});

test('invalid template errors never contain the provided secret value', () => {
  const synthetic = 'demo-credentials-should-not-leak';
  assert.throws(() => parseEnvExample('TOKEN=' + synthetic), err => {
    assert.equal(err.message.includes(synthetic), false);
    return true;
  });
});

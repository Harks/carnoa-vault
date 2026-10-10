import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

function run(args, home, input = '') {
  return spawnSync(process.execPath, [path.resolve('src/cli.mjs'), ...args], {
    cwd: path.resolve('.'),
    encoding: 'utf8',
    input,
    env: { ...process.env, HOME: home },
    timeout: 10000
  });
}
test('CLI help advertises backup/restore but no plaintext reveal', () => {
  const result = run(['--help'], tmpdir());
  assert.equal(result.status, 0);
  assert.match(result.stdout, /backup.*restore/);
  assert.doesNotMatch(result.stdout, /(?:get|reveal|export-plaintext)/);
});
test('cannot pass a credential as extra argv and never echoes it', () => {
  const home = mkdtempSync(path.join(tmpdir(), 'carnoa-cli-test-'));
  try {
    const synthetic = 'synthetic-private-string-only';
    const result = run(['put', 'example', synthetic], home);
    assert.notEqual(result.status, 0);
    assert.doesNotMatch(result.stdout + result.stderr, new RegExp(synthetic));
    assert.ok(!existsSync(path.join(home, '.carnoa')));
  } finally { rmSync(home, {recursive:true,force:true}); }
});
test('stdin pipes are rejected for new passphrases, backups and restores', () => {
  const home = mkdtempSync(path.join(tmpdir(), 'carnoa-cli-test-'));
  try {
    for (const args of [['init'],['backup'],['restore','/tmp/fake-synthetic-backup.json']]) {
      const result = run(args, home, 'fake-synthetic-secret\n');
      assert.notEqual(result.status, 0);
      assert.match(result.stderr, /Interactive local terminal required/);
      assert.doesNotMatch(result.stdout + result.stderr, /fake-synthetic-secret/);
    }
    assert.ok(!existsSync(path.join(home, '.carnoa')));
  } finally { rmSync(home, {recursive:true,force:true}); }
});

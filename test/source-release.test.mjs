import test from 'node:test';
import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { buildSourceRelease } from '../scripts/build-source-release.mjs';
const sha = buffer => createHash('sha256').update(buffer).digest('hex');

test('source release is repeatable, checksummed and excludes tests/workflows', async () => {
  const destination = await fs.mkdtemp(path.join(tmpdir(), 'carnoa-release-test-'));
  try {
    const result = await buildSourceRelease(destination);
    assert.ok(result.fileCount >= 10);
    const bytes = await fs.readFile(result.archivePath);
    assert.equal(result.digest, sha(bytes));
    const checksum = await fs.readFile(result.checksumPath, 'utf8');
    assert.equal(checksum, result.digest + '  ' + path.basename(result.archivePath) + '\n');
    await assert.rejects(buildSourceRelease(destination), /EEXIST/, 'never overwrite an existing release artifact');
  } finally { await fs.rm(destination, { recursive: true, force: true }); }
});

test('source release manifest is private and only contains explicit trusted paths', async () => {
  const pkg = JSON.parse(await fs.readFile(new URL('../package.json', import.meta.url), 'utf8'));
  assert.equal(pkg.private, true);
  assert.ok(Array.isArray(pkg.files));
  assert.ok(pkg.files.includes('src/'));
  assert.ok(pkg.files.includes('LICENSE'));
  assert.ok(pkg.files.includes('docs/THREAT-MODEL.md'));
  assert.ok(pkg.files.includes('docs/SOURCE-PROVENANCE.md'));
  for (const entry of pkg.files) {
    assert.ok(!entry.startsWith('.') && !entry.startsWith('test/') && !entry.startsWith('scripts/'));
  }
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { verifySbom } from '../scripts/verify-sbom.mjs';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const sample = () => ({
  spdxVersion: 'SPDX-2.3',
  name: pkg.name + '@' + pkg.version,
  packages: [{
    name: pkg.name, versionInfo: pkg.version, licenseDeclared: pkg.license,
    SPDXID: 'SPDXRef-Test-Package'
  }],
  documentDescribes: ['SPDXRef-Test-Package']
});

test('zero-runtime-dependency SPDX document is valid', () => {
  assert.deepEqual(verifySbom(sample(), pkg),
    {packageCount: 1, name: pkg.name, version: pkg.version});
});
test('SBOM cannot omit application identity, alter license, or silently add packages', () => {
  assert.throws(() => verifySbom({...sample(),name:'other'}, pkg), /identity mismatch/);
  assert.throws(() => verifySbom({...sample(),packages:[...sample().packages,{name:'unreviewed'}]},pkg), /Unexpected package/);
  const changed = sample();
  changed.packages[0].licenseDeclared = 'Unknown';
  assert.throws(() => verifySbom(changed,pkg), /license mismatch/);
});
test('SBOM package identity must match its describe relationship', () => {
  const changed = sample(); changed.documentDescribes = [];
  assert.throws(() => verifySbom(changed,pkg), /describe the package/);
});

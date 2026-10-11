import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/** Validates the expected zero-third-party-dependency SPDX evidence.
 * This is not a software signature or evidence of a reproducible binary build.
 */
export function verifySbom(document, pkg) {
  assert.equal(document?.spdxVersion, 'SPDX-2.3', 'Unsupported SBOM format.');
  assert.equal(document?.name, pkg.name + '@' + pkg.version, 'SBOM application identity mismatch.');
  assert.ok(Array.isArray(document?.packages) && document.packages.length === 1,
    'Unexpected package in zero-dependency Vault SBOM.');
  assert.equal(document.packages[0].name, pkg.name, 'Package name mismatch.');
  assert.equal(document.packages[0].versionInfo, pkg.version, 'Package version mismatch.');
  assert.equal(document.packages[0].licenseDeclared, pkg.license, 'Package license mismatch.');
  assert.deepEqual(
    Object.keys(pkg.dependencies || {}),
    [],
    'Runtime dependency introduction requires a separate security review.'
  );
  assert.ok(Array.isArray(document?.documentDescribes) &&
    document.documentDescribes.includes(document.packages[0].SPDXID),
    'SBOM document must describe the package.');
  return { packageCount: document.packages.length, name: pkg.name, version: pkg.version };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const filename = process.argv[2];
  if (!filename || process.argv.length !== 3) {
    process.stderr.write('Usage: node scripts/verify-sbom.mjs <SPDX_JSON_FILE>\n');
    process.exitCode = 1;
  } else {
    try {
      const document = JSON.parse(readFileSync(filename, 'utf8'));
      const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
      const result = verifySbom(document, pkg);
      process.stdout.write('SBOM validated: ' + result.name + '@' + result.version + ', packages=' + result.packageCount + '\n');
    } catch {
      // Fail without emitting file contents, which may be untrusted.
      process.stderr.write('SBOM verification failed.\n');
      process.exitCode = 1;
    }
  }
}

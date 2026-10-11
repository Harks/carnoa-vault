#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { promises as fs } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const sha256 = value => createHash('sha256').update(value).digest('hex');
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';

/**
 * Twice independently create the package, compare digests and verify the
 * strict source allowlist. This proves determinism for this toolchain only.
 */
export async function buildSourceRelease(outputDirectory) {
  const temp = await fs.mkdtemp(path.join(tmpdir(), 'carnoa-source-release-'));
  try {
    const pkg = JSON.parse(await fs.readFile(path.join(root, 'package.json'), 'utf8'));
    if (pkg.private !== true || Object.keys(pkg.dependencies || {}).length ||
        Object.keys(pkg.optionalDependencies || {}).length || Object.keys(pkg.devDependencies || {}).length) {
      throw new Error('Source release requires a private, zero-dependency package.');
    }
    const releases = [];
    for (const label of ['a', 'b']) {
      const destination = path.join(temp, label);
      await fs.mkdir(destination);
      const result = JSON.parse(execFileSync(npm,
        ['pack', '--ignore-scripts', '--json', '--pack-destination', destination],
        { cwd: root, encoding: 'utf8', timeout: 30000, maxBuffer: 2*1024*1024 }))[0];
      if (!result || !Array.isArray(result.files) || !result.filename) throw new Error('Invalid npm pack output.');
      const paths = result.files.map(file => file.path);
      const required = [
        'package.json', 'LICENSE', 'README.md', 'SECURITY.md',
        'src/cli.mjs', 'src/vault.mjs', 'docs/SOURCE-PROVENANCE.md', 'docs/THREAT-MODEL.md',
        'docs/SECURITY-RELEASE-GATES.md'
      ];
      for (const item of required) if (!paths.includes(item)) throw new Error('Missing required release file.');
      if (paths.some(item => item.startsWith('test/') || item.startsWith('.github/') ||
        item.startsWith('scripts/') || item.includes('node_modules') ||
        item.includes('.env') || item.includes('lock') || item.endsWith('.pem'))) {
        throw new Error('Unexpected or sensitive file in source package.');
      }
      const bytes = await fs.readFile(path.join(destination, result.filename));
      releases.push({ result, digest: sha256(bytes), bytes });
    }
    if (releases[0].result.filename !== releases[1].result.filename ||
        releases[0].digest !== releases[1].digest ||
        !releases[0].bytes.equals(releases[1].bytes)) {
      throw new Error('Source package is not deterministic for this toolchain.');
    }
    const output = path.resolve(outputDirectory);
    await fs.mkdir(output, { recursive: true, mode: 0o700 });
    const archivePath = path.join(output, releases[0].result.filename);
    const checksumPath = archivePath + '.sha256';
    // Fail closed on existing files; do not clobber somebody else's evidence.
    const archive = await fs.open(archivePath, 'wx', 0o600);
    try { await archive.writeFile(releases[0].bytes); await archive.sync(); }
    finally { await archive.close(); }
    const checksum = await fs.open(checksumPath, 'wx', 0o600);
    try { await checksum.writeFile(releases[0].digest + '  ' + path.basename(archivePath) + '\n'); await checksum.sync(); }
    finally { await checksum.close(); }
    return Object.freeze({ archivePath, checksumPath, digest: releases[0].digest, fileCount: releases[0].result.files.length });
  } finally {
    await fs.rm(temp, { recursive: true, force: true });
  }
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv.length !== 3) {
    process.stderr.write('Usage: node scripts/build-source-release.mjs OUTPUT_DIR\n');
    process.exitCode = 1;
  } else {
    buildSourceRelease(process.argv[2])
      .then(result => process.stdout.write('Source archive built and independently compared. SHA256=' + result.digest + ', files=' + result.fileCount + '\n'))
      .catch(() => {
        process.stderr.write('Source release packaging failed.\n');
        process.exitCode = 1;
      });
  }
}

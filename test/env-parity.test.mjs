import test from 'node:test';
import assert from 'node:assert/strict';
import { promises as fs, realpathSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { readEnvExample, auditEnvCoverage } from '../src/env-template.mjs';

const fixtureUrl = new URL('../mac-companion/Tests/CarnoaCompanionCoreTests/Fixtures/env-parser-contract-v1.json', import.meta.url);

test('Node .env.example reader conforms to shared synthetic Swift contract', async () => {
  const contract = JSON.parse(await fs.readFile(fixtureUrl, 'utf8'));
  assert.equal(contract.version, 1);
  assert.ok(contract.cases.length >= 12);
  const tempRoot = await fs.mkdtemp(path.join(realpathSync(tmpdir()), 'carnoa-env-parity-'));
  try {
    for (const [i, scenario] of contract.cases.entries()) {
      const dir = path.join(tempRoot, 'example-' + i);
      await fs.mkdir(dir, { mode: 0o700 });
      const file = path.join(dir, scenario.fileName);
      await fs.writeFile(file, scenario.content, { mode: 0o600 });
      const run = async () => {
        const names = await readEnvExample(file);
        return auditEnvCoverage(names, contract.syntheticAvailableKeys);
      };
      if (scenario.valid) {
        assert.deepEqual(await run(), {
          required: scenario.required,
          matched: scenario.matched,
          missing: scenario.missing
        }, scenario.id);
      } else {
        await assert.rejects(run(), err => {
          assert.ok(!err.message.includes('synthetic-test-only-value'));
          return true;
        }, scenario.id);
      }
    }
  } finally {
    await fs.rm(tempRoot, { recursive: true, force: true });
  }
});

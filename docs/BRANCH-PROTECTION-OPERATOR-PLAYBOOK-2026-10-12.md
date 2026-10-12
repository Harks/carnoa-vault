# Carnoa Vault protected branches — enforced baseline and human-review gap

Updated: 2026-10-12 JST
Issue: https://github.com/Harks/carnoa-vault/issues/21

## Actual repository ruleset state

On 2026-10-12 an authorized repository admin created two active GitHub rulesets and verified their effective rules:

| Target ref | Ruleset | Enforcement |
|---|---|---|
| main | https://github.com/Harks/carnoa-vault/rules/24902302 | active |
| develop | https://github.com/Harks/carnoa-vault/rules/24902342 | active |

Each branch now:
- Requires a pull request and all review conversations resolved.
- Rejects force pushes and deletion.
- Requires four GitHub Actions checks from app 15368: node-verify (22), node-verify (24), codeql, sbom.
- Requires an up-to-date branch for passing status checks.
- Has no bypass actors configured.
- **Requires ZERO approving human reviews.** Human review and independent source assurance are still MISSING.

GitHub's older branches/BRANCH/protection API can still return 404 when a separate Rulesets mechanism is the source of protection. Use the active rulesets and effective repos/Harks/carnoa-vault/rules/branches/BRANCH API to verify enforcement.

## New required development flow

1. Start from latest develop and inspect open PRs, checks, and concurrent edits.
2. Implement a small feature on its own topic branch and open a feature -> develop PR.
3. Require Node22/24, codeql and sbom PR checks. For Mac code changes also examine the conditional macOS swift-synthetic CI; it is NOT an always-present required status.
4. **Independent human review is still required by product security policy** for crypto, authz, signing and native-secret work, even though GitHub does not yet enforce approvals. If a host safety gate blocks the merge, leave the PR open; no alternate client, bypass identity, force push or direct update is permitted.
5. After approved develop merge, promote via a separate develop -> main PR, after required CI.
6. Both branches are PR protected: a main merge adds a new commit, so synchronize through a NEW main -> develop PR (and its CI), not a direct update-ref fast-forward.
7. Verify both heads align after the sync PR and check the post-merge main CI/source attestation.

The signing workflow is MAIN-PUSH-ONLY, not a pre-merge status. Dependency Review remains unsupported/skipped; the Dependency Graph SBOM API returned 404 on 2026-10-12. Do not enable a required check that never runs.

## Human sign-off still needed

A solo maintainer cannot independently approve their own changes. Recruit a qualified independent reviewer with appropriate Write access; do not invent reviewer accounts or code owners. After they accept, increase the rulesets' required approval count from 0 to at least 1 and consider CODEOWNERS for security-critical paths, crypto, agent-broker modules, mac-companion source and workflows.

This change will intentionally prevent unattended AI merges until a real reviewer approves. Never weaken those controls to satisfy an automated completion target.

## Evidence required before closing Issue #21

- Confirm active rule IDs and exact required CI context/integration bindings.
- Safely test rejected direct push, missing-check PR, non-fast-forward/deletion attempts and bypass in a throwaway fork or sandbox. Do not attempt destructive tests against real main/develop.
- Verify review count >=1, independent reviewer identity and denial of self-review.
- Verify a fresh main -> develop sync PR works with the enforced checks.
- Review signed source provenance, supply-chain incident response and vulnerability triage. Main's PR checks and GitHub OIDC source attestation alone do not validate cryptography or native Mac binaries.

## Product readiness decision

Both branches are now meaningfully protected against unreviewed DIRECT pushes and missing CI, but are not independently peer reviewed. This is NOT sufficient to handle valuable passwords, issue real AI capabilities, claim completed cryptographic audit, or distribute trusted/native notarized Mac builds.

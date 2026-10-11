# GitHub branch protection and review playbook (2026-10-12)

Status: **operator action required**; documenting this does **not** enforce GitHub settings.
Tracking: [Issue #21](https://github.com/Harks/carnoa-vault/issues/21).

## Observed evidence (authenticated repository admin)

On 2026-10-12 JST, an authenticated GitHub CLI on the authorized Mac returned:
- GET /repos/Harks/carnoa-vault/branches/main/protection → HTTP 404, "Branch not protected"
- GET /repos/Harks/carnoa-vault/branches/develop/protection → HTTP 404, "Branch not protected"
- GET /repos/Harks/carnoa-vault/rulesets → []

Hence neither branch currently enforces protection via a legacy branch-protection rule or ruleset. GitHub Actions OIDC artifact attestations can still verify build provenance, but **they cannot prove source review or prevent a malicious direct push**.

The GitHub App connector may not have admin access to these endpoints, but the authenticated admin GitHub CLI did. Re-check settings under the current authorized account.

## Recommended admin changes (requires explicit owner decision)

Configure in GitHub repository **Settings → Rules → Rulesets** (or supported Branches protection) after securing an **independent qualified reviewer** with Write access.

1. Apply one enforceable rule to main and one to develop: require pull requests, block force pushes and deletions, require conversation resolution, and constrain bypass/administrator exceptions. For auth/crypto/signing/CI files, require review by an independent maintainer (not the commit author).
2. Main is a release branch. Promotion via reviewed develop→main PR only, *after* separate feature→develop PR checks. No direct main pushes, unreviewed merge paths, release signing workflow edits or unsigned binary attachments.
3. Develop is also protected. Feature PRs require review, up-to-date checks and security-negative tests. Do not allow a maintainer or AI to bypass rules to keep automation flowing.
4. Add CODEOWNERS for .github/workflows/**, scripts/build-source-release.mjs, src/vault.mjs, src/store.mjs, src/agent-grant-contract.mjs and mac-companion/Sources/**. **Do not invent GitHub usernames.** Add only actual independent reviewers who accepted access and ownership.
5. Required PR checks that are currently broad and relevant: Node CI node-verify (22), node-verify (24), codeql, and SBOM sbom. Confirm exact native GitHub check contexts/Apps before saving rules. A check name alone is insufficient if an attacker can spoof its status.
6. **Important conditional workflow limitation:** macOS synthetic CI currently only runs when mac-companion/** or its workflow file changes. Do NOT require "swift-synthetic" for every PR until a lightweight always-present trusted status check or a path-aware required aggregate workflow is built, otherwise docs-only PRs will be permanently blocked. For Mac changes, manually require/inspect that job until then.
7. Source provenance is generated **on main push**, not on incoming PRs; it should be audited after promotion, but cannot be marked as an always-present pre-merge status check without restructuring CI.
8. Dependency Review is **unsupported/skipped** at this repository today. Do NOT claim it passed, and do not require the missing status until GitHub Dependency Graph/security settings are fixed and checked.
9. Check Secret Scanning, Push Protection and Dependabot enabled status. An enabled toggle is not evidence of a tested leak response runbook.
10. Record the ruleset IDs, required check contexts, approval count, effective bypass groups and date in a security ADR. Keep a separate incident/revocation contact, because a signed malicious build is still malicious.

## Verification checklist (admin-only)

After configuring rules, read back the policy from GitHub API using an account authorized to view it and verify the rule applies to both refs. The API must no longer report "Branch not protected".

Perform **non-destructive** controlled tests using a throwaway branch and test PR in a sandbox/fork: missing-review denial, failing-check denial, blocked force push and blocked unauthorized bypass. Do not experiment with destructive force pushes directly against main/develop or compromise real release assets. Capture links/screenshots of status checks and rejected attempts, without secrets.

### Approval vs autonomous work

An independent human approval requirement intentionally means AI agents **cannot** automatically merge security-sensitive PRs by themselves. Agents may prepare PRs, resolve merge conflicts, run tests and request review, but cannot satisfy the independence requirement or bypass host safety checks through alternate tools/tokens. If the host blocks a merge, leave it open and report the blocker. This preserves the user's goal of a trustworthy solo-maintained OSS project, while making limitations transparent.

## Current release blocker impact

- No production credential beta, actual agent permissions, Keychain-based storage, signed native Mac releases or security certification on the strength of CI alone.
- The Node npm source attestation does not cover the mac-companion/ directory or any native .app. Native binary signing/notarization/provenance is separate future work.
- Source code and unit tests may still be published as clearly labeled synthetic experimental previews; production release gate remains blocked until independent crypto/security review and verified branch enforcement.

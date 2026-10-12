# OSS CI and supply-chain baseline (in progress)

Implemented:
- Main/develop + PR validation on Node.js 22 and 24.
- SHA-pinned checkout/setup-node and CodeQL v3. Dependency-review is configured but **temporarily disabled** until GitHub dependency graph support is enabled/verified; do not claim it passed.
- No npm runtime dependencies or third-party credential/cryptography packages.
- Test suite includes wrong password, tampering, file permissions, concurrent creation, backup/restore, default deny agent policy.

SBOM evidence workflow (2026-10-11): Node 24 generates SPDX 2.3 using `npm sbom` from a lockfile containing zero third-party packages. A local validation script rejects mismatched package identity, license, or additional dependencies; CI uploads the SBOM as a short-retention workflow artifact. This is **inventory evidence, not a signed release, reproducible build, complete binary composition analysis, or proof of independent audit**.

Repository-level GitHub API settings enabled on 2026-10-11: secret scanning, push protection and Dependabot security updates. These enabled settings are not evidence that a secret scanning incident drill has been completed.

**Dependency-review blocker:** GitHub Actions explicitly reported that Dependency review is not supported on this repository. The conditional job is skipped unless a repository admin sets CARNOA_DEPENDENCY_REVIEW_SUPPORTED=true after fixing dependency graph support and verifying a successful PR run. The default skip is visible and must remain a release-readiness blocker. No third-party runtime dependencies exist today; test/supply-chain.test.mjs explicitly rejects any new dependency and mutable CI action tags.

Source-only provenance: source-provenance.yml runs on **main push only**, packages an explicit allowlist twice using npm pack --ignore-scripts, checks byte-identical SHA-256 digests, publishes the ephemeral artifact and generates a GitHub OIDC/Sigstore attestation. This must be verified against the actual GitHub main workflow run before claiming it operates. The signer identity is only as trustworthy as the protected main branch and reviewed CI configuration. As of 2026-10-12 GitHub active rulesets main 24902302/develop 24902342 are verified through effective-branch rules: PR-only, strict Node22/24, codeql and sbom checks, non-fast-forward/deletion prevention, no bypass actors. Human review minimum is **zero** and rejection behavior was not sandbox-tested; independent review remains pending (Issue #21). See docs/SOURCE-PROVENANCE.md.

Still pending / nonclaims:
- Node22/24, CodeQL and SPDX SBOM passed on GitHub main. Dependency Review remains **unsupported/skipped** and Dependency Graph SBOM API returned 404 on 2026-10-12. GitHub OIDC Node source attestation and in-workflow verification passed on main; an independent external verifier drill remains pending.
- SPDX 2.3 SBOM was uploaded and validated on main; Node source provenance workflow generated attestation and verified it on main. Independent native Developer ID signing/notarization and full artifact reproduction remain unimplemented.
- Signed and independently reproducible native releases, long-term artifact retention, supply-chain incident response, independent crypto audit, cross-platform OS keychain and malicious update testing.
- Secret scanning setup and a tested vulnerability reporting runbook.

Requirements:
- Never run untrusted PR code with secrets or write tokens; do not use pull_request_target.
- No manually exempting failed security tests for security-sensitive code.
- Treat a failing CI as release blocker. Do not claim that CodeQL or automated scanners replace human penetration testing.
- Keep all workflows pinned to exact reviewed commit SHAs, not mutable tags.

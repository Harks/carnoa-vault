# OSS CI and supply-chain baseline (in progress)

Implemented:
- Main/develop + PR validation on Node.js 22 and 24.
- SHA-pinned checkout/setup-node and CodeQL v3. Dependency-review is configured but **temporarily disabled** until GitHub dependency graph support is enabled/verified; do not claim it passed.
- No npm runtime dependencies or third-party credential/cryptography packages.
- Test suite includes wrong password, tampering, file permissions, concurrent creation, backup/restore, default deny agent policy.

SBOM evidence workflow (2026-10-11): Node 24 generates SPDX 2.3 using `npm sbom` from a lockfile containing zero third-party packages. A local validation script rejects mismatched package identity, license, or additional dependencies; CI uploads the SBOM as a short-retention workflow artifact. This is **inventory evidence, not a signed release, reproducible build, complete binary composition analysis, or proof of independent audit**.

Repository-level GitHub API settings enabled on 2026-10-11: secret scanning, push protection and Dependabot security updates. These enabled settings are not evidence that a secret scanning incident drill has been completed.

**Dependency-review blocker:** GitHub Actions explicitly reported that Dependency review is not supported on this repository. The conditional job is skipped unless a repository admin sets CARNOA_DEPENDENCY_REVIEW_SUPPORTED=true after fixing dependency graph support and verifying a successful PR run. The default skip is visible and must remain a release-readiness blocker. No third-party runtime dependencies exist today; test/supply-chain.test.mjs explicitly rejects any new dependency and mutable CI action tags.

Source-only provenance: source-provenance.yml runs on **main push only**, packages an explicit allowlist twice using npm pack --ignore-scripts, checks byte-identical SHA-256 digests, publishes the ephemeral artifact and generates a GitHub OIDC/Sigstore attestation. This must be verified against the actual GitHub main workflow run before claiming it operates. The signer identity is only as trustworthy as the protected main branch and reviewed CI configuration. See docs/SOURCE-PROVENANCE.md.

Still pending / nonclaims:
- Node 22/24, CodeQL and SPDX SBOM generation have passed on GitHub main. Dependency Review remains **unsupported/skipped** and is still an explicit release blocker. Source attestation needs a successful main run and external verifier drill before it is considered complete.
- SPDX 2.3 SBOM was uploaded and validated on main; source provenance workflow awaits successful main-run verification. Independently reproducible/signed native artifacts remain unimplemented.
- Signed and independently reproducible native releases, long-term artifact retention, supply-chain incident response, independent crypto audit, cross-platform OS keychain and malicious update testing.
- Secret scanning setup and a tested vulnerability reporting runbook.

Requirements:
- Never run untrusted PR code with secrets or write tokens; do not use pull_request_target.
- No manually exempting failed security tests for security-sensitive code.
- Treat a failing CI as release blocker. Do not claim that CodeQL or automated scanners replace human penetration testing.
- Keep all workflows pinned to exact reviewed commit SHAs, not mutable tags.

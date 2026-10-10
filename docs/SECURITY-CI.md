# OSS CI and supply-chain baseline (in progress)

Implemented:
- Main/develop + PR validation on Node.js 22 and 24.
- SHA-pinned checkout/setup-node, CodeQL v3 and dependency-review actions, each with scoped permissions.
- No npm runtime dependencies or third-party credential/cryptography packages.
- Test suite includes wrong password, tampering, file permissions, concurrent creation, backup/restore, default deny agent policy.

Still pending / nonclaims:
- Prove CodeQL and dependency review workflows green on GitHub; do not mark them supported just because workflow YAML exists.
- SBOM generation, release artifact provenance, reproducible builds and signing.
- Supply-chain incident response, independent crypto audit, cross-platform OS keychain and malicious update testing.
- Secret scanning setup and a tested vulnerability reporting runbook.

Requirements:
- Never run untrusted PR code with secrets or write tokens; do not use pull_request_target.
- No manually exempting failed security tests for security-sensitive code.
- Treat a failing CI as release blocker. Do not claim that CodeQL or automated scanners replace human penetration testing.
- Keep all workflows pinned to exact reviewed commit SHAs, not mutable tags.

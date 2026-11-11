# Carnoa Vault Node.js attestation runtime update — 2026-11-12

Status: source-control proposal only; security-critical provenance workflow must receive independent human/security review before integration.

The 2026-10-21 and 2026-11-11 Node.js security releases fix multiple high-risk vulnerabilities in Node 24 (HTTP/2, TLS and client-certificate authentication, among others). Updated source provenance workflow from `24.15.0` to **`24.22.3`**. The CI matrix retains major selectors `22` and `24` and resolves their respective supported patch releases dynamically.

- Official release: https://nodejs.org/en/blog/release/v24.22.3/
- Independent verification required: `npm run verify`, SBOM verify, fixture-based tampering tests, attest archive reconstruction/checksum verification with an exact source SHA.
- This PR does not release source archives, sign binary builds, modify credentials, change encryption or authorize a production password manager.
- Changes to `.github/workflows/source-provenance.yml` require human review under `AGENTS.md`. A queued, skipped or unavailable GitHub workflow is not a passing security review.
- Release PR path: feature → develop; then a separate protected develop → main PR. Do not bypass main/develop branch protections or automatically advance production.

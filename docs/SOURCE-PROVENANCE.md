# Experimental source archive and provenance

Status: **source-only experimental evidence**. This is not an audited password manager, a signed application binary, or a production release.

## Trust goal

Allow users to verify (a) exactly which reviewed GitHub repository and commit produced an archive, (b) its SHA-256 digest, and (c) whether an independent second packaging pass with the same toolchain produces byte-identical output. Main branch provenance is signed using GitHub Actions OIDC and Sigstore, **not** using an owner-maintained signing key.

## Local reproducibility (synthetic data only)

    npm ci --offline --ignore-scripts --no-audit --no-fund
    npm run verify
    npm run release:source
    cd dist
    sha256sum --check *.sha256

The package explicitly allowlists source modules, license, security policy and critical threat-model/recovery documents. It excludes tests, workflow configuration, developer scripts, local Vault files, machine-generated backups and environment secrets.

The source build script uses two separate npm pack --ignore-scripts executions and requires their byte-for-byte equality and matching SHA-256 digest. It fails if an archive with the same name is already present in the output directory. Repeatability is currently verified within one Linux/toolchain setup; different Node/npm/OS distributions are **not** asserted to produce identical bytes. The GitHub workflow pins Node.js 24.15.0 and records npm --version. Changes to tooling require a new reproducibility assessment.

## Github OIDC artifact attestation (only on main push)

The source-provenance.yml workflow:
1. Checks out main with SHA-pinned GitHub Actions, with repository contents read-only.
2. Installs the zero-dependency application without executing install scripts; runs security/regression tests.
3. Generates identical source archives twice with checksum evidence.
4. Uses the SHA-pinned actions/attest action to request an ephemeral Sigstore certificate, sign provenance for the archive digest, and publish it to GitHub Attestations.
5. Invokes GitHub CLI attestation verification on the artifact, failing the job if verification fails.
6. Uploads the archive and checksum as a short-retention Actions artifact (14 days).

Workflow has id-token:write, attestations:write and artifact-metadata:write only in the source-provenance job. No long-lived signing key, release publishing token, or customer credentials are needed. Do not run this signing job on untrusted pull requests or feature/develop branches.

## Verification by an independent user

Download the archive and its SHA256 file from the **main** branch source-provenance Actions workflow artifact for the exact expected commit. In the download directory:

    sha256sum --check *.sha256
    gh attestation verify carnoa-vault-prototype-0.1.0.tgz --repo Harks/carnoa-vault

On macOS, use shasum -a 256 -c *.sha256 instead of sha256sum.

Inspect the provenance subject digest, repository URI, source SHA, workflow identity and signing certificate. Compare the signed SHA to the expected reviewed main commit. A successful command alone does **not** imply trusted code if branch protections, workflow reviews or signing infrastructure are compromised.

GitHub documents verification at https://docs.github.com/en/actions/how-tos/secure-your-work/use-artifact-attestations/use-artifact-attestations . Public repositories on current GitHub plans can use GitHub artifact attestations. No claim of live end-to-end verification is made until the workflow actually passes on main and an independent verification drill is recorded.

## Branch review control is not yet verified
On 2026-10-11, GitHub returned an empty repository rulesets list. The
legacy main branch-protection endpoint returned a 403 to the installed
integration, so protection could **not** be verified. This does not prove
that no legacy protection exists. Nonetheless no trust claim should depend
on main requiring an independent review until an admin confirms enforcement
and tests rejected direct pushes/CI bypasses. See Issue #21.

## Hard limits

- This is a **Node npm source archive**, not a compiled or signed macOS, Windows, Linux, mobile or browser application. The mac-companion/ SwiftUI code and any native Mac .app are NOT covered by this Node source attestation. The native Mac packaging script uses only local **ad-hoc integrity** signatures and is not a trusted/notarized distribution pipeline.
- Reproducing the package with the same npm toolchain does not prove that the underlying source is free of backdoors or contains secure cryptography.
- An attestation establishes who built an artifact under which GitHub workflow; it does not prove application behavior, branch protection, safe secret handling or security-review signoff.
- No end-user-secret beta, cloud Vault, decryption key escrow, auto-install, OTA updates or release promotion is authorized by a successful workflow.
- Independent cryptography/security audit, release incident response, native keychain integration, recovery drills, secure build reproducibility across platforms and trusted branch/change-control remain release blockers.

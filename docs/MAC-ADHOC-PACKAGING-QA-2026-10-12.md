# Mac .app packaging evidence and trust limitations

Date: 2026-10-12
Status: LOCAL SYNTHETIC DEMO — not release distribution

## Evidence collected

On an authorized Apple Silicon Mac with macOS 26.6.2, Xcode 27.0 / Swift 6.4, the Carnoa Companion Swift Package built a release-mode arm64 executable. The developer-only packaging script assembled a valid app bundle with Info.plist and LSUIElement=true so the sample starts as a menu-bar helper. The built bundle passed plutil lint, codesign verification, and a second attempt to overwrite it was refused.

The local signature report explicitly said Signature=adhoc and TeamIdentifier=not set. **This verifies integrity after local packaging only.** It does not provide Developer ID identity, a secure release certificate, Apple notarization, Gatekeeper trust, Hardened Runtime, sandbox permissions or independent security assessment. No consumer download or production auto-update is authorized.

## How to reproduce (developer test only)

On macOS 14+ with Swift 6.0+:

    swift test --package-path mac-companion
    swift build -c release --package-path mac-companion
    mkdir -p /tmp/carnoa-synthetic-output
    bash mac-companion/Scripts/build-synthetic-demo-app.sh /tmp/carnoa-synthetic-output
    bash mac-companion/Scripts/verify-synthetic-demo-app.sh "/tmp/carnoa-synthetic-output/Carnoa Synthetic Demo.app"

Use an EMPTY output directory. The scripts intentionally fail on an existing bundle and never overwrite it. The input/output are developer-owned test files with synthetic variable names. Avoid any real passwords, tokens, app credentials or Apple Passwords data.

## Threats, limits and next work

- Ad-hoc signature does not bind a trusted publisher or source commit; the existing Node npm OIDC source attestation does NOT attest the mac-companion folder or the compiled native binary.
- The scripts use regular filesystem paths and local temporary files; malicious same-UID filesystem races and a compromised compiler/runner remain out of scope.
- Although the UI currently reads user-selected .env.example-only synthetic data, a file-provider location (e.g., iCloud) can cause OS-managed retrieval. Local-only evaluation requires explicit local fixtures.
- This is a Swift Package wrapping a demo executable, not a shipped notarized app with hardened entitlements, a security-validated update mechanism or a secure Keychain/Touch ID implementation.
- macOS 15 CI must run tests and verify packaging, but successful CI cannot replace actual macOS UI accessibility tests and independent cryptographic/security review.
- For production distribution, design Developer ID application signing, entitlements, sandbox/hardened runtime, Apple notarization/stapling, verified provenance for the **actual native binary**, signed updates, downgrade/rollback controls, incident revocation and disaster recovery.

All real-credential use, provider API operations and live AI-agent authorization remain blocked until the independent review and backend trust boundaries are implemented.

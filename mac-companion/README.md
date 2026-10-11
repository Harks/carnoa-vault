# Carnoa macOS Synthetic Companion

This is a **Mac-native, source-only, experimental SwiftUI menu bar prototype** for validating the Carnoa Local Secrets concept. It uses **fake key names only**. It does not read Apple Passwords, macOS Keychain, actual .env credentials, the Carnoa Vault encrypted file, or any AI agent secrets.

## Try on a Mac (synthetic data only)

Requires macOS 14+ and Swift 6.0+ (Xcode 16 or later).

    cd mac-companion
    swift test
    swift build -c release
    swift run carnoa-companion-demo

The executable creates a menu bar item. Choose **Open demo dashboard**, then select Fixtures/.env.example from the system file picker. Dotfiles may be hidden; press Command–Shift–Period in the picker if needed.

The demo hardcodes three *fictional secret-variable names* and shows only required/matched/missing totals. This is an independent Swift implementation of the synthetic-template audit, not a native wrapper around the real Vault.

## AI approval UX simulation — no authority

Choose **Preview fictional AI approval (no access)** from the menu. The separate native window displays one fixed fake request for github.pulls.list against github:repo/ExampleOrg/demo-repo. Review the purported agent identity (explicitly **UNVERIFIED**), read-only operation, exact fictional resource and two-minute expiration. Use **Review**, **Simulate confirmation**, **Simulate denial**, or **Reset** to exercise the interface.

The strictly allowlisted simulation refuses altered resources, write operations, unreviewed confirmation, expired/future requests and repeated terminal decisions. Its in-memory state machine always reports executable=false, including after a simulated confirmation. No grant, key, OAuth token, OS authentication, GitHub API call, network socket or audit log is created. These tests do NOT replace OS process identity attestation, revocation, user consent or a reviewed policy-enforcement broker.


## Strict data boundary

- Read only an explicitly user-selected file literally named .env.example. Never open .env, passwords, private SSH keys or environment-value files.
- Reject any nonempty KEY=value, invalid UTF-8, duplicate name, malformed key, oversized input (64 KiB), and selected file symlink; no automatic directory traversal.
- Store no secrets, use no network APIs, make no Keychain/LocalAuthentication calls, perform no AI-tool execution or grant issuance, and send no telemetry. The simulated AI review/confirm/deny state machine never produces an executable capability.
- Only counts are shown. Unexpected template bytes are read locally only long enough to reject them. If a selected file lives in iCloud or another file-provider location, macOS may fetch it through its own file-provider stack; choose local synthetic files for strictly offline trials.
- Parent-directory races/symlink ancestry are **not independently secured** in this native prototype. It is NOT a general file-scanning security boundary.

## Release and security status

- This is a Swift Package executable built from source, **not** a signed/notarized .app, a Keychain integration, Touch ID approval, password manager, verified agent broker, or externally audited application.
- The original Node.js v1 Vault decrypts its entire data blob into local process memory even for name comparisons. The Swift demo intentionally does **not** open that Vault; it uses a fixed synthetic set.
- A future native client must use independently reviewed cryptography, verify workload identity separately from biometric user presence, and avoid importing Apple Passwords outside supported explicitly approved credential exchange.

See docs/MAC-KEYCHAIN-TRUST-ADR-2026-10-11.md, docs/MAC-LOCAL-SECRETS-STRATEGY-2026-10-11.md, and Issue #24 before implementing real-secret functionality.

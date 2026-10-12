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

## Package an EXPERIMENTAL local synthetic .app (not for distribution)

This Mac-only script assembles a menu-bar .app bundle using an Info.plist, the release-mode Swift executable and an **ad-hoc integrity signature**. It does not access any Apple Developer ID, signing secret, notarization service or production credential.

    cd mac-companion
    bash Scripts/build-synthetic-demo-app.sh "$(mktemp -d)"
    # The script prints the output path. To verify a particular output:
    bash Scripts/verify-synthetic-demo-app.sh "/path/to/Carnoa Synthetic Demo.app"

The built bundle is for local developer review of a fictional key-name dashboard. LSUIElement suppresses a normal Dock icon in favor of the MenuBarExtra. Do not distribute it as a trusted password manager or suggest Gatekeeper/notarization approval. A successful ad-hoc codesign only checks local integrity, not publisher identity. The GitHub macOS CI packages and verifies a throwaway app, but **never uploads it for end users**. Full Developer ID signing, sandbox/entitlements, notarization, provenance, consent UX and security review remain pending.

## Strict data boundary

- Read only an explicitly user-selected file literally named .env.example. Never open .env, passwords, private SSH keys or environment-value files.
- Reject any nonempty KEY=value, invalid UTF-8, duplicate name, malformed key, oversized input (64 KiB), and selected file symlink; no automatic directory traversal.
- Store no secrets, use no network APIs, make no Keychain/LocalAuthentication calls, perform no AI-tool execution or grant issuance, and send no telemetry.
- Only counts are shown. Unexpected template bytes are read locally only long enough to reject them. If a selected file lives in iCloud or another file-provider location, macOS may fetch it through its own file-provider stack; choose local synthetic files for strictly offline trials.
- Parent-directory races/symlink ancestry are **not independently secured** in this native prototype. It is NOT a general file-scanning security boundary.

## Release and security status

- The developer script can create a locally **ad-hoc-signed** .app bundle, but this is NOT a Developer ID signed/notarized, Gatekeeper-approved, reviewed or production application, nor a Keychain integration, Touch ID approval, password manager or verified agent broker.
- The original Node.js v1 Vault decrypts its entire data blob into local process memory even for name comparisons. The Swift demo intentionally does **not** open that Vault; it uses a fixed synthetic set.
- A future native client must use independently reviewed cryptography, verify workload identity separately from biometric user presence, and avoid importing Apple Passwords outside supported explicitly approved credential exchange.

See docs/MAC-KEYCHAIN-TRUST-ADR-2026-10-11.md, docs/MAC-LOCAL-SECRETS-STRATEGY-2026-10-11.md, and Issue #24 before implementing real-secret functionality.

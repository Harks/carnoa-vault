# macOS companion synthetic QA — 2026-10-12

Status: experimental source-only UI, no real secrets.

## Device and build evidence
- Verified on SS-MBP-2021.local (Apple Silicon arm64) on macOS 26.6.2.
- Xcode 27.0, Swift 6.4, macOS SDK 27.0.
- Swift Package platform minimum: macOS 14.
- On-device command: swift test (package root): **6 XCTest cases passed / 0 failed**.
- On-device command: swift build --configuration release: **build succeeded**.
- No Keychain, LocalAuthentication/Touch ID, Apple Passwords, API calls, real Vault or live Agent Broker were involved.

## What was tested
- Only explicitly selected .env.example names; deny .env, nonempty values, shell syntax, duplicate keys, bad UTF-8, more than 64 KiB or more than 256 keys.
- Synthetic coverage computed in memory using a fixed set of *fictional key names* and displayed only required/matched/missing totals.
- The SwiftUI MenuBarExtra and dashboard compile in both debug tests and release build; no claim of signed/notarized .app packaging.
- The file picker is user-directed; its contents are never exported to external services or AI tools.
- NOTE: user-selected files in iCloud/file-provider storage could trigger macOS-owned background retrieval; strictly offline trials must choose locally stored synthetic files. OS file-provider data handling is outside the application's assurance.

## Not yet tested or implemented
- No user-reviewed real UI interaction/screenshot accessibility evaluation yet.
- No actual Keychain or Touch ID protection, authenticated AI-agent process, source signing/notarization of Mac binaries or app sandbox/entitlements.
- No integration with the Node v1 Vault, and NO real password or API-key import. The Node v1 Vault still decrypts the entire authenticated data blob to examine item names; this Mac demo intentionally uses only fixed synthetic key names.
- No cross-platform native package CI result until workflow mac-companion.yml is executed on GitHub.
- File importer enforces selected filename and input syntax; this is not a native symlink-race-resistant file API. Issue #16 remains.
- External cryptographic/security review #5, main branch independent review #21, v2 item metadata isolation #27 and safe recovery remain mandatory.

## Next evidence
1. Verify GitHub macOS runner compiles and tests SwiftUI code on develop and main after PR.
2. Obtain UX/accessibility review on an actual Mac, using synthetic example fixtures.
3. Security architecture review for separately verified AI workloads vs user presence, then prototype Keychain/Touch ID on fake secrets only.

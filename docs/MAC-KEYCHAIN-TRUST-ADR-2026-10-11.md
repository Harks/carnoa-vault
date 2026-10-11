# ADR: Mac native trust UX and Carnoa-owned Keychain boundary

Date: 2026-10-11
Status: proposed, security-review required, no implementation authorized for real credentials
Parent strategy: docs/MAC-LOCAL-SECRETS-STRATEGY-2026-10-11.md
Tracking: Issue #24

## Decision

For Mac, prefer a separately signed/notarized SwiftUI/AppKit companion (menu bar and a minimal project-coverage view), initially on **synthetic, aggregate-only metadata**. Use Apple's supported Security.framework and LocalAuthentication APIs for future *Carnoa-owned* key material. Do not build a second consumer password AutoFill app, bypass Apple Passwords protection, or present a Touch ID prompt as proof of AI-agent identity.

The current Node.js v1 encrypted Vault is experimental. It decrypts a whole authenticated blob into local application memory, including secret values, when computing a name-only inventory. Treat v2 metadata separation and independently reviewed key handling as prerequisites to storing valuable secrets.

## OS API ownership and responsibilities

| Layer | Proposed owner | Permitted scope | Exclusions |
|---|---|---|---|
| Mac UI | SwiftUI/AppKit | Local projects, aggregated coverage, explicit approval/denial UX | No raw password log, screenshots, silent credential harvesting |
| Native key access | Security.framework Keychain Services | Carnoa-owned wrapping keys / protected small secrets, explicit Keychain access controls | No assumption that all Apple Passwords entries are available to third-party apps |
| Local confirmation | LocalAuthentication, Touch ID / passcode | Ask for user presence per sensitive action | Not workload attestation, not consent for arbitrary unseen future requests |
| Local Vault | Versioned client-side cryptographic format | AEAD, on-device key lifecycle, explicit migration | No server keys, hidden recovery backdoor, plaintext sync |
| Broker (future) | Separate authenticated local service | Bind verified workload principal, user, resource, operation and expiring grant; revoke/replay-protect | No arbitrary proxy URLs, secrets returned to model, LLM-asserted approvals |
| Team policy | Existing Carnoa Governance | Enterprise approvals, review, evidence and revocation | No duplicate authority or shared raw-secret database |

## Apple API facts and constraints

- Security.framework Keychain Services protects application-managed secrets. See https://developer.apple.com/documentation/security/keychain-services
- LocalAuthentication provides platform-mediated user authentication. Biometric data is never given to the app. See https://developer.apple.com/documentation/localauthentication
- Apple's access-control example describes requiring user presence when retrieving a Keychain item: https://developer.apple.com/documentation/localauthentication/accessing-keychain-items-with-face-id-or-touch-id
- AuthenticationServices credential exchange may allow participating credential providers to import/export **through supported user-mediated flows**; it does not grant arbitrary background access to Apple's Passwords database. See https://developer.apple.com/documentation/authenticationservices/ascredentialimportmanager
- A Mac notarized app, hardened runtime and App Sandbox need separate platform engineering evidence: https://developer.apple.com/documentation/security

## Minimal safe synthetic prototype

1. SwiftUI menu-bar view shows local project readiness, count of required/matched/missing variable names. It reads outputs from the strict .env.example-only parser, never a production .env file.
2. User selects a synthetic fixture Vault and sees a conspicuous "Experimental — do not use real secrets" warning. The app must not emit any item names, decrypted values, identifiers or environment variables.
3. App-owned Keychain/Touch ID module is initially a **mock or synthetic-only test fixture** until platform threat modeling is independently reviewed. A permission failure keeps sensitive actions blocked.
4. Agent requests are demonstrated as non-executable proposals with a visible target operation, resource, principal claim, TTL, consent and denial. A proposal is not an issued grant.
5. No provider calls, background API credentials, Apple Passwords import, browser extension, startup auto-run, cloud sync or telemetry.

## Prototype evidence (2026-10-12)
A mac-companion SwiftUI MenuBarExtra and fixture-only dashboard now compile on a real Apple Silicon Mac. Six native Swift unit tests pass and release-mode compilation succeeds. The Swift UI accepts only a user-selected .env.example, displays synthetic counts, and deliberately does not access the Node Vault, Apple Passwords, Keychain, LocalAuthentication or any AI provider. It is source-only, unsigned/unnotarized and not approved for real secrets. See docs/MAC-COMPANION-QA-2026-10-12.md.

## Pending design choices (require ADR review)

- Separate native process/XPC boundary vs monolithic AppKit/SwiftUI shell.
- How to bind local peer process identity to a signed/notarized app and verified workload, with PID reuse/code injection/replay attacks considered.
- Keychain access-control flag selection, presence fallback, Secure Enclave assumptions and versioned encryption-key wrapping.
- Controlled interface for Node-to-native migration: never send raw secret bytes over broad IPC or to an LLM.
- macOS path aliases (e.g. /var -> /private/var), symlinks and race-resistant file access; native Unix dirfd/openat2 analogues require platform-specific assessment.
- Enrollment, revocation and offline recovery without backend-held decryption secrets.

## Threats and negative acceptance tests

- Prompt injection and forged agent approval claims: must not grant access.
- Wrong/expired/replayed grant, swapped project/environment, cross-user request and high-impact write: deny before any provider call.
- Screen lock, absent Touch ID, biometric invalidation, code-signing mismatch and native service crash: deny or prompt safely; no cached plaintext.
- Snapshot rollback, missing recovery key, corrupted ciphertext, weak passphrase, symlink and same-UID path race: fail closed where achievable; clearly document remaining limits.
- No plain secrets or login credentials in application logs, crash reports, metrics, model prompts, clipboard history or screenshots.
- Tests must run on the actual target Mac OS, not just Linux Node or mocked APIs.

## Launch and distribution gates

Required before real-password beta: independent crypto/code review, documented v2 metadata/key wrapping migration, signed and notarized Mac distribution, protected main/develop branch and independent approval workflow, verified provenance, safe recovery drills, controlled audit evidence and incident-response capacity. Until then, **synthetic-only**.

No implementation status or security certification is claimed by this ADR.

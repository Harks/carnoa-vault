# Apple Passwords / Credential Exchange feasibility (2026-10-12)

Status: **researched design decision, no API integration, no real credentials accessed.**
Issue: [M-003 #25](https://github.com/Harks/carnoa-vault/issues/25).

## Decision: DEFER migration, keep Carnoa complementary

Carnoa's Mac product is a **local-first developer-secrets companion and future operation-level AI Broker**, not an Apple Passwords clone. Do not bulk-import users' human passwords, existing passkeys, OTPs or Keychain contents in the initial version. Existing credentials remain in Apple Passwords, 1Password or another preferred manager. An authorized one-time transfer can be considered only after real developer/user research, signed and independently reviewed native app, safe client-side key lifecycle, recovery, secure logging and incident support.

## What Apple officially supports

| Topic | Officially described behavior | Carnoa consequence |
|---|---|---|
| Availability | The new credential transfer flow is described for macOS 26, iOS/iPadOS 26 and visionOS 26 | The synthetic Swift package currently targets macOS 14+, so migration must be **feature-gated to supported OS builds**; do not assume it works on macOS 14–25 |
| Import | ASCredentialImportManager receives credentials only after another participating manager initiates export, the person selects the receiving app and the OS delivers a user activity with an import token | No background enumeration of Apple Passwords or silent access to the Passwords database |
| Export | ASCredentialExportManager begins with requestExport(for:) and system-mediated UI: user selects credentials and receiving app; exporter provides ASExportedCredentialData | Not an automatic continuous sync, unattended secret API, or arbitrary hidden export |
| Supported data | Apple's WWDC presentation describes passkeys, passwords, verification codes and more via a FIDO Alliance-aligned credential exchange schema | Do not flatten passkeys/private keys into .env strings; any native-format handling requires independent security/compatibility review |
| Data flow | Apple documents an OS-mediated app-to-app transfer without writing insecure export files to disk and protected by device local authentication | Does not mean receiver can safely store data without independently reviewed encryption, recovery and process protections |
| Participating app config | Credential provider extension Info.plist includes SupportsCredentialExchange=YES and SupportedCredentialExchangeVersions containing version "1.0" | A plain Swift Package demo without a signed credential provider extension is **not sufficient** |
| Import launch | Receiving app registers NSUserActivityTypes / ASCredentialExchangeActivityType, obtains UUID ASCredentialImportToken from userInfo, and passes it to importCredentials(token:) | Requires real native app lifecycle, user intent and authenticated system token; never accept agent-provided tokens or untrusted URLs |
| Import errors | Apple documents that import fails if the token does not belong to the intended importing app | Must surface safe denial, not retry through CSV/Keychain scraping |
| Export errors | Apple documents failures when no importer is available or a device lacks passcode/Touch ID/Face ID | Do not bypass device-user-presence requirements |

## Official references, accessed 2026-10-12

- [WWDC25: What's new in passkeys](https://developer.apple.com/videos/play/wwdc2025/279/) — user-initiated, locally authenticated credential transfer and macOS 26 availability.
- [ASCredentialImportManager](https://developer.apple.com/documentation/authenticationservices/ascredentialimportmanager) — extension capabilities, exchange format versions, NSUserActivity, import token and imported credential data.
- [ASCredentialExportManager](https://developer.apple.com/documentation/authenticationservices/ascredentialexportmanager) — human-selected export, system UI, receiving app and out-of-process mediation.
- [importCredentials(token:)](https://developer.apple.com/documentation/authenticationservices/ascredentialimportmanager/importcredentials(token:)) — OS-issued UUID token and intended-app validation.
- [requestExport(for:)](https://developer.apple.com/documentation/authenticationservices/ascredentialexportmanager/requestexport(for:)) — user-mediated exporting and local-authentication prerequisites.
- [ASExportedCredentialData](https://developer.apple.com/documentation/authenticationservices/asexportedcredentialdata) — CXF wrapper containing accounts and multiple credential kinds.
- [AuthenticationServices](https://developer.apple.com/documentation/authenticationservices/) — provider extension and exchange API families.

## Threats and data-handling requirements if migration is ever approved

1. Request explicit, reviewable user selection for each batch. Do not include a background API, hidden export, or "sync all" default.
2. Authenticate the system-provided import flow and verify the importing app's signed identity/entitlement; do not accept URLs, user-supplied UUIDs or LLM-generated approval claims as equivalent.
3. Never log imported credential payloads, tokens, passkey private keys or account metadata. Bound memory lifetime, count, size and file writes; prevent plaintext CSV fallback.
4. Preserve credential format and private-key semantics; do not route imported passkeys/API secrets into agent prompts, command-line arguments or environment variables.
5. Require independently audited Carnoa-owned storage/metadata isolation, hardening and recovery before activating the user-facing import affordance. Any authenticated export does NOT certify destination storage.
6. Make every import cancellable, show precise source/destination, deduplicate safely, guarantee no partial overwrite and record only redacted audit evidence. Run synthetic and malicious-file test vectors.
7. Feature gate based on confirmed target OS and extension configuration, and ensure real signed/notarized Mac bundle; a bare Swift CLI/Swift Package is not an eligible participating credential manager.
8. Include non-support and rollback explanations; do not delete the source credentials on the user's behalf.

## Product prioritization

**Now:** keep the current SwiftUI synthetic .env.example audit and fake approval preview. Recruit developers to establish whether switching away from Apple Passwords is necessary; preliminary strategy expects most will not want to migrate.

**Later, only if supported by interviews:** prototype a signed credential-provider extension with **synthetic credentials only**, validate macOS 26 compatibility, system user flow, token handling and Apple extension signing. Security reviewer and explicit user consent are mandatory.

**Kill criterion:** if developer workflows can be served by Carnoa-owned API/SSH secrets and a trusted broker without moving web passwords/passkeys, omit import entirely. Focus resources on workload identity, scoped approvals, revocation and native Mac distribution.

### What this research DOES NOT establish

No live Apple Passwords test, no credential transfer, no extension entitlement or provisioning test, no import/export implementation, no proof all password managers support the protocol, no security certification and no authorization to use real credentials.

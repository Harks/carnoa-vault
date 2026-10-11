# Carnoa Vault — Mac Local Secrets × AI Agent Strategy

Updated: 2026-10-11
Status: product direction / unvalidated hypotheses / NOT a launch authorization

## Decision

Do NOT rebuild Apple's free Passwords app, or describe Carnoa Vault as a general 1Password alternative. Build an OSS local-first developer-secrets **companion** on Mac first, followed by a real, verified, operation-level AI Agent Broker. Keep existing human passwords and passkeys in Apple Passwords or the user's chosen mature tool.

Positioning: "AIに秘密情報を渡さず、Mac上で開発環境のアクセスを把握・制御する。"

## Existing products and boundaries (official sources)

| Product | Existing strengths | Initial Carnoa test |
|---|---|---|
| Apple Passwords macOS 27 | Human passwords, passkeys, verification codes, shared groups, security recommendations, password history and import/export | Project-level developer secrets coverage and AI-operation approvals are not documented as dedicated Passwords features |
| 1Password Unified Access | Human, machine and AI access governance; developing/available credentials and privileged access controls | Solo Mac-first, OSS, offline usability; differentiation MUST be tested |
| Bitwarden Secrets Manager | Project secrets, CLI, machine accounts, scoped access | Local-first workflow with no account/server for individual devs |
| Infisical and other providers | Existing secrets and agent-oriented tooling | Compare real provider controls; never claim "secretless AI" is a novel invention |

Official source checkpoints (revalidate features quarterly):
- Apple Passwords: https://support.apple.com/guide/passwords/welcome/mac
- Apple AuthenticationServices: https://developer.apple.com/documentation/authenticationservices/
- User-authorized exchange (not silent Passwords database reads): https://developer.apple.com/documentation/authenticationservices/ascredentialimportmanager
- Apple Keychain/LocalAuthentication: https://developer.apple.com/documentation/security/keychain-services and https://developer.apple.com/documentation/localauthentication
- 1Password Unified Access: https://1password.com/press/2026/mar/1password-unified-access
- Bitwarden Secrets Manager CLI: https://bitwarden.com/help/secrets-manager-cli/

The comparison is a feature/documentation review, NOT measured demand or proof of absence in competitor products.

## Priority jobs

| Priority | Segment | Job to be done | Hypothesis | WTP evidence |
|---|---|---|---|---|
| P0 | Solo Mac developer | Identify which configuration keys each repo requires without exposing secret values | Offline .env.example-only metadata audit | Not measured |
| P0 | AI-heavy developer | Authorize one verified agent for exactly one safe action and limited time | Workload-bound local broker and user approval | Not measured |
| P1 | Developer working on multiple apps | Avoid mixing dev/staging/prod credentials across projects | Environment-scoped grants and clear inventory | Not measured |
| P1 | Startup CTO | Revoke contractor access with evidence | Carnoa Governance integration, not duplicate approval DB | Not measured |
| P2 | General consumer / family | Emergency password inheritance or autofill | High legal/custody/support risk; defer | Not measured |

Do not start with browser autofill, Wi-Fi credentials, bulk Apple Passwords ingestion, whole-password migration, mobile sync, emergency family access, or hosted credential custody. Mature providers already cover many of these, and there is no validated acquisition advantage.

## First user journey (safe prototype)

1. Developer runs a local-only CLI with **synthetic/test credentials** while the project remains unaudited.
2. A project-maintained .env.example contains only KEY= lines. NEVER inspect .env or read actual credential values.
3. Local scanner compares expected key names against unlocked local Vault item *names*. Output contains ONLY aggregate required/matched/missing counts, no key names, secrets, IDs or endpoints. **Implementation caveat:** v1 decrypts all item values into local process memory together with names; the output is metadata-only, but memory is not. Avoid actual sensitive credentials until a reviewed v2 metadata-isolation design (Issue #27).
4. Missing coverage becomes a local task for the developer. Do not automatically inject environment variables, start an agent, call APIs or print secret values.
5. Later, verified local workload identity + explicit user authorization may request a bounded operation, e.g. GitHub list PRs for one repository. Requests and grants must be independently authenticated.
6. Team approval and incident policy belong to Carnoa Governance. ModelGate receives no credentials.

## Trust boundaries and architecture

Apple Passwords / 1Password / Bitwarden continue to manage human logins. Carnoa can build its own test Vault and local inventory without reading their credential databases. Apple AuthenticationServices credential exchange is user-mediated and must NOT be treated as unrestricted third-party read access. macOS 26 exchange requires participating credential-provider extensions and is not a generic credential read API; user-initiated migration is DEFERRED pending demand and independent review. See docs/APPLE-PASSWORDS-CREDENTIAL-EXCHANGE-RESEARCH-2026-10-12.md.

Mac native UI (future): SwiftUI/AppKit, OS Keychain and LocalAuthentication/Touch ID to protect *Carnoa-owned* key material with deliberate per-operation consent. Touch ID approval is NOT a verified AI process identity. Real Broker must bind verified principal, user, resource, action, request fingerprint, grant audience, TTL, revocation and replay protection. No generic HTTP proxy, redirect to arbitrary origins, pasted cookies or secret strings in agent prompts/logs.

Carnoa Governance in ss-workspace retains team policy, approvals, audit and incidents. Do not duplicate its database, billing, identities or secret custody. Existing Supabase remediation Vault is unrelated to this local OSS Vault. Do not silently migrate it.

## Autonomous development sequence

| Phase | Deliverable | Acceptance |
|---|---|---|
| 0 — baseline | Experimental local encrypted Vault, synthetic negative tests, source attestation | Node 22/24, CodeQL, audit limitations explicit |
| 1 — wedge | .env.example-only parser + aggregate local Vault item-name audit | Reject .env, symlinks, nonempty values, invalid syntax and oversized templates; no secret output/network |
| 2 — Mac trust UX | Signed/notarized native Mac companion, app-owned Keychain wrapper and Touch ID | Real Mac validation + independent crypto review BEFORE valuable credential beta |
| 3 — Broker | Independently verified workload + resource/action-scoped expiring grants and human consent | Forgery/expiry/replay/SSRF/redirect negative tests + external pen test |
| 4 — revenue | Carnoa Governance approval/audit/offboarding bridge | Real tenant auth/RBAC, evidence and revocation proof; paid validation |

Every change must use feature → develop PR and distinct develop → main PR. Security and release blockers cannot be bypassed by agents or green unit tests.

## Evidence and pricing plan

Interview 15 developers (at least 5 using multiple AI coding tools) plus 5 CTO/security owners. Observe specific recent usage of .env, Apple Passwords, Keychain, 1Password, Bitwarden and agents. Use synthetic examples only; never collect actual credentials. Metrics: weekly pain frequency, project audit completion time, missing-key coverage, false positives, first-use value, repeat use at day 7/30, explicit paid-pilot commitments and trust objections.

Go/no-go *hypotheses*, not known benchmarks: 8/15 independently report repeated pain; 5/15 use synthetic offline prototype twice; 3/15 express actionable willingness to pay. If consumers mostly want autofill, recommend Apple Passwords rather than building a duplicate.

OSS local use should remain free. Team-wide policy, audited approvals and support MAY monetize after independent audit, real uptake and pricing research. Do not forecast ARR without evidence. Trademark clearance is still required.

## Required release gates

External independent cryptographic code review, safe v2 recovery design, platform-specific secure key storage, signed and verifiable native distribution, protected main/develop with independent reviews, Dependency Review issue resolution, live broker identity testing, incident support and realistic disaster-recovery drills. Until verified, NEVER ask users to store valuable real credentials.

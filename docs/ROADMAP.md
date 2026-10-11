# AI-executable roadmap

Process: feature -> develop PR -> verified develop -> main PR. Tests and doc updates per slice. Do not handle real credentials pre-audit.

| ID | Priority | Task | Measurable done | Status |
|---|---|---|---|---|
| V-001 | P0 | Local AES-GCM vault and CLI | Roundtrip, tamper/wrong passphrase, private filesystem, no secret stdout tests | Implemented, audit pending |
| V-002 | P0 | Threat model and autonomous AI rules | Owner boundaries, fail-closed gates documented | Implemented |
| V-003 | P0 | Backup/restore | Encrypted local snapshot, authenticated read-only preflight, restore to absent destination, corruption/overwrite tests | Prototype implemented; external review, interrupted-write fault injection and cross-platform recovery drill pending |
| V-004 | P0 | Passphrase strength & recovery plan | New-Vault minimum and basic offline screening, backward compatibility; user-held recovery key design and drills | Partial: onboarding implemented, recovery-key design ADR only, no recovery implementation |
| V-008 | P0 | Store boundary and path hardening | Reject unencrypted writes, unknown metadata, and symlink ancestors; negative tests | Implemented in prototype; external review pending |
| V-009 | P1 | OS-native race-free path binding | Dirfd/openat-style canonical path binding and cross-platform security audit | Blocked: platform design and external review |
| V-005 | P0 | External audit | Independent reviewer report, findings fixed | Blocked: reviewer |
| V-006 | P1 | Argon2id + versioned migration | Audited dependency, parameter benchmark, old-file tests | Not started |
| V-007 | P1 | OS native key wrapping | Keychain/DPAPI test fixtures, cross-platform review | Not started |
| B-001 | P0 | Real verified broker identities/grants | Forgery/expiry/replay/revocation negative tests | Not started |
| B-002 | P0 | Read-only Github provider adapter | Exact GET allowlist, no redirects/SSRF/token return | Blocked: B-001 |
| B-003 | P0 | Human consent and audit | Verified approval outside AI, redaction and integrity | Blocked: B-001 |
| O-001 | P0 | CI supply-chain hardening | Pin actions, CodeQL, secret scan, dependency review, provenance | Partial: Node/CodeQL and SPDX artifacts verified; GitHub dependency-review unsupported and native distribution review pending |
| O-002 | P0 | Attested source distribution | Explicit archive files allowlist, repeated-byte SHA check, main-only GitHub OIDC signature and consumer verifier | Source archive and workflow implemented, subject to main-run verification; native signed binaries not implemented |\n| O-003 | P0 | Main/develop signing trust protections | Admin-verified branch rules, required PR reviews/checks, direct push/force-push denials and CODEOWNERS enforcement | Blocked: admin + independent reviewer, branch protection not verified (Issue #21) |
| M-001 | P0 | Mac developer local environment audit | Parse only empty-value .env.example; compare Vault item names; count-only output, no secret disclosure; negative tests | Implemented in prototype (Node synthetic tests); no real-secret use |
| M-002 | P0 | Verified Mac native trust UX | SwiftUI menu bar, Carnoa-owned Keychain wrapper, Touch ID consent, signed/notarized app | Synthetic-only SwiftUI menu-bar prototype + 6 native macOS tests + local release build completed; no Keychain, Touch ID, integration, signing or review yet |
| M-003 | P1 | Approved integration with existing password managers | Study Apple AuthenticationServices credential exchange with user approval; no silent Passwords DB access | Research only; no credential import implemented |
| M-004 | P1 | Project audit without decrypting secret values | v2 cryptographic metadata isolation, item-level authenticated encryption, backwards-compatible migration and review | Not started; blocked by security review #5 and recovery design #9 (Issue #27) |
| G-001 | P1 | Discovery interviews | 15 developer and 5 IT/security interviews | Planned, no interviews conducted |

Immediate next autonomous PR: validate macOS real-device behavior for M-001 and begin M-002 native Keychain/Touch ID architecture ADR (synthetic fixtures only). In parallel resolve repo branch protection (O-003) and GitHub Dependency Review capability, then design B-001 independently verified agent identity and revocation; do not make actual provider calls. Use docs/MAC-LOCAL-SECRETS-STRATEGY-2026-10-11.md for product focus. Never use real credentials before independent cryptographic assessment.

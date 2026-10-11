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
| B-001 | P0 | Real verified broker identities/grants | Forgery/expiry/replay/revocation negative tests | Offline synthetic Ed25519 verification reference and 8 negative/positive tests added; NO verified workload identity, persistent revocation, executable grant, real broker or user consent. Still not started as production auth |
| B-002 | P0 | Read-only Github provider adapter | Exact GET allowlist, no redirects/SSRF/token return | Blocked: B-001 |
| B-003 | P0 | Human consent and audit | Verified approval outside AI, redaction and integrity | Blocked: B-001 |
| O-001 | P0 | CI supply-chain hardening | Pin actions, CodeQL, secret scan, dependency review, provenance | Partial: Node/CodeQL and SPDX artifacts verified; GitHub dependency-review unsupported and native distribution review pending |
| O-002 | P0 | Attested source distribution | Explicit archive files allowlist, repeated-byte SHA check, main-only GitHub OIDC signature and consumer verifier | Source archive and workflow implemented, subject to main-run verification; native signed binaries not implemented |\n| O-003 | P0 | Main/develop signing trust protections | Admin-verified branch rules, required PR reviews/checks, direct push/force-push denials and CODEOWNERS enforcement | Blocked: GitHub CLI confirmed main and develop *not protected* (HTTP 404) and no rulesets; admin + independent reviewer required (Issue #21) |
| M-001 | P0 | Mac developer local environment audit | Parse only empty-value .env.example; compare Vault item names; count-only output, no secret disclosure; negative tests | Implemented in prototype (Node synthetic tests); no real-secret use |
| M-002 | P0 | Verified Mac native trust UX | SwiftUI menu bar, Carnoa-owned Keychain wrapper, Touch ID consent, signed/notarized app | Synthetic-only SwiftUI menu bar + separate non-executable approval UX, 14 native macOS tests and local release build completed; no Keychain, Touch ID, verified identity, signing or review yet |
| M-003 | P1 | Approved integration with existing password managers | Study Apple AuthenticationServices credential exchange with user approval; no silent Passwords DB access | Research only; no credential import implemented |
| M-004 | P1 | Project audit without decrypting secret values | v2 cryptographic metadata isolation, item-level authenticated encryption, backwards-compatible migration and review | Not started; blocked by security review #5 and recovery design #9 (Issue #27) |
| G-001 | P1 | Discovery interviews | 15 developer and 5 IT/security interviews | Planned, no interviews conducted |

Next: validate the 14-test Mac approval preview on GitHub macOS CI and obtain real human UI/accessibility review. After independent architecture assessment, prototype Carnoa-owned Keychain/Touch ID on synthetic fixtures only; keep user presence separate from authenticated AI workload identity. In parallel resolve O-003 GitHub branch protection and Dependency Review, design a persistent broker replay/revocation ledger and externally verified XPC peer identity, with no provider calls or credential access. Use docs/MAC-LOCAL-SECRETS-STRATEGY-2026-10-11.md and docs/AGENT-GRANTS-PREAUTH-CONTRACT-2026-10-12.md. Never use real secrets before independent security review.

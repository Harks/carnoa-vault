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
| B-002 | P0 | Read-only Github provider adapter | Exact GET allowlist, no redirects/SSRF/token return | Synthetic offline typed GET request reference, strict resource+pagination, SHA-256 binding and no-execution tests implemented; **real provider adapter blocked by B-001 identity, consent, transport security and external review** |
| B-003 | P0 | Human consent and audit | Verified approval outside AI, redaction and integrity | Blocked: B-001 |
| O-001 | P0 | CI supply-chain hardening | Pin actions, CodeQL, secret scan, dependency review, provenance | Partial: Node/CodeQL and SPDX artifacts verified; GitHub dependency-review unsupported and native distribution review pending |
| O-002 | P0 | Attested source distribution | Explicit archive files allowlist, repeated-byte SHA check, main-only GitHub OIDC signature and consumer verifier | Node source attestation and in-workflow gh verification succeeded on main; native signed binaries, independently reviewed protected-main controls and durable distribution still missing |
| O-003 | P0 | Main/develop signing trust protections | Enforced PR and CI requirements, denied ref deletion/non-fast-forward updates, independent security reviewer and CODEOWNERS | **Partially complete: active rulesets main 24902302 and develop 24902342 verified. Mandatory reviewer count = 0. Human independent approval, CODEOWNERS and sandbox denial tests still missing (Issue #21)** |
| M-001 | P0 | Mac developer local environment audit | Parse only empty-value .env.example; compare Vault item names; count-only output, no secret disclosure; negative tests | Implemented in prototype (Node synthetic tests); no real-secret use |
| M-002 | P0 | Verified Mac native trust UX | SwiftUI menu bar, Carnoa-owned Keychain wrapper, Touch ID consent, signed/notarized app | Synthetic-only SwiftUI menu bar + 7 native macOS tests + local ad-hoc-integrity .app bundling verified; no Developer ID signature, notarization, sandbox validation, Keychain, Touch ID, verified agent identity or independent review. PR #34 adds simulated approval UI, still open. |
| M-003 | P1 | Approved integration with existing password managers | Study user-initiated Apple credential exchange on macOS 26; no silent Passwords DB access | Official Apple API research completed in docs/APPLE-PASSWORDS-CREDENTIAL-EXCHANGE-RESEARCH-2026-10-12.md; **defer implementation** until user demand, security review and native extension signing; no import implemented |
| M-004 | P1 | Project audit without decrypting secret values | v2 cryptographic metadata isolation, item-level authenticated encryption, backwards-compatible migration and review | Not started; blocked by security review #5 and recovery design #9 (Issue #27) |
| M-005 | P1 | Node/Swift example-template contract parity | One shared 16-case synthetic JSON fixture, Node and Swift tests, BOM/isolated CR negative cases, bounded inputs | Implemented and passed Node22/24, macOS Swift, CodeQL and SBOM CI, PR #39/#40 on main; independent review still pending |
| G-001 | P1 | Discovery interviews | 15 developer and 5 IT/security interviews | Planned, no interviews conducted |

Next: Both main and develop now require PRs and CI. Use feature->develop PR, develop->main release PR, then MAIN->DEVELOP synchronization PR, never direct ref updates. Enroll a qualified independent reviewer and raise mandatory security approvals from 0 to 1; do not bypass host safety-gated PR #34. Fix GitHub Dependency Graph/Review (SBOM API currently 404); then continue synthetic Mac Keychain/Touch ID design, durable broker revocation and authenticated workload identity without real provider calls. External independent audit still required.

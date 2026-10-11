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
| O-001 | P0 | CI supply-chain hardening | Pin actions, CodeQL, secret scan, dependency review, provenance | Partial: signed/reproducible builds and GitHub dependency-review capability missing; SBOM upload configured pending CI verification, scanning enabled |
| G-001 | P1 | Discovery interviews | 15 developer and 5 IT/security interviews | Not started |

Immediate next autonomous PR: validate SBOM artifact and GitHub dependency graph support, then design reproducible signed releases (O-002) with a verifiable build process. Proceed to V-004 recovery-key design reviews and B-001 broker identity tests only after explicit security gates. Never use real credentials before an independent cryptographic assessment.

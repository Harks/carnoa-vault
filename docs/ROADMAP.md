# AI-executable roadmap

Process: feature -> develop PR -> verified develop -> main PR. Tests and doc updates per slice. Do not handle real credentials pre-audit.

| ID | Priority | Task | Measurable done | Status |
|---|---|---|---|---|
| V-001 | P0 | Local AES-GCM vault and CLI | Roundtrip, tamper/wrong passphrase, private filesystem, no secret stdout tests | Implemented, audit pending |
| V-002 | P0 | Threat model and autonomous AI rules | Owner boundaries, fail-closed gates documented | Implemented |
| V-003 | P0 | Backup/restore | Encrypted export only, atomic dry-run import, corruption/overwrite tests | Next, not started |
| V-004 | P0 | Passphrase strength & recovery plan | User warning, unrecoverable loss UX, tested offline recovery design | Not started |
| V-005 | P0 | External audit | Independent reviewer report, findings fixed | Blocked: reviewer |
| V-006 | P1 | Argon2id + versioned migration | Audited dependency, parameter benchmark, old-file tests | Not started |
| V-007 | P1 | OS native key wrapping | Keychain/DPAPI test fixtures, cross-platform review | Not started |
| B-001 | P0 | Real verified broker identities/grants | Forgery/expiry/replay/revocation negative tests | Not started |
| B-002 | P0 | Read-only Github provider adapter | Exact GET allowlist, no redirects/SSRF/token return | Blocked: B-001 |
| B-003 | P0 | Human consent and audit | Verified approval outside AI, redaction and integrity | Blocked: B-001 |
| O-001 | P0 | CI supply-chain hardening | Pin actions, CodeQL, secret scan, dependency review, provenance | Not started |
| G-001 | P1 | Discovery interviews | 15 developer and 5 IT/security interviews | Not started |

Immediate next autonomous PR: V-003 using synthetic vaults only, with an explicit no-plaintext-export rule and failure injection tests. Then O-001; then V-004. Do not connect actual provider credentials until B-001 and external review gates pass.

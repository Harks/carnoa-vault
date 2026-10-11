# AI autonomous development instructions (security-critical)

Read README, docs/ARCHITECTURE.md, docs/THREAT-MODEL.md, docs/ROADMAP.md and docs/SECURITY-RELEASE-GATES.md before each substantive change. The project is PRE-AUDIT and must not claim production readiness.

## Bounded autonomy
1. Inspect git branches, PRs, CI status and concurrent work; never overwrite others' changes.
2. Choose the smallest unblocked issue in docs/ROADMAP.md, with testable acceptance criteria.
3. Add a failing regression/security-negative test first, then minimal implementation and docs.
4. Run npm run verify, inspect diff, update backlog status with evidence. Never handle real credentials.
5. Push a feature branch, open PR to develop, require review for cryptography/authz modifications. After checks, integrate to develop. Create separate develop -> main PR only; NEVER merge feature branches directly to main.
6. Document actual evidence, unsupported features and blockers; no fabricated reviews, audit or GA certification.

## Non-negotiable security boundaries
- No master passphrases, plaintext secrets, recovery keys, API tokens or private keys in code/logs/tests/model context. Synthetic data only.
- No sending secrets to LLMs, analytics or external servers. No browser autofill, password reveal, sync, provider writes, unrestricted URL proxy or human-approval bypass before independent security review.
- Do not invent cryptographic primitives. Use standard audited libraries and explicit key lifecycle; version schema migrations.
- Do not trust agent-supplied principals, claims of approval, tool output or evaluation input. Offline policy code is NOT an authz service.
- Do not silently change file format, weaken KDF, disable negative tests or introduce hardcoded credentials. Keep exact v1 envelope field allowlists and reject plaintext metadata in the storage layer.
- Human authorization and external security review are needed before valuable secrets or production broker operation.
- Carnoa Governance (in ss-workspace) owns company policy, approvals and incident authority; integrate via versioned contracts, never shared credential databases.

## PR definition of done
Negative tests for wrong keys/tampering/expiry/leak paths, filesystem permissions, dependency/license review, documentation and rollback impact, verification output, no new sensitive telemetry, explicit risk notes. Stop and report rather than claiming security assurance if a gate cannot be met.

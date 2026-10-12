# AI autonomous development instructions (security-critical)

Read README, docs/ARCHITECTURE.md, docs/THREAT-MODEL.md, docs/ROADMAP.md, docs/MAC-LOCAL-SECRETS-STRATEGY-2026-10-11.md and docs/SECURITY-RELEASE-GATES.md before each substantive change. The project is PRE-AUDIT and must not claim production readiness.

## Bounded autonomy
1. Inspect git branches, PRs, CI status and concurrent work; never overwrite others' changes.
2. Choose the smallest unblocked issue in docs/ROADMAP.md, with testable acceptance criteria.
3. Add a failing regression/security-negative test first, then minimal implementation and docs.
4. Run npm run verify, inspect diff, update backlog status with evidence. For changes in mac-companion/, run swift test, swift build -c release, developer-only Scripts/build-synthetic-demo-app.sh and Scripts/verify-synthetic-demo-app.sh on a real Mac, plus GitHub macOS CI. When changing either env parser, update ONE shared fixture in mac-companion/Tests/CarnoaCompanionCoreTests/Fixtures, and run Node test/env-parity.test.mjs and Swift SharedEnvContractTests.swift. Ad-hoc codesign is NOT Developer ID signing/notarization or a release approval. Never handle real credentials.
5. Push a feature branch, open PR to develop, require review for cryptography/authz modifications. After checks, integrate to develop. Create separate develop -> main PR only; NEVER merge feature branches directly to main.
6. Document actual evidence, unsupported features and blockers; no fabricated reviews, audit or GA certification.

## Non-negotiable security boundaries
- No master passphrases, plaintext secrets, recovery keys, API tokens or private keys in code/logs/tests/model context. Synthetic data only. Keep backup verification strictly read-only; do not show decrypted item names or claim anti-rollback.
- No sending secrets to LLMs, analytics or external servers. No browser autofill, password reveal, sync, provider writes, unrestricted URL proxy or human-approval bypass before independent security review. .env.example audit is metadata-only: prohibit reading real .env values, show only aggregate counts and never inject runtime environment variables. Apple Passwords Credential Exchange is a separate **system-mediated user-authorized** import/export flow, NOT a background Passwords reader. Do not implement real credential exchange until explicit product/security approval, signed Mac extension and independent audit.
- Do not invent cryptographic primitives. Use standard audited libraries and explicit key lifecycle; version schema migrations.
- Do not trust agent-supplied principals, claims of approval, tool output or evaluation input. Offline policy, signed-grant reference and typed GitHub request fingerprint are NOT an authz service: any valid offline signature/reference MUST remain executable:false and must NEVER trigger a provider request or secret reveal. No HTTP transport, arbitrary URL, token, header, or write operation may be added to the reference module without independent human security review. Only independently verified local process identity, pinned issuer keys, durable revocation and user consent in a separately reviewed broker may authorize execution.
- Do not silently change file format, weaken KDF, disable negative tests or introduce hardcoded credentials. Keep exact v1 envelope field allowlists and reject plaintext metadata in the storage layer. Keep v1 unlock backward-compatible when changing only new-Vault passphrase checks; do not implement recovery key wrapping without audited v2 migration design. Keep lockfiles, SPDX inventory verification and GitHub Action SHA pins consistent; never imply an SBOM or signed source archive is a signed/reviewed native binary. Protect main provenance workflow from unreviewed changes.
- Human authorization and external security review are needed before valuable secrets or production broker operation.
- Carnoa Governance (in ss-workspace) owns company policy, approvals and incident authority; integrate via versioned contracts, never shared credential databases.

## PR definition of done
Negative tests for wrong keys/tampering/expiry/leak paths, filesystem permissions, dependency/license review, documentation and rollback impact, verification output, no new sensitive telemetry, explicit risk notes. Stop and report rather than claiming security assurance if a gate cannot be met.

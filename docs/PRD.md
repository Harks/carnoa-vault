# Product requirements — 2026-10-10

## Who and why
Developers who use Claude Code, Codex, IDE agents and multiple SaaS APIs need safely scoped AI operations without exposing reusable API tokens or passwords to the model, hosted vendor or logs. A solo-maintained product must provide inspectable cryptography, secure defaults and externally reviewable releases rather than relying on founder reputation.

## Product
Carnoa Vault: local offline password/API-secret storage. Future Carnoa Agent Broker: verified agent identities, operation/resource-bound grants, provider mediation and consent. Both are OSS-first; hosted E2EE sync and organization controls are optional paid hypotheses.

## Current MVP
Local encrypted JSON vault; hidden TTY create/upsert/list/remove; fail-closed integrity/permissions; offline read-grant policy reference; regression tests and docs. No agent credential execution path yet. Intentionally no CLI plaintext secret output.

## Non-goals now
No browser plugin, autofill, cross-device backup/recovery, credential export, HTTP server, OAuth integration, real Github token proxy, self-hosted cloud, external security certification, AI automatic write action.

## Acceptance criteria
- Root keys never exist on a Carnoa server (there is none); persisted vault contains no clear item names or secrets.
- Wrong passphrase, modified ciphertext/tag, unsupported KDF and unsafe file modes must fail closed.
- Never accept plaintext credential via argv, env or piped stdin; hidden local prompt only.
- No write action in agent policy reference; unverifiable principal or grant cannot pass.
- Security reviewer and signed releases are blockers to real-password beta.

## Evidence needed before investment
15+ interviews with AI-heavy developers, 5+ security/IT admins; observe real permission workflows, willingness to pay, objections to serverless vs E2EE sync, migration friction and incident support expectations. Metrics are not available yet.

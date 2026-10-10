# Carnoa Vault

**Experimental open-source, local-first credential vault + offline AI-agent policy reference.**

**DO NOT USE REAL OR PRODUCTION SECRETS.** This project has not received independent cryptographic review. It is not a certified password manager or operational AI agent gateway.

## Product goal
Make trust technically verifiable rather than dependent on a solo developer: no central server, no account, no stored plaintext password, no operator-held master passphrase or recovery key. A future sync service may store ciphertext only (opt-in). Future AI operations must be mediated by a trusted broker, never by giving raw API tokens to the model.

## Implemented
- AES-256-GCM local encryption via built-in Node/OpenSSL crypto, 96-bit random nonce and integrity tag, random 256-bit salt per save, scrypt N=131072/r=8/p=1.
- Encrypted item names and secret values; only format, vault UUID, cipher/KDF metadata and approximate size remain visible.
- Local 0700 directory / 0600 file, symlink rejection, atomic write, single-writer lock and bounded input sizes.
- Hidden interactive TTY prompts: init, put NAME, list, remove NAME. No secret reveal command, no argv/env/stdin-pipe secrets, no telemetry.
- Pure offline **reference-only** agent read-policy evaluator, not a real authenticated access broker.
- Node.js 22+, no runtime dependencies, security-negative tests.

## Run with synthetic data only
Install Node.js 22 or later.

    npm run verify
    node src/cli.mjs init
    node src/cli.mjs put synthetic-example
    node src/cli.mjs list
    node src/cli.mjs remove synthetic-example

Storage: ~/.carnoa/vault.json. No server, cloud account, backend access, password recovery or multi-device restore exists yet. Back up your passphrase offline. Never put valuable secrets into the prototype.

## Trust and limitations
A hostile device, malicious update, process debugger, memory dump, keylogger or weak passphrase can compromise local secrets. JavaScript runtime cannot guarantee zeroization. Snapshot rollback attacks are not detected. There is no signed binary, external audit, cross-platform release qualification, backup, agent gateway, or hardware-backed secret unlock.

- Product requirements: docs/PRD.md
- Architecture / integration: docs/ARCHITECTURE.md and docs/INTEGRATIONS.md
- Security model: docs/THREAT-MODEL.md
- Security release blockers: docs/SECURITY-RELEASE-GATES.md
- AI development plan: AGENTS.md and docs/ROADMAP.md

Carnoa brand/trademark clearance remains pending. License: Apache-2.0.

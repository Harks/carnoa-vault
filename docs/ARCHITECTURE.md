# Architecture / cryptographic decisions (pre-audit)

## Current data flow
Human local terminal -> hidden TTY prompt -> local AES-256-GCM encryption -> ~/.carnoa/vault.json. No network calls, cloud accounts, server-side decryption or telemetry.

A future verified local Agent Broker may mediate actions to provider APIs, with grants issued via local user consent. AI never needs to receive raw secrets.

## Vault file format
Version 1 JSON: format, version, random UUID, KDF name/parameters/salt, cipher name/nonce/tag/ciphertext. Everything inside encrypted items array (IDs, names, values, timestamps) is opaque to anyone without passphrase. Ciphertext length is visible.

Encryption key: Node crypto.scrypt master passphrase + random 32-byte salt (N=131072,r=8,p=1,maxmem=256 MiB) -> 32 bytes. AES-256-GCM, fresh random 12-byte nonce, 16-byte authentication tag, AAD containing version and vault UUID. Per-save salt and nonce are regenerated. KDF values fixed and envelope bounded to prevent attacker-supplied expensive parameters. Node Buffer is zeroed best-effort; JS strings/swap/crash dumps are not guaranteed secure.

Persistence: 0700 final directory, 0600 file, O_NOFOLLOW open, inode type and mode validation, 12 MiB file limit, random temporary file in same directory, fsync and atomic replacement for existing Vaults, hard-link create-if-absent for new Vaults/snapshots, single writer lock. Symlink filesystem ancestors / same-UID malware / snapshots are outside guaranteed protection. A valid whole-file rollback cannot be detected in v1.

## Local metadata-only developer secrets coverage (prototype, 2026-10-11)
The local env-template module reads ONLY a filename exactly .env.example, rejects symlinks/ancestor symlinks, oversized files, invalid variable names, duplicate keys and any non-empty KEY=value lines. It compares key names against an already-unlocked local Vault's item names, returning only required/matched/missing totals. It never outputs names, secrets, URLs or values; it does not read a real .env file, produce runtime environment variables or execute an agent request. For a Mac with OS-level symlink aliases use canonical paths. Same-UID races remain unmitigated.

## Cross-language configuration template contract (2026-10-12)
The strict .env.example parser is independently implemented in Node and Swift but tested against one shared 16-case synthetic fixture (docs/ENV-PARSER-PARITY-CONTRACT-2026-10-12.md). Both reject leading UTF-8 BOM before decoding, isolated trailing CR, shell syntax and nonempty values, while accepting valid Windows CRLF. Node and Swift tests load the same JSON fixture; runtime filesystem safety and memory isolation remain separately unverified.

## Offline signed grant contract reference (2026-10-12)
src/agent-grant-contract.mjs verifies only a strict Ed25519 signed reference grant with exact synthetic subject/audience/github repository/read-only operation/request digest/nonce/time bounds. It uses an ephemeral single-process nonce Set and returns executable=false **even on a valid signature**. No signing private key, network API, provider token, process identity, Keychain or Apple Passwords integration is exposed. Caller-supplied expected principal/public key can be forged if agent-controlled; this is intentionally NOT the production trust boundary. See docs/AGENT-GRANTS-PREAUTH-CONTRACT-2026-10-12.md and Issue #6.

## Non-executable provider request reference (2026-10-12)
src/github-pull-list-reference.mjs specifies a fixed api.github.com GET pull-list operation, exact synthetic repository resource and bounded pagination. It creates a deterministic request fingerprint and an always non-executable frozen descriptor with no credentials, network or arbitrary URL support. A matching offline signed grant reference is **not permission to execute**. See docs/GITHUB-READONLY-REQUEST-REFERENCE-2026-10-12.md. Production provider transports, identity and human consent do not exist.

## Offline policy reference
evaluateAgentRead is a pure evaluation helper. Inputs are forgeable by an AI or another caller. It MUST NOT be exposed as a security enforcement API. The real broker must independently verify signed workload identity, grants, audience, path/method/body, revocation, replay protection, host allowlists, no redirects/SSRF, consent and audit.

## Future architecture
- Adopt audited Argon2id implementation via versioned file migration and calibrated benchmarks.
- OS keychain/hardware-backed wrapping and safe recovery options.
- E2EE opt-in sync: server only ciphertext, device authorization, rollback-resistant versioning, no operator key recovery.
- Carnoa Governance for external approval/audit without sharing secret DB, auth state or tokens. Agent Workbench integration only through authenticated contracts; ModelGate never receives secrets.

Local encrypted backups are copies of the authenticated envelope. The exporter validates the passphrase and the restore path does not replace an existing Vault. See docs/BACKUP-RESTORE.md. Same-version valid snapshots can still be replayed; there is no anti-rollback device counter.

## Persistence trust hardening (2026-10-11)
- `readVaultFile` and `writeVaultFile` validate **exact** v1 envelope fields; unknown top-level, KDF or cipher keys are rejected, even if the encrypted fields are otherwise valid. This prevents accidental plaintext attachments by future callers. Envelope structure validation does not authenticate the data: AES-GCM verification on decrypt is still essential.
- Existing v1 app-generated envelopes are compatible. Any future extra metadata requires an explicit version migration and encryption/privacy review. The store is **not a generic JSON writer**.
- Directory ancestry is checked for existing symlinks (including restore source paths) before writes and reads. Callers on platforms with OS-level aliases such as macOS `/var -> /private/var` should use canonical paths. The destination private leaf folder remains mode 0700.
- **Limit:** Node's lstat / mkdir / open sequences are not atomically bound to directory descriptors. A malicious same-UID process can race or replace paths, and an unlocked endpoint remains a high-risk boundary. Native openat2/dirfd-based handling would require a separately audited adapter. Do not claim protection against local malware.

Major crypto/data format changes require separate ADR, compatibility tests and external review.

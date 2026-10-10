# Architecture / cryptographic decisions (pre-audit)

## Current data flow
Human local terminal -> hidden TTY prompt -> local AES-256-GCM encryption -> ~/.carnoa/vault.json. No network calls, cloud accounts, server-side decryption or telemetry.

A future verified local Agent Broker may mediate actions to provider APIs, with grants issued via local user consent. AI never needs to receive raw secrets.

## Vault file format
Version 1 JSON: format, version, random UUID, KDF name/parameters/salt, cipher name/nonce/tag/ciphertext. Everything inside encrypted items array (IDs, names, values, timestamps) is opaque to anyone without passphrase. Ciphertext length is visible.

Encryption key: Node crypto.scrypt master passphrase + random 32-byte salt (N=131072,r=8,p=1,maxmem=256 MiB) -> 32 bytes. AES-256-GCM, fresh random 12-byte nonce, 16-byte authentication tag, AAD containing version and vault UUID. Per-save salt and nonce are regenerated. KDF values fixed and envelope bounded to prevent attacker-supplied expensive parameters. Node Buffer is zeroed best-effort; JS strings/swap/crash dumps are not guaranteed secure.

Persistence: 0700 final directory, 0600 file, O_NOFOLLOW open, inode type and mode validation, 12 MiB file limit, random temporary file in same directory, fsync/atomic rename, single writer lock. Symlink filesystem ancestors / same-UID malware / snapshots are outside guaranteed protection. A valid whole-file rollback cannot be detected in v1.

## Offline policy reference
evaluateAgentRead is a pure evaluation helper. Inputs are forgeable by an AI or another caller. It MUST NOT be exposed as a security enforcement API. The real broker must independently verify signed workload identity, grants, audience, path/method/body, revocation, replay protection, host allowlists, no redirects/SSRF, consent and audit.

## Future architecture
- Adopt audited Argon2id implementation via versioned file migration and calibrated benchmarks.
- OS keychain/hardware-backed wrapping and safe recovery options.
- E2EE opt-in sync: server only ciphertext, device authorization, rollback-resistant versioning, no operator key recovery.
- Carnoa Governance for external approval/audit without sharing secret DB, auth state or tokens. Agent Workbench integration only through authenticated contracts; ModelGate never receives secrets.

Major crypto/data format changes require separate ADR, compatibility tests and external review.

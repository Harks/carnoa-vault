# Encrypted backup and restore (experimental, unreviewed)

## Current scope
The backup operation stores another copy of the **original encrypted Vault envelope**. Neither item names nor secret values are exported in plaintext. It remains protected by the existing master passphrase and encryption scheme. This is not cloud sync or server custody.

CLI workflow (throwaway credentials ONLY):

    node src/cli.mjs init
    node src/cli.mjs put synthetic-demo
    node src/cli.mjs backup
    node src/cli.mjs restore /path/to/encrypted/backup.json

Backup writes to a randomized filename under ~/.carnoa/backups with 0700 directory and 0600 file permissions. Restore requires an interactive passphrase and explicit RESTORE confirmation. It succeeds only if **no existing Vault file** exists in ~/.carnoa/vault.json. To restore after a loss you must first manually recover the absence of the old file; do NOT delete your real source Vault for testing. There is no in-place overwrite mode.

## Security model
1. Backup is a byte-for-byte equivalent of an authenticated Vault JSON object, not a fresh encryption under a new backup password.
2. Creating a backup requires decrypting and authenticating the source Vault locally first; a wrong password fails before output is created.
3. Restore validates file permissions, envelope schema, AES-GCM tag and master passphrase locally before publishing the destination.
4. Creating a new destination uses a hard-link-based atomic create-if-absent operation with fsync. Concurrent create-only writes cannot overwrite one another.
5. No plaintext export/print CLI is implemented. No server receives either ciphertext or keys.
6. Symlinks and group/world-readable individual backup files are rejected. Inherited ancestor directory and same-UID malware attacks are not comprehensively prevented by this prototype.

## Deliberate limitations / remaining release blockers
- **An old but valid backup can roll the vault back**; no monotonic trusted counter/version or anti-rollback binding is available yet.
- Backup is unusable without the original master passphrase. There is no escrow, reset or emergency recovery by Carnoa. Back up the passphrase independently.
- Offline theft permits password guessing; use high-entropy passphrases. scrypt parameters are pinned. Argon2id and recovery-key design await audited implementation and review.
- Malicious local users, debugger/keylogger/memory scraping, damaged disks, volume snapshots, physical theft and software updates are not fully mitigated.
- This CLI and vault have not passed an independent security assessment, disaster recovery drill, Windows/Linux cross-platform qualification, or signed distribution security review.
- Recovery instructions should not encourage deletion/overwrite of valuable credentials. **Do not use real credentials until externally audited and explicitly released.**

## Operational and QA contract
- Tests MUST cover roundtrip, no cleartext persistence, wrong passphrase, corrupted backup, destination already exists with immutable original, symlink import, locked Vault and concurrent create.
- Never add generic/plaintext exports or print decrypted values to logs, telemetry or model context.
- Add a versioned signed manifest and authenticated device/writer history only after anti-rollback ADR; file hash alone does not stop malicious rollback.
- Next stages: backup integrity UI/recovery drills, path race hardening and explicit platform-specific secure key storage.

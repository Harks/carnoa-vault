# Threat model (draft, not audited)

Assets: master passphrase, derived key, decrypted secrets, local ciphertext, future agent grants and audit evidence.

| Attack | Current control | Residual exposure |
|---|---|---|
| Server operator reads credential DB | No server exists | Future sync backend must store only ciphertext |
| Offline ciphertext theft | AES-GCM, scrypt, and limited new-Vault offline passphrase screening | Known/common-password screening is incomplete; weak passwords and valid old Vaults remain guessable offline |
| Tampering / wrong passphrase | GCM tag + AAD + strict KDF | Whole valid-vault rollback not detected |
| World-readable file / symlink | 0600 / 0700, O_NOFOLLOW, reject symlink ancestors and unsafe file modes | Path checks still have same-UID TOCTOU races; endpoint compromise can expose memory |
| Accidental plaintext serialization | Store read/write rejects all non-envelope JSON and extra unencrypted metadata keys | Malicious code inside trusted process can still steal data before encryption |
| Concurrent local writes | Exclusive lock + rename | Stale lock requires inspection |
| AI prompt injection | No agent integration or secret reveal CLI | Future broker must enforce actions outside AI |
| Malicious release / keylogger | Source inspectable | Not mitigated; no reproducible signed releases |
| Master passphrase loss | No vendor backdoor; encrypted snapshot and read-only verification | Original passphrase is still required; no recovery/key escrow |
| Snapshot rollback | Restore requires local passphrase and refuses overwrite | Legitimate older ciphertext remains authentic; anti-rollback not available |

Local example-template audit threat: refuse actual .env files and nonempty values, duplicates, symlink paths, oversized templates and malicious input; return only aggregate counts. **Current v1 still decrypts the whole Vault, including secret values, into process memory in order to read item names.** Values are not logged, emitted or transmitted by the audit; but process inspection, malware and crash dumps remain a risk. v2 should authenticate/decrypt only the necessary metadata without loading secret values (Issue #27, requires independent crypto review). This is not proof any key is valid, fresh, scoped or safe for AI. Same-UID path races and compromised hosts remain unmitigated.

Mandatory invariants: never print/transmit secret values; fail closed; no credential-exposing generic API; no high-impact operations without independent consent. All testing uses synthetic credentials.

Out of scope today: same-device malware, memory forensics, secure enclaves, OS-specific permission anomalies, browser extension injection, backups, multi-device key exchange, incident monitoring and snapshot rollback. All require review before launch.

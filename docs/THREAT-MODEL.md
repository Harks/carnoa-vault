# Threat model (draft, not audited)

Assets: master passphrase, derived key, decrypted secrets, local ciphertext, future agent grants and audit evidence.

| Attack | Current control | Residual exposure |
|---|---|---|
| Server operator reads credential DB | No server exists | Future sync backend must store only ciphertext |
| Offline ciphertext theft | AES-GCM and scrypt | Weak passwords are guessable offline |
| Tampering / wrong passphrase | GCM tag + AAD + strict KDF | Whole valid-vault rollback not detected |
| World-readable file / symlink | 0600 / 0700, O_NOFOLLOW, validation | Compromised same-UID process can access memory |
| Concurrent local writes | Exclusive lock + rename | Stale lock requires inspection |
| AI prompt injection | No agent integration or secret reveal CLI | Future broker must enforce actions outside AI |
| Malicious release / keylogger | Source inspectable | Not mitigated; no reproducible signed releases |
| Master passphrase loss | No vendor backdoor | Currently no recovery or encrypted backup |

Mandatory invariants: never print/transmit secret values; fail closed; no credential-exposing generic API; no high-impact operations without independent consent. All testing uses synthetic credentials.

Out of scope today: same-device malware, memory forensics, secure enclaves, OS-specific permission anomalies, browser extension injection, backups, multi-device key exchange, incident monitoring and snapshot rollback. All require review before launch.

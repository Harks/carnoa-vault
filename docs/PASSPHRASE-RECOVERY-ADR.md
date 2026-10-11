# ADR: Offline passphrase onboarding and recoverability (2026-10-11)

Status: **partially implemented for synthetic test Vaults; recovery NOT implemented**.

## Problem
Carnoa Vault has no server and no operator-held decryption key. A stolen encrypted file permits unrestricted offline password guesses. Loss of the master passphrase permanently prevents access in v1, including encrypted backups. Small KDF parameters or simple passwords amplify this risk.

## Onboarding policy, v0.1
- At CLI **init** only, require at least 15 Unicode code points and reject a small built-in set of obvious common strings and wholly repeated patterns. Passwords may contain spaces, arbitrary Unicode, numbers or punctuation; no character-class composition rules or periodic reset.
- Do **not** alter the passphrase during encryption. Unicode NFKC normalization is used **only for matching predictable input against the tiny local denylist**, not as the KDF input. Users must re-enter exactly the same bytes to unlock.
- Never send the passphrase or its hash to a breach-checking API, logs, telemetry, AI tools, or stdout/stderr. There is no online password-strength service.
- Local screening is incomplete: it cannot validate entropy, detect the majority of compromised secrets, or make a weak-but-long passphrase safe. Encourage high-entropy passphrases from trusted offline generators; never market the rule as a guarantee.
- **Backward compatibility:** keep v1 decrypt and legacy command access accepting the existing 14+ Unicode-character minimum. Only creation of a new Vault uses the stricter 15+ rule. Existing encryption format remains v1.

## Sources and interpretation
- [NIST SP 800-63B-4, section 3.1.1](https://pages.nist.gov/800-63-4/sp800-63b.html#passwords): 15-character minimum for centrally verified single-factor passwords, allow Unicode and passphrases, avoid composition rules, compare passwords with a blocklist.
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html): local and centralized credential practices, common-password screening, long passphrases and UX guidance.

**Qualification:** NIST's normative password-verifier rules describe *centrally verified authentication passwords*, whereas Carnoa Vault has an **offline local KDF**. We apply these rules as conservative design guidance, not as a claim of NIST conformity. Offline guessing of stolen ciphertext has a different risk profile.

## Recovery key design — future ADR, NOT released
A master-password-independent recovery secret cannot decrypt v1 ciphertext as-is. A future v2 format would require:
1. Generate a random vault data encryption key (DEK) locally with the OS CSPRNG. Encrypt items with the DEK using an audited AEAD construction.
2. Wrap the DEK separately with a memory-hard passphrase-derived key (KEK), and optionally with a high-entropy user-held recovery key.
3. Never transfer plaintext DEK/KEK/recovery secret to Carnoa servers, models or log systems. A server must not be able to reset the Vault on behalf of a user.
4. Provide offline paper or offline user-owned encrypted backup UX, backup authenticity, explicit test restore, and recovery key rotation. Design independent device enrollment, revocation and anti-rollback protection.
5. Introduce a **versioned v1→v2 migration**: authenticated v1 decrypt, locally create new v2 envelope, verify end-to-end, retain recoverable old ciphertext until confirmed, migrate only after independent crypto review.
6. Test false recovery / wrong key / partial writes / concurrent migration / lost device / compromised recovery channel / rollback and malicious software update scenarios.

No recovery-key generator, account reset, wrapped DEK, escrow, or hosted recovery is implemented today. The current local encrypted snapshots require the same v1 passphrase.

## Release gates
External threat-model review, measured KDF parameters, memory/prompt handling, OS keychain and signed distribution, independent penetration/security review, recovery drills and visible release evidence all remain **required before real credentials**. Never suggest users destroy their only ciphertext copy for testing.

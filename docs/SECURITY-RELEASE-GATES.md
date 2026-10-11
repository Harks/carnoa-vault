# Evidence-based release gates

## Experimental (current)
- [x] Local encrypted vault + strict metadata validation.
- [x] Hidden interactive TTY input, no secret-reveal CLI.
- [x] Experimental local .env.example-only metadata audit returns count-only coverage and rejects nonempty values; this does not authorize secret use.
- [x] Synthetic-only SwiftUI Mac companion source compiles on Apple Silicon/macOS 26.6.2 with 6 native unit tests; it reads no real credentials or Keychain items.
- [ ] Signed/notarized native app, Mac sandbox/entitlements, full accessibility/browser UI QA, Keychain/Touch ID implementation and independent review are pending.
- [x] File permission/symlink tests, strict envelope-only storage and ancestry tests, wrong passphrase/tag tests and default-deny policy tests.
- [ ] Independent cryptographic and source security review.
- [x] Experimental encrypted snapshot restore into absent Vault with corruption/overwrite tests.
- [x] Experimental offline minimum-length/common-pattern screen for newly created Vaults; legacy v1 unlock remains supported.
- [ ] Independently reviewed recovery/restore, offline breach-list screening, cross-platform disaster recovery and password-quality UX.
- [ ] Cross-platform hardware-backed keys and signed/reproducible native binaries. Experimental source archive provenance requires real main-run evidence.
- [x] CodeQL and Node tests passed; SPDX 2.3 SBOM uploaded and validated on GitHub main.
- [ ] Dependency Review capability still unsupported; secret scanning effectiveness/drill not validated.
- [ ] Source OIDC attestation must pass on main and be independently verified; signed native binaries are not implemented.\n- [ ] Main/develop branch protection and independent approval enforcement (Issue #21) have not been verified.
- [ ] Independent penetration test, issue-response process and security policy exercise.

## Agent broker release (NOT IMPLEMENTED)
- [ ] Verified agent principal, binding to workload and user.
- [ ] Signed, expiring, audience/operation/resource/body-bound grants; revocation and replay protections.
- [ ] Method/path allowlisted provider adapters, SSRF/redirect defenses, never give agent raw token.
- [ ] Human approvals for high-impact actions, not agent-writable.
- [ ] Redacted, tamper-evident audit and adversarial prompt injection tests.

## Beta/GA (BLOCKED)
- [ ] External audit issues remediated and report disclosed with scope.
- [ ] Incident response/SLA, update/recovery drill and safe distribution.
- [ ] Threat modeling, supplier chain, SBOM, versioned crypto upgrade, privacy & legal review.
- [ ] Trademark clearance and product support plan.

Automated CI tests alone never constitute an external audit, a product security guarantee or GA status.

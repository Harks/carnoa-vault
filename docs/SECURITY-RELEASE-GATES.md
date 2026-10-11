# Evidence-based release gates

## Experimental (current)
- [x] Local encrypted vault + strict metadata validation.
- [x] Hidden interactive TTY input, no secret-reveal CLI.
- [x] File permission/symlink tests, strict envelope-only storage and ancestry tests, wrong passphrase/tag tests and default-deny policy tests.
- [ ] Independent cryptographic and source security review.
- [x] Experimental encrypted snapshot restore into absent Vault with corruption/overwrite tests.
- [x] Experimental offline minimum-length/common-pattern screen for newly created Vaults; legacy v1 unlock remains supported.
- [ ] Independently reviewed recovery/restore, offline breach-list screening, cross-platform disaster recovery and password-quality UX.
- [ ] Cross-platform hardware-backed keys, release signing/provenance.
- [ ] Validated CodeQL/dependency review, secret scanning and a successful uploaded SPDX SBOM artifact; signed/provenance-based releases are still pending.
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

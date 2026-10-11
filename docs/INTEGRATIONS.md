# Integration architecture (proposed; none deployed)

**Carnoa Governance** in ss-workspace owns organization policy/approvals/incident authority, not this Vault. No shared credential tables, decryption keys, authorization state or billing. Future contract uses versioned signed policy snapshots and opaque audit IDs; no secrets in audit events.

**Agent Workbench / Claude Code / Codex** may request limited actions via a *separately authenticated* local broker. Prompt text, tool observations and agent-provided principal names are never proof of identity. Binding to user, action, resource, expiry and request fingerprint is required.

**ModelGate** owns model routing and verification, must not receive plaintext credentials, decryption keys or logs containing them.

**Apple Passwords** is not an unrestricted credential API: Apple AuthenticationServices supports credential exchange through participating provider extensions and user authorization, which is a future integration study rather than a live import. Apple Keychain services are distinct and may eventually hold only Carnoa-owned wrapped keys after review.

**1Password / Bitwarden / Infisical** may become optional import/source adapters after legal/license review and independent crypto review. Do not implement bulk import/export or remote credential proxy before audit.

Example *future* contract fields: contractVersion, verifiedPrincipal, resourceId, operation, requestHash, expiry, approvalEvidenceId, decision, signature. Every field must have strict schema validation and replay protection. This document is not evidence of a functioning integration.

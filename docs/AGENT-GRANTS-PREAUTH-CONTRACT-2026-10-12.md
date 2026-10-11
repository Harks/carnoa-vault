# Signed operation grant — offline preauthorization reference (2026-10-12)

Status: EXPERIMENTAL CONTRACT ONLY, *no execution, no credential access, no authenticated local agent broker*.
Tracking: B-001 / Issue #6.

## Why

Future Carnoa Agent Broker should only execute an exact action when an independently authenticated workload, explicitly consenting human, policy issuer and scoped temporary grant all agree. A cryptographic signature by itself is not authorization. The existing evaluateAgentRead function is a pure, forgeable reference evaluator.

The new agent-grant-contract.mjs module implements a narrow **offline test reference** to make canonical signed grant serialization and denial paths inspectable.

## Contract v1 (not a public protocol)

Payload fields exactly:
- version=1
- issuer: local issuer identifier (test-only)
- subject: agent identity claim string
- audience: a future verified local broker identity
- resource: one exact github:repo/owner/repository
- operation: github.pulls.list (read-only)
- issuedAt/expiresAt: safe integer epoch milliseconds, max five-minute lifetime
- nonce: opaque bounded unique reference
- requestHash: canonical base64 SHA-256 digest of a future *fully typed provider request*

The payload is serialized in one published canonical field order as a JSON array and verified with a pre-trusted Ed25519 public key. A second set of caller-provided expected fields is matched exactly. An in-memory replay set blocks the same nonce for that *one instance* only. The output is deliberately status=verified-reference and executable=false; invalid input returns only status=invalid and executable=false without logging claims.

The implementation exposes **no signer, provider adapter, Keychain interface, Apple Passwords access, credential read, cloud API, socket, agent tool or action execution**. Tests generate ephemeral synthetic signing keys at runtime and do not retain keys.

## Crucial missing trust anchors

The reference verifier CANNOT ascertain that its caller-provided expected subject is an authenticated OS process. It also cannot know whether the trustedPublicKey came from a secure provisioning step or was supplied by the AI agent. It does not provide human consent, revocation, crash-safe replay protection, a multi-device clock, final provider method/path/body enforcement, rate limiting, tenant isolation, or tamper-evident audit logs.

**Never use a successful verification as permission to invoke a provider or reveal a secret.** A real broker must keep pinned signing/issuer keys and the verified peer process identity outside all agent-controlled text, enforce a durable nonce/revocation ledger, validate exact HTTP method/path/body/host and independently authorized user approval, and audit only opaque bounded metadata. Release requires cross-process adversarial tests and external security review.

## Scope limits and next AI-friendly tasks

1. Threat-model real Swift/macOS XPC peer audit tokens, code signatures, PID reuse, local sockets and sandboxing before choosing an identity bridge.
2. Design signed grants bound to authenticated user+workload+operation+request fingerprint with durable revoke/replay state, not just a Set.
3. Add a purely synthetic and non-executable provider adapter contract test for Github pull-request list: strict approved GET, exact repository scope and no redirects, SSRF or credential disclosure.
4. Integrate with Carnoa Governance only by signed policy/approval evidence IDs and explicit tenant authorization. ModelGate/Agent Workbench must never receive secret values.
5. Obtain an independent review of contract, crypto trust anchors, process identity, human-approval UX and provider mediation before any real API credential is attached.

This is not LRP, not a production-ready authentication protocol, and not an affirmative security audit.

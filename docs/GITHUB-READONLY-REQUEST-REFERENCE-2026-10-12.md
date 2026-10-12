# GitHub read-only operation request reference

Date: 2026-10-12
Status: **EXPERIMENTAL OFFLINE REFERENCE ONLY — NOT EXECUTABLE**
Tracking: B-002, Issue #6

## Decision

Design a single *fully typed* pull-request-list request that a future authenticated Carnoa Agent Broker might allow. No HTTP client, DNS resolver, credential store, Keychain bridge, proxy, grant-issuing API or network listener is implemented here. This work never contacts GitHub and cannot expose a token.

src/github-pull-list-reference.mjs exports planSyntheticGitHubPullList with exactly three required caller fields:

- resource, in strict syntax github:repo/owner/repository (ASCII names, no wildcard or URI syntax)
- page, safe integer 1–100
- perPage, safe integer 1–100

Other fields and prototype-bearing inputs are rejected. No caller can supply host, scheme, HTTP method, headers, token, body, redirect policy, state, arbitrary pathname or query keys.

## Deterministic request binding

An accepted reference produces a frozen descriptor with:
- host: api.github.com (constant)
- method: GET (constant)
- relativePath: /repos/OWNER/REPOSITORY/pulls?state=open&per_page=N&page=P (strictly composed, no URL redirects)
- redirectPolicy: deny
- credentialPolicy: none
- body: null
- executable: false
- requestHash: base64 SHA-256 of a deterministic JSON array containing a versioned domain label, method, host, exact relative path, redirect policy, empty body and lack of credentials.

Changing the owner, repository or pagination changes the fingerprint. The hash is only a deterministic statement about a *proposed* operation, not proof of user consent or verified workload identity.

In offline synthetic tests, the fingerprint can be included in the v1 Ed25519 signed grant reference and inspected by inspectSignedGrant. A correct signature still returns executable:false. An altered page/rescope causes the grant-inspection reference to reject it.

## Threat model / explicit missing controls

1. The caller can forge resource strings and fake agent identities. This module does not establish a trusted peer, inspect code signatures, authenticate a human, prove policy authority or bind a verified macOS audit token.
2. Even when a signature matches, no provider execution may occur. A real broker must independently enforce signed/granted operation, source, audience, user presence, request body/method/host/path, nonce/replay/revocation ledger and final authorization at the time of executing a call.
3. A future network adapter must defend against DNS rebinding, redirects, SSRF, proxy environment settings, cross-tenant scopes, header injection, path normalization, credential forwarding, response exfiltration and prompt injection. Fixed strings in this module do **not** solve transport or provider security.
4. Do not add a generic request URL, HTTPS client, token parameter, network fetch, CLI reveal command, side-effecting method, GitHub Write scope, or executable:true response to this reference implementation without explicit human security architecture review.
5. No production secret or real customer repository is used in examples. Tests create only ephemeral synthetic Ed25519 keys.

## Evidence and release gate

Synthetic tests prove strict inputs, digest binding, expiry/foreign-signature failures via the existing grant verifier and no-execution property. CI must pass Node 22/24, CodeQL, SBOM. A future Mac broker must pass independent code/cryptographic review, verified workload identity, revocation and user-approval E2E, and provider transport pen test before any real request is sent.

This slice advances B-002's **contract only**. It does not unblock B-001 or complete B-002.

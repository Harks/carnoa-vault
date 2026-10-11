# Shared Node / Swift .env.example parser contract

Updated: 2026-10-12
Status: experimental, synthetic fixtures only

## Goal

Carnoa has a Node CLI and SwiftUI Mac synthetic local-secrets companion. Their template parsers must agree, or the same invalid .env.example could be accepted by one runtime and rejected by the other.

One single test fixture is owned by the Swift test-resource directory, and read unchanged from Node:

mac-companion/Tests/CarnoaCompanionCoreTests/Fixtures/env-parser-contract-v1.json

It provides case IDs, exact requested basenames, UTF-8 test data, acceptance decisions and aggregate required/matched/missing counts. No real passwords, production configuration, API tokens or private user paths belong in these fixtures.

## Explicit guarantees tested

- The only accepted file basename is .env.example; a real .env is never a supported input.
- Blank lines, comments and empty NAME= assignments are allowed. Reject any nonempty value, shell expression, duplicate variable, malformed identifier or control syntax.
- Maximum input is 65,536 bytes, at most 256 variable names; names use portable ASCII and a maximum 128-byte key length.
- A UTF-8 BOM must be rejected before decoding: Node TextDecoder and Swift Foundation may otherwise silently remove it.
- A carriage return is accepted ONLY as part of CRLF; a lone trailing carriage return is rejected.
- The report includes only synthetic required/matched/missing counts, no decrypted credentials or key names.
- These tests do not establish matching security of all I/O layers. Native file-provider retrieval, symlink ancestry rebinds and same-UID malware remain outside the security guarantee.

## Commands

Node.js 22 or later:

    node --test test/env-parity.test.mjs
    npm run verify

Mac with Swift 6 or later:

    swift test --package-path mac-companion
    swift build -c release --package-path mac-companion

## Autonomous development rule

Whenever modifying either parser, update the same JSON fixture and run both test suites. Do not create a separate copy of the fixture for each language. Any newly accepted syntax requires review of Unicode, arbitrary values, shell expansion, input limits, possible logs and data-exposure risks. Errors may describe the failure but must never echo rejected values.

Only synthetic secrets and fictional key names can appear in fixtures. These tests are not a substitute for independent security review and do not authorize real credential use, Keychain access, Apple Passwords import or AI-agent execution.

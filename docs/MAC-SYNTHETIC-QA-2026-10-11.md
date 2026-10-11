# Mac synthetic QA evidence — 2026-10-11

Status: experimental Node implementation tests, NOT Mac native application certification.

## Environment and revision

- Platform: macOS 26.6.2, Apple Silicon arm64
- Node.js: v24.15.0
- Exact source commit tested: 57ec7852832de2ab4e6c6a7516d65fe3ea9094bc
- Source acquisition: GitHub commit tarball, extracted to an isolated Mac test directory.
- Command: npm run verify

## Results

41 tests passed, 0 failed. The tests include local encryption / tampering / file permissions / backup verification / env-template-only parser, permission and symlink restrictions, no plaintext disclosure from the metadata audit, and source/security workflow baseline assertions.

## Important limits

This is synthetic-data-only automated Node test evidence. No valuable production passwords, actual API keys, Apple Passwords credentials, macOS Keychain items, or OAuth credentials were used. Neither Apple Passwords integration, Touch ID UI, application code signing/notarization, cross-process race resistance, nor user recovery workflows have been implemented or validated. A separate Mac native and independent cryptography/security review gate is required before any real credential beta.

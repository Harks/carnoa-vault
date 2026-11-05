<!-- BEGIN main-staging-contract-v1 -->
## Branch routing — owner decision 2026-11-05
Read `docs/branch-environment-policy.md`. New task branches start from latest `main` and target `main` by reviewed PR. `main` is integration/Staging, never production authorization. `develop` is drain-only history, not the target for new work. This replaces older develop-only routing in this repository, while preserving all product tests, release evidence, human production approvals and data/security boundaries. Hosting/Staging activation remains separately verified; this document alone does not enable it.
<!-- END main-staging-contract-v1 -->

# Deployment Safety

# Branch and environment policy — 2026-11-05 owner decision

## Canonical route

`feature/fix/docs/chore -> reviewed PR -> main -> isolated Staging -> explicit production release -> production`

- `main` is integration/Staging, never an instruction to publish. Ordinary task branches start from latest main and target main through a PR.
- `develop` is drain-only migration history. Do not add new work there, force-reset it, delete it, or bulk-merge outstanding changes. Port any needed outstanding work through a focused main PR.
- Main requires a PR, review, applicable product CI, bounded scope, measured validation, known gaps and rollback. Source-route checks do not replace product tests.
- Production requires the existing exact-candidate release evidence, isolated Staging verification, human approval and all existing DB/auth/billing/store gates. Do not auto-promote moving main. Pin the candidate only through the product's approved release mechanism.
- This decision supersedes older develop-only routing, not the product's other safety or verification requirements.

## Hosting migration is a separate gate

This PR DOES NOT enable automatic staging deployments or copy production credentials. The server-side repository rules, hosting branch tracking, isolated data/auth/billing/notifications, and actual Staging build must be verified independently.

Until environment isolation is verified, preserve the existing on-demand Preview path and block automatic main builds. `main` being called Staging is not proof that a Staging environment is operational. Do not connect a preview to a production database, live payment account, real-user notifications or production secrets.

For Vercel: Production Branch must be production; main is non-production. For Pages: publish from production, not main. For packages/mobile: main must not trigger public package publishing, store submission, or production OTA.

## AI and owner roles

Use harks-ai-agent[bot] to open PRs when installed. Never post owner approvals or synthesize review evidence. An App-authored PR allows the owner to review it. Installation/auth failures are blockers, not permission to impersonate a reviewer. Main/production rules have no bypass actors. Stale reviews are dismissed after new commits.

## Migration and rollback

The workflow may retain the legacy check context `require-develop-source` to avoid breaking existing required checks; its new semantics are task -> main. Do not remove or rename required checks until the replacement actually succeeds. Existing production gates and product test workflows remain unchanged.

This change contains only routing/configuration documentation and a non-deploying route check. Revert with a reviewed PR; do not weaken server-side protection or restore main-to-production auto-deployment as an automatic rollback.

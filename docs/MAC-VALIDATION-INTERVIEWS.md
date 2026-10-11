# Mac Local Secrets / Agent Access Interview Plan

Updated: 2026-10-11
Status: planned, no interviews recorded in this document.

## Sample and safety

15 solo/small-team developers split across Apple Passwords, 1Password/Bitwarden, and manual env-file users; at least five work with multiple coding agents (Claude Code, Codex, Cursor, etc.). Additionally 5 CTO/security owners for B2B integration. Synthetic example projects only; do not collect raw API keys, customer files, passwords, screenshots of secrets, identity data, or private repository contents.

## Discovery questions

1. Walk through the LAST time a new API credential was needed in two projects or dev/staging/prod. Which software, how many actions, and how long?
2. How do you know which repo requires which secret? Is there a .env.example and is it trustworthy?
3. When did an AI coding agent request access? Which exact operations, which human approval and for how long?
4. What was a real near-miss (expired token, mis-scoped key, accidental output, overprivileged access) and its cost?
5. Could Apple Passwords / 1Password / Bitwarden / Infisical already do the job? Why switch or not switch?
6. Perform a synthetic offline environment-template audit. Would you repeat it weekly? What output is actually useful?
7. What is the minimum independent audit, source signature, Mac OS integration and recovery required before trust?
8. Would you explicitly pay for team approvals, verified agent operations or managed support? Request an actual decision, not praise.

## Non-sensitive observation schema

pseudonymous interview ID, date, segment, stack categories, observed task/time, pain frequency, severity, current tool, alternative tried, activation outcome, day 7/30 follow-up, no-secrets consent, explicit payment evidence, confidence and research notes.

## Decision rules

Continue the dev wedge only after at least 8/15 report independently verified repeated pain and 5/15 complete two synthetic task trials. Treat willingness-to-pay as unvalidated until at least three potential customers take a concrete step. Pivot away from duplicative consumer password features when incumbents solve the job; use Carnoa Governance for paid B2B approvals. Never interpret survey compliments as ARR.

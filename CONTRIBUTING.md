# Contribution policy

Security-sensitive changes need negative regression tests, updated threat model and dependency/license review. Run npm run verify. Never log real secrets or commit test fixtures with sensitive credentials. See SECURITY.md for private vulnerability reporting.

All feature PRs target develop. Promotion to main is a separate develop -> main PR after checks/review. Crypto/identity/provider operations require independent technical review. CI success does not establish audit or launch readiness.

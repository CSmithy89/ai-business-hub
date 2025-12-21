# Epic PM-07 Test Validation Report

**Date:** 2025-12-21 04:55:46 UTC
**Branch:** epic/07-integrations-bridge-agent

## Test Results
- Total tests: not run (WSL disconnect when running `pnpm turbo test`)
- Passed: n/a
- Failed: n/a
- Skipped: n/a

## Type Check
- Status: FAIL
- Errors: 8 (missing deps in notifications module)

## Lint Check
- Status: PASS (warnings only)
- Errors: 0
- Warnings: 377 (pre-existing warnings across api/shared/web)

## Security Scan
- Status: SKIPPED
- Findings: 0

## Coverage (if available)
- Line coverage: n/a
- Branch coverage: n/a

## Gate Decision
**FAIL**

Blocking issues:
- Tests not run due to WSL disconnects when running `pnpm turbo test`.
- Type-check failed due to missing dependencies in notifications module:
  - `luxon`, `@nestjs/jwt`, `handlebars` imports unresolved in `apps/api/src/pm/notifications/*`.

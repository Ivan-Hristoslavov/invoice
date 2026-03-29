---
name: vitest-msw-regression
description: Writes and updates regression tests for this app using Vitest, Testing Library, and MSW. Use when adding tests for client components, multistep forms, or App Router route handlers, and when fixing regressions after refactors.
---

# Vitest MSW Regression

Use this skill for test coverage in this repository.

## Repository patterns

- Test runner: Vitest with `jsdom`
- UI assertions: Testing Library and `@testing-library/jest-dom`
- Network mocking: MSW
- Shared setup: `src/tests/setup.ts`
- Unhandled network requests fail tests, so mocks must be complete

## Instructions

1. Prefer behavior-focused tests over implementation-detail assertions.
2. Use MSW for request flows instead of ad hoc fetch stubs when the code under test performs network I/O.
3. For large form pages, cover:
   - step navigation
   - validation feedback
   - derived totals or calculated fields
   - submission success and failure states
4. For API route handlers, cover:
   - unauthenticated access
   - invalid payloads
   - success path
   - quota, conflict, or validation edge cases
5. Keep mocks close to the scenario and reset cleanly between tests.
6. Run the smallest relevant test slice first, then widen only if needed.

## Useful commands

- `npm test -- --runInBand`
- `npx vitest run path/to/test-file`
- `npm run test:coverage`

---
name: supabase-api-route
description: Builds and reviews Next.js App Router API routes backed by Supabase in this codebase. Use when editing `src/app/api/**/route.ts`, adding CRUD endpoints, validating request data, or enforcing auth and subscription checks.
---

# Supabase API Route

Use this skill for route handlers in this repository.

## Repository patterns

- Most route handlers are in `src/app/api/**/route.ts`.
- Auth commonly uses `getServerSession(authOptions)` plus `resolveSessionUser(session.user)`.
- Supabase access commonly uses `createAdminClient()`.
- Some routes also wrap handlers with `withRateLimit`, `withErrorHandling`, and `withAuthorization`.
- Tables use capitalized names such as `User`, `Company`, and `Invoice`.

## Instructions

1. Start from an existing route with similar behavior before inventing a new pattern.
2. Parse request params and bodies with Zod on the server.
3. Authenticate first, then resolve the real user record with `resolveSessionUser`.
4. Scope reads and writes by `sessionUser.id`.
5. Reuse repository middleware when the route is public-facing or high traffic.
6. For quota-bound resources such as companies or invoices, call `checkSubscriptionLimits` before insertions.
7. Return precise HTTP status codes and concise JSON error payloads.
8. Normalize numeric fields and date handling explicitly when serializing Supabase data back to the client.
9. Keep user-visible error strings aligned with the surrounding language in that part of the app.

## Verification

- Unauthenticated request returns `401`.
- Invalid payload returns `400`.
- Resource conflict or quota violation returns the intended `409` or `403`.
- Successful request only reads or mutates rows for the current user.

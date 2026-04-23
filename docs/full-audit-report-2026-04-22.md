# Full Audit Report (2026-04-22)

## Scope

- Bulgarian compliance readiness (NAP, ZDDS, PPZDDS-sensitive fields and lifecycle behavior)
- Supabase security and data scoping
- Vercel/Supabase/Stripe operational readiness via MCP
- Unit/integration coverage roadmap for near-100% confidence
- UX/a11y clarity for legally sensitive invoice details

## 1) Regulatory Matrix (BG invoicing)

| Requirement area | Current state | Evidence | Risk | Action |
|---|---|---|---|---|
| Invoice numbering consistency | Implemented with sequence and uniqueness constraints | `Invoice.invoiceNumber`, `InvoiceSequence`, `@@unique([invoiceNumber, userId])` in `prisma/schema.prisma` | Medium (concurrency/legacy numbering) | Keep sequence logic server-side; add stress test for parallel creation |
| Immutable issued invoice history | Implemented | Edit/Delete routes block non-`DRAFT` invoices in `src/app/api/invoices/[id]/route.ts` | Low | Keep rule; extend tests for all transitions |
| Mandatory fiscal context fields | Mostly implemented in storage | `placeOfIssue`, `supplyDate`, `paymentMethod`, `isEInvoice`, `napStatus`, `uniqueNapId` in schema | Medium (UI visibility gap) | Show `placeOfIssue`, `supplyDate`, `isEInvoice` in invoice details (implemented in this pass) |
| Server-side total recalculation | Implemented | `prepareDocumentItems(...)` in `src/app/api/invoices/route.ts` and route update | Low | Keep; add edge-case rounding tests |
| Credit/debit note lifecycle | Implemented with separate entities | `CreditNote`, `DebitNote` models and routes | Medium (BG legal optional fields parity) | Decide if notes also require `placeOfIssue` and `supplyDate` for your accountant/legal policy |
| NAP e-invoicing future fields | Present but not integrated | `uniqueNapId`, `napStatus` exist in `Invoice` | Medium (future integration debt) | Add explicit status workflow + UI exposure before NAP API integration |

## 2) Supabase Security and Data Governance

### Findings

- Strong pattern: route handlers usually resolve session with `getServerSession` + `resolveSessionUser`.
- Good server-only admin client split in `src/lib/supabase/server.ts`.
- Important fix applied in this pass: invoice list route had stale user source in filter bootstrap (`session.user.id`), now normalized to `sessionUser.id` in `src/app/api/invoices/route.ts`.
- Broad `createAdminClient()` usage remains high; safety depends on explicit user/company scoping in each route.

### Risk-ranked actions

1. High: add route-level regression tests for ownership scoping across all write endpoints (`invoices`, `clients`, `companies`, `notes`, `team`).
2. High: formalize one shared helper for scoped Supabase query builders to reduce copy/paste risk.
3. Medium: add DB-level constraints where business invariants are strict (for example, status transitions if needed).
4. Medium: establish periodic SQL audit script for orphaned rows and invalid references.

## 3) Cloud/MCP Audit (Supabase, Vercel, Stripe)

### What was done

- MCP tool schemas were inspected for:
  - `plugin-supabase-supabase`
  - `plugin-vercel-vercel`
  - `plugin-stripe-stripe`
- Each server currently exposes only `mcp_auth`.

### Blocker

- Authentication was requested for each MCP server, but user auth was skipped in-session.
- Result: no live cloud introspection (projects, envs, deployments, webhook endpoints, logs) was possible in this run.

### Operational checklist to execute once auth is enabled

1. Supabase: RLS policy inventory, service key usage inventory, backup/point-in-time strategy.
2. Vercel: environment variable parity (Preview/Production), build/runtime drift, failed deployment patterns.
3. Stripe: webhook endpoint health, replay handling, event delivery failures, subscription state drift checks.

## 4) Test Coverage Roadmap (toward near-100%)

## Current state

- `vitest` + `Testing Library` + `MSW` setup is present.
- Route tests already exist for key endpoints (`src/tests/routes/**`).
- Coverage is configured, but no strict global threshold gate in `vitest.config.ts`.

## Gap map (priority order)

1. Critical route transitions:
   - invoice issue/cancel/mark-paid/mark-unpaid edge cases
   - credit/debit note creation linked to issued invoices
2. Security regression:
   - unauthorized and cross-tenant access for every write route
3. Financial correctness:
   - VAT edge cases, 0% with reason, rounding and decimal handling
4. Webhook resilience:
   - idempotency and duplicate Stripe events (already partially covered)
5. UI legal visibility:
   - invoice details rendering for fiscal fields

## Recommended thresholds

- Global: statements 90+, branches 85+, functions 90+, lines 90+
- Critical folders (`src/app/api/invoices`, `src/lib/invoice-*`): target 95+

## 5) UX/Legal Clarity Improvements

Implemented in this pass:

- `InvoiceDetailClient` now explicitly shows:
  - `Дата на данъчно събитие` (`supplyDate` fallback to `issueDate`)
  - `Място на издаване` (`placeOfIssue` fallback "София")
  - `Е-фактура` (`isEInvoice`)

Pending UX/a11y refinements:

1. Add explicit legal badges/tooltip text for fiscal fields.
2. Add consistency checks for icon-only controls and keyboard navigation in detail actions.
3. Add responsive verification snapshots for 320px/375px invoice detail.

## 6) Changes Applied in This Execution

1. Fixed user scoping consistency seed in invoice listing route:
   - `src/app/api/invoices/route.ts`
2. Added legal field visibility on invoice details:
   - `src/app/(main)/invoices/[id]/InvoiceDetailClient.tsx`
3. Extended route test assertions for invoice creation defaults:
   - `src/tests/routes/invoices-route.test.ts`
   - validates `placeOfIssue`, `supplyDate`, `isEInvoice`

## 7) Final OK / Risk / Next

- OK:
  - Core Bulgarian fields are present in schema and lifecycle model.
  - Server recomputation and draft-only mutation rules are in place.
  - Stripe webhook handler includes duplicate-event safeguards.
- Risk:
  - Cloud audit remains partial without MCP auth.
  - No strict coverage quality gate enforced yet.
  - Service-role-heavy routes require ongoing scoping regression tests.
- Next:
  1. Enable MCP auth and execute live cloud verification checklist.
  2. Add hard coverage thresholds in Vitest/CI and close route-scope gaps.
  3. Add note-specific legal field policy decision (`placeOfIssue`/`supplyDate`) with accountant input.

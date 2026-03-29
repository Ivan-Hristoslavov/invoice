---
name: invoice-lifecycle
description: Handles invoice, credit note, debit note, numbering, totals, and cancellation rules in this app. Use when implementing or reviewing invoice creation, status changes, note issuance, export, or invoice-related API routes and forms.
---

# Invoice Lifecycle

Use this skill for invoice-domain work in this repository.

## Key context

- The app is an invoice product with Bulgarian-market requirements.
- Invoice data is primarily stored through Supabase tables that mirror the Prisma schema.
- Invoice creation logic and list handling live in `src/app/api/invoices/route.ts`.
- Invoices are intended to be immutable after issuance. Cancellation should be modeled through follow-up documents such as credit notes, not silent mutation of historical records.

## Instructions

1. Read the relevant invoice route, form page, and schema before editing business logic.
2. Resolve the current user through `getServerSession(authOptions)` and `resolveSessionUser(session.user)` instead of trusting raw session fields alone.
3. Scope every invoice query and mutation to the current user.
4. Recompute `subtotal`, `taxAmount`, and `total` from the submitted line items on the server. Do not trust client-calculated totals.
5. Preserve invoice numbering and sequence behavior. Treat numbering changes as high risk.
6. Keep Bulgarian invoice fields intact when present, including `bulstatNumber`, `placeOfIssue`, `paymentMethod`, `supplyDate`, `isOriginal`, and `napStatus`.
7. If a change affects cancellation, credit notes, or debit notes, verify that the history remains auditable and that previously issued documents are not implicitly rewritten.
8. Prefer small, explicit changes and call out domain assumptions when requirements are ambiguous.

## Verification

- Check happy path creation with valid items and a valid company.
- Check auth failure and user-scoping failure paths.
- Check subscription-limit behavior when invoice quotas apply.
- Check at least one edge case around taxes, rounding, or missing company data.

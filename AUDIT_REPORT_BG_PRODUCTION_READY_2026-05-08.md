# Bulgarian Invoicing Production Audit (2026-05-08)

## 1) Problem
Send flow could issue invoices without full legal validation.

### Why it matters
Invoice can be transitioned to issued-like state via email flow even when mandatory legal fields are missing.

### Legal/technical risk
Critical legal exposure under ZDDS invoice requirements; inconsistent lifecycle rules.

### Recommended fix
Use centralized issuance validation before every issued transition.

### Exact implementation
- Added shared issuance guard service: `src/lib/services/invoice-issuance.ts`.
- Integrated guard in `src/app/api/invoices/[id]/send/route.ts`.
- Reused guard in `src/app/api/invoices/[id]/status/route.ts`.

### Files to modify
- `src/lib/services/invoice-issuance.ts`
- `src/app/api/invoices/[id]/send/route.ts`
- `src/app/api/invoices/[id]/status/route.ts`

### Migration impact
None.

### Backward compatibility
Preserved API route contracts; now returns `422` with validation details for illegal issue attempts.

---

## 2) Problem
Credit note numbering used mixed strategies (sequence vs scan-based numbering).

### Why it matters
Divergent numbering logic increases collision/gap risk and complicates audit trails.

### Legal/technical risk
Critical for sequential numbering integrity and accounting auditability.

### Recommended fix
Use a single sequence engine for invoice and note numbering.

### Exact implementation
- Cancel flow now uses `getNextInvoiceSequence` and `rollbackInvoiceSequence`.

### Files to modify
- `src/app/api/invoices/[id]/cancel/route.ts`

### Migration impact
None.

### Backward compatibility
Existing numbers untouched; only future generated note numbers follow unified sequence.

---

## 3) Problem
Microinvest TXT export encoding and mode behavior was inconsistent.

### Why it matters
Single-file and range exports behaved differently and could fail in importer tools.

### Legal/technical risk
High accounting interoperability risk.

### Recommended fix
Expose explicit TXT mode and encoding controls with stable defaults.

### Exact implementation
- Added `txtMode` and `encoding` query handling:
  - `src/app/api/invoices/export-microinvest-txt/route.ts`
  - `src/app/api/invoices/export-microinvest-txt-range/route.ts`
- Added sanitization for key/value TXT values in `src/lib/invoice-export-microinvest.ts`.

### Files to modify
- `src/app/api/invoices/export-microinvest-txt/route.ts`
- `src/app/api/invoices/export-microinvest-txt-range/route.ts`
- `src/lib/invoice-export-microinvest.ts`

### Migration impact
None.

### Backward compatibility
Existing endpoints remain valid; defaults remain Microinvest-friendly.

---

## 4) Problem
Microinvest XML declaration had no explicit encoding.

### Why it matters
Some importers rely on declaration-level encoding hints for Cyrillic parsing.

### Legal/technical risk
High interoperability risk for accounting import flows.

### Recommended fix
Declare UTF-8 explicitly in XML header.

### Exact implementation
- XML declaration updated to `<?xml version="1.0" encoding="UTF-8" standalone="yes" ?>`.

### Files to modify
- `src/lib/invoice-export-microinvest.ts`

### Migration impact
None.

### Backward compatibility
Improves parser compatibility without changing schema structure.

---

## 5) Problem
No dedicated status import endpoint for paid/unpaid/overdue synchronization from accounting systems.

### Why it matters
Operational mismatch between payment status in accounting software and invoice status in app.

### Legal/technical risk
High operational/accounting reconciliation risk.

### Recommended fix
Add secure bulk status import endpoint with normalization and audit logging.

### Exact implementation
- Added `POST /api/invoices/import-status`.
- Supports `PAID|UNPAID|OVERDUE|ISSUED` (`ISSUED -> UNPAID`).
- Prevents status update on cancelled/voided invoices.
- Logs each applied update in `AuditLog`.

### Files to modify
- `src/app/api/invoices/import-status/route.ts`

### Migration impact
None.

### Backward compatibility
New additive API only.

---

## 6) Problem
Dropdown legal bases for 0% VAT were embedded locally and incomplete.

### Why it matters
Hardcoded scattered legal text is hard to keep aligned with Bulgarian law updates.

### Legal/technical risk
Medium compliance risk.

### Recommended fix
Centralize legal basis registry and reuse across forms.

### Exact implementation
- Added `src/lib/legal-basis.ts`.
- Wired invoice creation flow to use centralized reasons.

### Files to modify
- `src/lib/legal-basis.ts`
- `src/app/(main)/invoices/new/page.tsx`

### Migration impact
None.

### Backward compatibility
UI-only source-of-truth consolidation; payload shape unchanged.

---

## 7) Problem
DB-level tenant defense-in-depth and invoice immutability were not enforced sufficiently.

### Why it matters
App-layer checks alone are brittle against future regressions or direct DB operations.

### Legal/technical risk
Critical security/compliance risk (tenant leakage + issued document mutation).

### Recommended fix
Add authenticated user-scoped RLS policies and immutable invoice trigger.

### Exact implementation
- Added migration with:
  - authenticated user policies for `Invoice`, `Client`, `Company`, `InvoiceItem`
  - immutable issued/cancelled invoice trigger.

### Files to modify
- `db/migrations/0023_invoice_immutability_and_user_rls.sql`

### Migration impact
Additive, but requires rollout validation in environment with JWT claims.

### Backward compatibility
`service_role` flows remain intact; new rules add defensive layer.

---

## 8) Problem
Stored public URLs for documents/logos exposed sensitive files.

### Why it matters
Public object URLs can leak financial data and company assets.

### Legal/technical risk
High GDPR/security risk.

### Recommended fix
Store storage path and return short-lived signed URLs.

### Exact implementation
- Documents API now:
  - stores storage path in DB for new records
  - returns signed URLs in GET/POST responses
  - supports deletion for both legacy public URL and storage-path records.
- Company logo upload stores path and returns signed URL.
- Company data loader generates signed logo URL for settings UI.

### Files to modify
- `src/app/api/invoices/[id]/documents/route.ts`
- `src/app/api/companies/upload-logo/route.ts`
- `src/app/api/companies/[id]/logo/route.ts`
- `src/app/(main)/settings/company/company-data.ts`

### Migration impact
No schema change; mixed legacy/new values handled by parser fallback.

### Backward compatibility
Legacy public URL records still supported.

---

## 9) Problem
Range exports loaded invoice graphs sequentially (N+1 style slowdown).

### Why it matters
Large exports can become slow and resource-heavy.

### Legal/technical risk
Medium performance/scalability risk.

### Recommended fix
Parallelize export graph loading in range endpoints.

### Exact implementation
- Replaced sequential loops with `Promise.all` in range XML/TXT routes.

### Files to modify
- `src/app/api/invoices/export-microinvest-xml-range/route.ts`
- `src/app/api/invoices/export-microinvest-txt-range/route.ts`

### Migration impact
None.

### Backward compatibility
No API contract changes.

---

## 10) Problem
Regression coverage was missing for newly enforced paths.

### Why it matters
Critical legal/export behavior can regress silently.

### Legal/technical risk
High regression risk.

### Recommended fix
Add targeted tests for send issuance guard, XML declaration, and status import.

### Exact implementation
- Updated/added tests:
  - `src/tests/routes/invoice-send-route.test.ts`
  - `src/tests/lib/invoice-export-microinvest.test.ts`
  - `src/tests/routes/invoice-import-status-route.test.ts`

### Files to modify
- `src/tests/routes/invoice-send-route.test.ts`
- `src/tests/lib/invoice-export-microinvest.test.ts`
- `src/tests/routes/invoice-import-status-route.test.ts`

### Migration impact
None.

### Backward compatibility
Test-only changes.

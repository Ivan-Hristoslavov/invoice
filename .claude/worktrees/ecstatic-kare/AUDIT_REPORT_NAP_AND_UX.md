# Audit Report: НАП Readiness, Responsive, Forms, Buttons

**Date:** 2026-03-14  
**Scope:** One-pass audit for production readiness with focus on НАП (Българска данъчна администрация), responsive layout, windows/dialogs, forms, and buttons — so nothing important is missed.

---

## 1. НАП-related gaps (full potential for НАП)

### 1.1 Schema fields not used in UI or logic

| Field | Status | Recommendation |
|-------|--------|----------------|
| **`uniqueNapId`** | Present in `Invoice` schema; never set or displayed. | Reserve for future НАП e-invoice integration (submission ID). When integrating НАП API, set on issue/send and show in invoice detail. |
| **`napStatus`** | Present in schema; never set or displayed. | Same as above — use when syncing status with НАП (e.g. accepted, rejected, pending). |

### 1.2 Invoice detail view — missing НАП-relevant fields

- **Място на издаване (`placeOfIssue`)** and **Дата на данъчно събитие (`supplyDate`)** are stored and used in PDF export and in create/edit forms, but **are not shown** on the invoice detail page (`InvoiceDetailClient` → tab "Детайли").
- **Recommendation:** In the "Детайли на фактурата" block, add two rows: "Място на издаване" and "Дата на данъчно събитие" (with fallback e.g. issue date for supply date, "София" for place if empty). Ensures users and auditors see what was declared.

### 1.3 E-invoice flag

- **`isEInvoice`** is stored and editable in edit form; not shown on invoice detail. For НАП and clarity, consider displaying "Е-фактура: Да/Не" in the details section.

### 1.4 Credit and debit notes — НАП alignment

- **`NoteForm`** (credit/debit) does **not** collect or send **`placeOfIssue`** or **`supplyDate`**. APIs for credit/debit notes don’t persist them either. PDFs (e.g. `credit-note-pdf.ts`, `debit-note-pdf.ts`) don’t reference these fields.
- **Recommendation:** If НАП requires place and supply date on credit/debit notes, add optional (or required for BG) `placeOfIssue` and `supplyDate` to the note APIs and `NoteForm`, and to the note PDF templates. Otherwise document that notes use company default place and issue date.

### 1.5 What is in good shape for НАП

- **Invoice:** `placeOfIssue`, `supplyDate`, `paymentMethod`, `bulstatNumber` (company/client), EIK validation and CompanyBook usage, numbering and sequences, cancellation → credit note, audit log on status/cancel.
- **PDF:** Invoice PDF shows supply date, place of issue, company/client EIK; credit/debit PDFs show EIK.
- **Immutability:** Invoices not silently mutated after issue; cancellation via credit note and audit trail.

---

## 2. Responsive and layout

### 2.1 What works

- **Invoices list:** Table with horizontal scroll on small screens; card/list alternatives where implemented; `sm:`, `md:` breakpoints for actions and columns.
- **Invoice detail:** Tabs use `grid-cols-2` on small screens; items table has `overflow-x-auto` and a card layout on `md:hidden`; actions collapse into dropdown on `sm:hidden`.
- **Team (Екип):** Members: cards below `2xl`, table from `2xl`; pending invites use `md:grid-cols-2 xl:grid-cols-3` so buttons don’t overlap; company selector `w-full sm:w-[260px]`.
- **Global:** `app-page-shell`, `app-page-header`, `page-title` in `globals.css`; consistent card and spacing.

### 2.2 Minor / to verify

- **Tables in tight viewports:** Some tables (e.g. clients, companies, products) rely on `overflow-x-auto` or similar; ensure minimum column widths don’t make content unreadable on very narrow windows (e.g. 320px). Consider hiding less critical columns on small screens or card layout like team/invoice items.
- **Long text:** Truncation used (e.g. `truncate` on names); ensure tooltips or expand-on-click where needed so ЕИК/names aren’t lost.

---

## 3. Windows, dialogs, modals

### 3.1 Current usage

- **Export dialog:** `ExportDialog` / `ExportDialogWrapper` — open/close and options.
- **Invoice modals:** Status change, cancel, delete, void — all present and used.
- **Team:** User role change and remove-member dialogs in `UserRoleActions` (mounted when open to avoid duplicate HeroUI components).
- **Profile/Security:** GDPR delete account uses `AlertDialog` with controlled open state.

### 3.2 Recommendations

- **Focus trap and escape:** Ensure all dialogs close on Escape and trap focus inside; Radix/AlertDialog usually handle this — just confirm no custom modal blocks it.
- **Small viewports:** Confirm Export and Status/Cancel modals don’t overflow on short viewports (e.g. max-height + scroll on content).

---

## 4. Forms

### 4.1 Validation and required fields

- **Company:** `bulstatNumber` required; CompanyBook lookup; duplicate EIK check.
- **Client:** `bulstatNumber` optional; EIK validation and CompanyBook when provided; Bulgarian party validation in `bulgarian-party.ts`.
- **Invoice (new/edit):** `placeOfIssue` default "София"; `supplyDate` default issue date; items and totals validated on server; server recomputes totals (good for НАП and integrity).
- **Credit/Debit notes:** Company, client, reason, items validated; no place/supply date.

### 4.2 Gaps

- **Invoice create:** No explicit client-side validation that `placeOfIssue` is non-empty before submit (server/defaults cover it). For strict НАП readiness, consider required validation and Bulgarian error message.
- **Note forms:** If НАП will require place/supply date on notes, add fields and validation; otherwise no blocking form gap.

---

## 5. Buttons

### 5.1 Consistency

- Primary actions (Create, Save, Submit) use primary button; destructive (Cancel invoice, Delete) use destructive variant; secondary actions use outline/ghost.
- PRO-gated actions (e.g. Send invoice) use `LockedButton` / tooltip with upgrade CTA when over limit.

### 5.2 States and a11y

- Loading: Buttons show loading state (e.g. "Изпращане...", "Отмяна...") and are disabled where appropriate.
- **Recommendation:** Ensure every icon-only or ambiguous button has `aria-label` (e.g. "Назад", "Дублирай", "Изтегли PDF"). Spot-check: back, duplicate, export, role dropdown trigger — some already have title/label; complete for all icon-only actions.

---

## 6. Logic and production readiness (summary)

| Area | Status | Notes |
|------|--------|------|
| **Auth & session** | OK | `resolveSessionUser`, scoping by `userId` / accessible companies. |
| **Team & invites** | OK | Create, resend, revoke, accept; magic link; invite creation succeeds even if email fails. |
| **Subscription & limits** | OK | Usage and middleware; latest active subscription by `createdAt`; seat limits for team. |
| **Invoice lifecycle** | OK | Draft → Issued → Paid/Overdue; cancellation → credit note; audit log. |
| **НАП fields in DB** | OK | Stored and used in PDF and create/edit; detail view and e-invoice/NAP IDs need UI. |
| **Credit/Debit notes** | Partial | No place/supply date in form or API; add if НАП requires. |

---

## 7. Prioritized action list (so НАП doesn’t miss anything important)

1. **High (НАП clarity):**  
   - Show **Място на издаване** and **Дата на данъчно събитие** (and optionally **Е-фактура**) on invoice detail "Детайли" tab.

2. **Medium (future НАП integration):**  
   - When integrating with НАП e-invoice API: set and display **`uniqueNapId`** and **`napStatus`** on invoice (and in detail view).

3. **Medium (notes compliance):**  
   - If НАП requires place of issue and supply date on credit/debit notes: add to `NoteForm`, credit/debit APIs, and PDFs.

4. **Low (polish):**  
   - Add `aria-label` to any remaining icon-only buttons.  
   - Optional: require non-empty `placeOfIssue` in invoice create validation with Bulgarian message.

5. **Verify once:**  
   - All critical modals (export, status, cancel, delete) on small viewport height; tables on 320px width.

---

**Conclusion:** Core НАП-relevant data (place of issue, supply date, EIK, numbering, cancellation, audit) is stored and used in PDFs and create/edit. The main gaps are: **showing** place of issue and supply date (and optionally e-invoice) on the invoice detail page, and **reserving** `uniqueNapId`/`napStatus` for future НАП integration. Credit/debit notes are fine as-is unless НАП explicitly requires place/supply date on them. Responsive and button behavior are in good shape with minor a11y and viewport checks recommended.

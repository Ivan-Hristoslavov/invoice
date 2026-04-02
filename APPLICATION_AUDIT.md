# Application Audit Report - InvoicyPro

## Overview

InvoicyPro is a Bulgarian invoice management web application built with Next.js 15 (App Router), Supabase (PostgreSQL), and Stripe for subscriptions. It targets Bulgarian businesses and provides invoice issuance with Bulgarian tax field support, credit/debit notes, client/company management, and PDF generation.

**Tech Stack:** Next.js 15, React, TypeScript, Tailwind CSS, shadcn/ui + HeroUI, Supabase, Stripe, NextAuth, Framer Motion, jsPDF, Nodemailer, Zod

**Current Readiness:** ~88% ready for production

**Important:** This product is NOT an officially approved СУПТО (software for sales management) under Наредба H-18. It provides field-level and format-level support for Bulgarian invoicing requirements but does not guarantee full regulatory compliance. Users bear responsibility for their own tax reporting to НАП.

---

## 1. CRITICAL ISSUES (Must Fix Before Launch)

### 1.1 Password Reset — IMPLEMENTED

**Status (updated):** Password reset is implemented. Forgot-password API generates a token, stores it in `PasswordResetToken`, sends email via `sendPasswordResetEmail`. Reset-password page (`/reset-password?token=xxx`) and API validate the token and update the password. Rate limiting is applied.

### 1.2 Authorization Middleware Bug — FIXED

**Status (updated):** Fixed — `allowSameUser` logic corrected.

### 1.3 NAP Credential Columns — REMOVED

**Status (updated):** `napUserName` and `napPassword` columns dropped from Company table via migration `0015_drop_nap_credentials.sql`. These were never populated via UI or API and storing portal credentials was a security risk. Prisma schema updated accordingly.

### 1.4 Rate Limiting on Auth Endpoints — IMPLEMENTED

**Status (updated):** In-memory rate limiter (`src/lib/rate-limit.ts`) applied to registration, forgot-password, and reset-password endpoints.

### 1.5 Database Migrations — APPLIED

**Status (updated):** All migrations applied. Column `mol` renamed from Cyrillic. 15 migration files in `db/migrations/`.

---

## 2. HIGH PRIORITY IMPROVEMENTS

### 2.1 Invoice List - Missing Pagination and Filtering

**Current State:** The invoice list loads all invoices at once with basic search and status filter only.

**Needed:**
- Server-side pagination (already supported in API but not used in UI)
- Date range filter (from/to)
- Client filter dropdown
- Company filter dropdown
- Amount range filter
- Sort by date, amount, client, status
- Bulk actions (export, delete drafts)

### 2.2 Dashboard Analytics — MOSTLY IMPLEMENTED

**Status (updated):** Dashboard now includes real trend calculations (current vs previous month), 6-month revenue bar chart, overdue invoices alert card, recent credit/debit notes with linked invoice numbers, activity timeline from audit logs, and quick actions. Remaining: date range selector, company filter, top clients by revenue.

### 2.3 Credit/Debit Notes - Missing GET API Endpoints

**Current State:** Credit and debit notes only have POST (create) and PDF export endpoints. List pages query Supabase directly from server components.

**Needed:**
- `GET /api/credit-notes` with pagination, filtering, search
- `GET /api/debit-notes` with pagination, filtering, search
- Consistent API design with invoice endpoints

### 2.4 Multi-Currency Support — PARTIALLY IMPLEMENTED

**Status (updated):** EUR, BGN, and USD are now available in invoice creation/editing. Currency formatting works per currency. Remaining: GBP, exchange rate display.

### 2.5 Recurring Invoices

**Current State:** Not implemented at all.

**Needed:**
- Recurring invoice template
- Frequency options (weekly, monthly, quarterly, yearly)
- Auto-generation on schedule
- Email notification before generation
- Pause/resume capability

### 2.6 Invoice Templates / Duplicate

**Current State:** No way to clone an existing invoice or save templates.

**Needed:**
- "Duplicate" button on invoice detail page
- Template system (save invoice as template, create from template)
- Quick re-invoice for same client

---

## 3. DESIGN AND UX IMPROVEMENTS

### 3.1 Mixed Component Libraries

**Problem:** The app uses both shadcn/ui and Radix UI Themes simultaneously. Button is from Radix Themes but Card, Input, Select are from shadcn. This creates visual inconsistency.

**Recommendation:** Consolidate on shadcn/ui and remove Radix UI Themes dependency.

### 3.2 Glass Morphism Performance

**Problem:** Heavy use of `backdrop-filter: blur(20px) saturate(180%)` on cards, sidebar, header, and modals. This causes performance issues on lower-end devices and older browsers.

**Recommendation:**
- Reduce blur radius to 12px on mobile
- Add `will-change: backdrop-filter` for GPU acceleration
- Consider a simpler semi-transparent background fallback
- Add `@supports` check for backdrop-filter

### 3.3 Landing Page

**Improvements needed:**
- Replace hardcoded stats ("1000+ бизнеси", "50K+ фактури") with real or dynamic data
- Add actual product screenshots/demo
- Add video walkthrough
- Improve CTA button visibility
- Add customer logos/trust indicators
- Blog section is empty placeholder - either fill or remove

### 3.4 Mobile Navigation

**Current State:** Sidebar collapses but keyboard shortcuts button was hidden, not all touch targets are properly sized.

**Needed:**
- Bottom navigation bar for mobile (common pattern for business apps)
- Swipe gestures for sidebar
- Larger touch targets (min 44x44px)
- Pull-to-refresh on list pages

### 3.5 Empty States

**Current State:** Some empty states exist but are inconsistent.

**Needed:**
- Consistent empty state design across all list pages
- Helpful onboarding prompts (e.g., "Create your first company to get started")
- Step-by-step first-use wizard

### 3.6 Loading States

**Current State:** Mix of spinners, skeletons, and bare loading text.

**Needed:**
- Consistent skeleton loading for all pages
- Optimistic UI updates for common actions
- Progress indicators for multi-step operations

### 3.7 Color Coding Inconsistency

**Problem:** Status colors are hardcoded throughout the codebase instead of using semantic tokens.

**Recommendation:** Create a status color map utility:
- DRAFT: amber/yellow
- ISSUED: emerald/green
- CANCELLED: red
- VOIDED: purple/gray

---

## 4. BUSINESS LOGIC IMPROVEMENTS

### 4.1 Invoice Numbering — PARTIALLY IMPLEMENTED

**Status (updated):** `InvoiceSequence` table provides per-company, per-year sequential numbering. `src/lib/bulgarian-invoice.ts` generates the 12-digit core `YYCCCCNNNNNN` using last 4 digits of EIK. Optional `invoicePrefix` from user `invoicePreferences` (see invoice-preferences API) is applied in `src/lib/invoice-sequence.ts` for issued numbers and next-number preview. Remaining: gap detection/reporting robustness for mixed legacy numbers, formal numbering audit trail.

### 4.2 VAT Handling — MOSTLY IMPLEMENTED

**Status (updated):** Per-item VAT rates, `reverseCharge` flag on Invoice, `vatExemptReason` on InvoiceItem (migration `0014`). Validation requires reason when tax rate is 0%. Remaining: VAT summary section in PDF (grouped by rate), intra-community supply handling.

### 4.3 Client Management — CSV IMPORT ADDED

**Status (updated):** CSV import for clients implemented (`src/lib/clients-import.ts`, `POST /api/clients/import`, import UI). Duplicate detection by EIK on creation. Remaining: categories/tags, notes per client, contact history, balance/statement, merge.

### 4.4 Product Management — CSV IMPORT + ACTIVE/INACTIVE ADDED

**Status (updated):** CSV import for products implemented (`src/lib/products-import.ts`, `POST /api/products/import`, import UI). `isActive` field added (migration `0013`). Remaining: categories, SKU field, predefined unit list, price history.

### 4.5 Reports and Analytics

**Current State:** No reporting module exists.

**Needed:**
- Monthly/quarterly/annual revenue report
- VAT report (for tax filing)
- Client aging report (outstanding amounts)
- Invoice status report
- Export to CSV/Excel/PDF
- Tax period summary (for accountant handoff)
- Profit & loss overview (if expenses are tracked in future)

### 4.6 Document Attachments

**Current State:** Document model exists in schema but no upload UI for credit/debit notes.

**Needed:**
- File upload for invoices, credit notes, debit notes
- Supported formats: PDF, images, documents
- File size limits per subscription tier
- Document preview

### 4.7 Proforma Invoices

**Current State:** Not implemented.

**Needed:**
- Separate proforma invoice type
- Convert proforma to final invoice
- Different numbering sequence
- Different PDF template

---

## 5. TECHNICAL DEBT

### 5.1 Prisma vs Supabase Client Inconsistency

**Problem:** The codebase has both Prisma schema and Supabase client calls. Some files import from `@prisma/client` while most use Supabase directly.

**Files affected:**
- `src/lib/db.ts` - may still reference Prisma
- `src/lib/db-utils.ts` - has Supabase-based utility but filename implies Prisma era
- `prisma/schema.prisma` - kept for reference but Supabase is the actual DB client

**Recommendation:** Clean up Prisma references, keep schema only for documentation.

### 5.2 Debug Logging in Production Code

**Files with debug logging to remove:**
- `src/app/(main)/credit-notes/[id]/page.tsx` (lines 108-114)
- `src/app/(main)/debit-notes/[id]/page.tsx` (lines 108-114)
- Various `console.log` statements throughout API routes

### 5.3 Duplicate Code in Credit/Debit Note Forms — RESOLVED

**Status (updated):** Shared `NoteForm` component extracted to `src/components/notes/NoteForm.tsx` (~470 lines), eliminating ~1,400 lines of duplicated code.

### 5.4 PDF Generator Duplication

**Problem:** Three separate PDF generators (`pdf-generator.ts`, `credit-note-pdf.ts`, `debit-note-pdf.ts`) with significant code duplication.

**Recommendation:** Create a shared PDF base class/utility with document-type-specific overrides.

### 5.5 Error Handling Inconsistency

**Problem:** Some API routes use try/catch with detailed error responses, others have minimal handling. Some routes have syntax issues (missing braces, duplicate checks).

**File with issues:** `src/app/api/invoices/[id]/send/route.ts` has duplicate null checks and a syntax issue at line 60.

### 5.6 TypeScript Type Safety

**Problem:** Extensive use of `any` type throughout the codebase, especially in:
- API route handlers
- Component props
- Database query results
- Event handlers

**Recommendation:** Define proper interfaces for all database entities and API responses.

---

## 6. SUBSCRIPTION AND MONETIZATION

### 6.1 Current Pricing Issues

- FREE tier allows email sending - should be restricted
- Storage limits are not enforced
- User count limits are not enforced in team management
- No trial period for paid plans

### 6.2 Recommendations

- Add 14-day free trial for PRO plan
- Restrict email sending to paid plans
- Implement storage quota tracking
- Add usage analytics for users (show them their usage vs limits)
- Add upgrade prompts when approaching limits (not just when exceeded)
- Consider BGN pricing for Bulgarian market

---

## 7. SEO AND MARKETING

### 7.1 Current State

- Basic meta tags exist
- Sitemap and robots.txt configured
- Public pages (about, features, pricing) exist

### 7.2 Improvements

- Blog is empty - needs content for SEO
- No structured data (JSON-LD) for rich snippets
- No FAQ schema markup
- No Open Graph images for social sharing
- Missing canonical URLs
- No analytics integration visible (Google Analytics, Plausible, etc.)

---

## 8. ACCESSIBILITY

### 8.1 Issues Found

- Some interactive elements lack ARIA labels
- Focus indicators not consistently visible
- Color contrast may be insufficient in glass morphism overlays
- No skip-to-content link
- Screen reader support untested
- Keyboard navigation incomplete in some modals

### 8.2 Recommendations

- Add ARIA labels to all icon-only buttons
- Ensure 4.5:1 contrast ratio for all text
- Add focus-visible styles consistently
- Test with screen readers (NVDA, VoiceOver)
- Add skip-to-content link in layout

---

## 9. INFRASTRUCTURE AND DEPLOYMENT

### 9.1 Missing

- No CI/CD pipeline configuration
- No automated testing (only test setup exists, minimal tests)
- No database backup strategy documented
- No monitoring/alerting setup
- No error tracking (Sentry, etc.)
- No performance monitoring (Web Vitals tracking)
- No staging environment setup

### 9.2 Recommendations

- Add GitHub Actions for CI (lint, type-check, test, build)
- Set up Sentry for error tracking
- Add Vercel Analytics or Plausible for usage analytics
- Document deployment process
- Create `.env.example` with all required variables documented
- Add health check endpoint

---

## 10. PRIORITY ROADMAP

### Phase 1 - Launch Ready (1-2 weeks)
1. Implement password reset functionality
2. Apply database migrations (mol rename)
3. Fix authorization middleware bug
4. Add rate limiting on auth endpoints
5. Remove debug logging
6. Fix invoice send route syntax issues
7. Enforce subscription limits (storage, users)
8. Add BGN currency option

### Phase 2 - Core Improvements (2-4 weeks)
1. Dashboard analytics with real trends and charts
2. Invoice list pagination and advanced filters
3. Invoice duplicate/clone functionality
4. Client and product import (CSV)
5. Reports module (revenue, VAT, aging)
6. Email template customization
7. Consolidate UI component library

### Phase 3 - Growth Features (1-2 months)
1. Recurring invoices
2. Proforma invoices
3. Multi-language PDF support
4. Document attachments
5. Client portal (view/download invoices)
6. API for external integrations
7. Mobile app or PWA optimization

### Phase 4 - Scale (2-3 months)
1. NAP direct integration
2. Automated accounting export
3. Multi-currency with exchange rates
4. Advanced permissions and team features
5. White-label capability
6. Zapier/webhook integrations

---

## Summary Scorecard

| Area | Score | Notes |
|------|-------|-------|
| Core Features | 8/10 | Invoice lifecycle, PDF, email working |
| Security | 7/10 | Password reset, rate limiting, BULSTAT uniqueness, NAP credentials removed |
| Design/UX | 7/10 | Modern look but inconsistent components, needs mobile polish |
| Data Layer | 7/10 | Good schema but mixed Prisma/Supabase approach |
| Business Logic | 7.5/10 | Bulgarian tax format support, reverse charge, VAT exempt, CSV imports; missing recurring/proforma/reports |
| Performance | 6/10 | Glass morphism heavy, no pagination on lists |
| Testing | 2/10 | Minimal test coverage |
| Documentation | 4/10 | Internal docs exist but no user guide or API docs |
| Monetization | 6/10 | Stripe integration works, limits partially enforced |
| Deployment Ready | 5/10 | No CI/CD, no monitoring, no error tracking |

**Overall: 7.2/10** - Functional application with solid core features, security improvements applied, Bulgarian tax format support with reverse charge/VAT exempt. Remaining gaps: recurring invoices, proforma, reports, CI/CD, full test coverage.

---

## FIXES APPLIED (Session: February 2026)

All issues below have been resolved:

### CRITICAL Fixes
1. **Password Reset** - Full implementation: token generation, email sending, reset page (`/reset-password?token=xxx`), validation, expiration. New files: `ResetPasswordForm.tsx`, `reset-password/page.tsx`, `reset-password/route.ts`, migration SQL, Prisma schema update.
2. **Authorization Middleware Bug** - Fixed the `allowSameUser` logic that was checking the same condition twice.
3. **Rate Limiting** - Created `src/lib/rate-limit.ts` with in-memory rate limiter. Applied to `/api/auth/register` (5 req/5min), `/api/auth/forgot-password` (3 req/5min), `/api/auth/reset-password` (5 req/5min).
4. **Debug Logging Removed** - Cleaned up `console.error`/`console.warn` from credit-notes and debit-notes detail pages.
5. **Invoice Send Route** - Removed duplicate null checks and removed the test `POST_TEST` function.

### HIGH Priority Fixes
6. **BGN Currency Support** - Added BGN (Лев) and USD (Долар) to invoice creation, editing, and preferences. Currency constants added to `src/config/constants.ts`.
7. **Shared NoteForm Component** - Extracted `src/components/notes/NoteForm.tsx` (~470 lines), eliminating ~1,400 lines of duplicated code between credit/debit note forms.
8. **Invoice Duplicate/Clone** - New API endpoint `POST /api/invoices/[id]/duplicate`. "Дублирай" button added to both invoice detail and invoice list pages.
9. **Dashboard Improvements** - Real trend calculations (current vs previous month), credit/debit note counts, quick action links for notes, activity timeline from audit logs with Bulgarian labels.
10. **Invoice List Pagination & Sorting** - Client-side pagination (15 per page), sort by date/amount/number (asc/desc), page controls, auto-reset on filter change.

### MEDIUM Priority Fixes
11. **TypeScript Types** - Replaced `any` types in dashboard page with proper interfaces (`InvoiceRow`, `ClientRow`, inline types for audit logs).
12. **Empty State Component** - Created reusable `EmptyState` component in `src/components/ui/empty-state.tsx`.
13. **Accessibility** - ARIA labels on Sidebar, Navbar, Dialog. Skip-to-content link. `role` attributes. Focus improvements in CSS.
14. **Status Color Map** - Added `INVOICE_STATUS` constant and `getCurrencySymbol` helper to constants.
15. **Health Check & .env.example** - `GET /api/health` endpoint (checks DB, SMTP, Stripe config). `.env.example` with all required variables documented.

### Abuse prevention (BULSTAT uniqueness)
- **One company per ЕИК/БУЛСТАТ** – A given BULSTAT can be registered only once on the platform. This stops users from creating multiple accounts with the same company and bypassing subscription limits.
- **Implementation:**  
  - `supabase-migration-company-bulstat-unique.sql` – unique partial index on `Company(bulstatNumber)` (only when non-empty).  
  - `POST /api/companies` – before insert, checks if another company (any user) already has this BULSTAT; returns 409 with message in Bulgarian if duplicate.  
  - `PUT /api/companies/[id]` – new route for updating a company; same BULSTAT check (excluding current company).  
- **Advice:** Keep email as the main account identifier (already non-editable in profile). Optionally add: rate limit on company creation per user, or require email verification before allowing company add. The BULSTAT rule is the main protection against one company being used across many accounts.

### New Files Created
- `src/lib/rate-limit.ts` - In-memory rate limiter
- `src/app/api/health/route.ts` - Health check endpoint
- `src/app/api/auth/reset-password/route.ts` - Password reset API
- `src/app/(auth)/reset-password/page.tsx` - Reset password page
- `src/components/auth/ResetPasswordForm.tsx` - Reset password form
- `src/app/api/invoices/[id]/duplicate/route.ts` - Invoice duplication API
- `src/components/notes/NoteForm.tsx` - Shared note form component
- `supabase-migration-password-reset-token.sql` - DB migration
- `supabase-migration-company-bulstat-unique.sql` - Unique BULSTAT per company
- `src/app/api/companies/[id]/route.ts` - GET/PUT company (with BULSTAT uniqueness)
- `.env.example` - Environment variables template

### Updated Score: ~7.5/10

---

## FIXES APPLIED (Session: March 2026)

### Security
1. **NAP Credentials Removed** — `napUserName`/`napPassword` columns dropped from Company table (migration `0015`). These were dead columns with no UI or API write path — security risk eliminated.

### Legal/Marketing
2. **Marketing Copy Softened** — Replaced "пълна НАП съвместимост" with "поддръжка на български данъчни формати" across README, features page, SEO keywords, auth layout, subscription plans.
3. **Terms Disclaimer** — Added section 7 "Данъчно съответствие" to Terms of Service clarifying the product is not a substitute for accounting/legal advice and does not guarantee full regulatory compliance.
4. **Tax Compliance Page** — Removed specific monetary thresholds (5000 EUR, fines 250-5000 EUR) that may be outdated; replaced with references to current НАП guidance and accountant consultation.

### Document Snapshots
5. **Immutable Snapshots** — `document-snapshots.ts` creates seller/buyer/items snapshots at issue time, ensuring historical accuracy even if live data changes.

### Dashboard
6. **Revenue Chart** — 6-month bar chart with Bulgarian month labels.
7. **Overdue Invoices** — Alert card with top overdue items and totals.
8. **Recent Notes** — Credit/debit notes card with linked invoice numbers.

### Imports
9. **Client CSV Import** — `src/lib/clients-import.ts`, `POST /api/clients/import/route.ts`, import UI with preview, validation, subscription limits, duplicate detection by EIK.
10. **Product CSV Import** — `src/lib/products-import.ts`, `POST /api/products/import/route.ts`, import UI with same pattern.

### PDF
11. **Modern PDF Layout** — Rewritten `pdf-generator.ts` with neutral palette, structured header, party cards, column-width table, and `Генерирано с InvoicyPro` footer.

### APPLICATION_AUDIT.md
12. **Audit Refresh** — Updated statuses for all items that have been implemented since the original audit.

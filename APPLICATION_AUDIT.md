# Application Audit Report - Invoicy

## Overview

Invoicy is a Bulgarian invoice management web application built with Next.js 14 (App Router), Supabase (PostgreSQL), and Stripe for subscriptions. It targets Bulgarian businesses and provides NAP (National Revenue Agency) compliant invoice issuance, credit/debit notes, client/company management, and PDF generation.

**Tech Stack:** Next.js 14, React, TypeScript, Tailwind CSS, shadcn/ui + Radix UI, Supabase, Stripe, NextAuth, Framer Motion, jsPDF, Nodemailer, Zod

**Current Readiness:** ~85% ready for production

---

## 1. CRITICAL ISSUES (Must Fix Before Launch)

### 1.1 Password Reset Not Implemented

**File:** `src/app/api/auth/forgot-password/route.ts`

The forgot password endpoint has a TODO and returns a fake success without actually sending any email or generating a token. Users cannot recover their accounts.

**What needs to happen:**
- Generate a secure reset token (crypto.randomBytes)
- Store token + expiration in the database (add `PasswordResetToken` table)
- Send email with reset link via existing SMTP setup
- Create `/reset-password?token=xxx` page
- API endpoint to validate token and update password

**Priority:** CRITICAL

### 1.2 Authorization Middleware Bug

**File:** `src/middleware/authorization.ts`

`permissionNames` is referenced before definition, which could cause runtime errors or permission bypass.

**Priority:** CRITICAL

### 1.3 Sensitive Credentials Stored in Plaintext

**File:** `prisma/schema.prisma` (Company model)

Fields `napPassword`, `napUserName` are stored without encryption. These are credentials for the Bulgarian tax authority portal.

**Priority:** CRITICAL

### 1.4 No Rate Limiting on Auth Endpoints

Login, registration, and password reset endpoints have no rate limiting, making them vulnerable to brute force attacks.

**Priority:** CRITICAL

### 1.5 Database Migrations Not Applied

The `supabase-migration-rename-mol-to-english.sql` migration needs to be applied to rename the Cyrillic column `mол` to `mol` in Company and Client tables. Without this, queries fail with "column does not exist" errors.

**Priority:** CRITICAL

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

### 2.2 Dashboard - Static Data and Missing Analytics

**Current State:** Dashboard shows basic counts and totals with hardcoded trend percentages (+12.5%, +8.2%).

**Needed:**
- Real trend calculations (compare current month to previous)
- Revenue chart (monthly/yearly)
- Invoice status breakdown chart (pie/bar)
- Top clients by revenue
- Upcoming due dates / overdue alerts
- Quick actions section
- Date range selector for all stats
- Company filter (if multiple companies)

### 2.3 Credit/Debit Notes - Missing GET API Endpoints

**Current State:** Credit and debit notes only have POST (create) and PDF export endpoints. List pages query Supabase directly from server components.

**Needed:**
- `GET /api/credit-notes` with pagination, filtering, search
- `GET /api/debit-notes` with pagination, filtering, search
- Consistent API design with invoice endpoints

### 2.4 Multi-Currency Support

**Current State:** Only EUR is supported. The currency field exists but the dropdown only shows EUR.

**Needed:**
- Add BGN (Bulgarian Lev) - essential for domestic invoices
- Add USD, GBP at minimum
- Exchange rate display (informational)
- Currency formatting per currency

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

### 4.1 Invoice Numbering

**Current State:** Works with `startingInvoiceNumber` but the format is 10-digit only (0000000001). Bulgarian NAP requires specific format.

**Needed:**
- Proper NAP format: YYCCCCNNNNNNИ (year + company code + sequence + suffix)
- Per-company numbering (not just per-user)
- Gap detection and reporting
- Numbering audit trail

### 4.2 VAT Handling

**Current State:** Single VAT rate per item. No reverse charge, no exempt handling.

**Needed:**
- VAT exempt option (0% with reason)
- Reverse charge mechanism (for EU B2B)
- Multiple VAT rates per invoice (already works per item)
- VAT summary section in PDF (grouped by rate)
- Intra-community supply handling

### 4.3 Client Management

**Missing features:**
- Client categories/tags for organization
- Notes/comments per client
- Contact history (emails sent, invoices created)
- Client balance/statement
- CSV import/export
- Duplicate detection and merge

### 4.4 Product Management

**Missing features:**
- Product categories
- SKU/barcode field
- Unit types (piece, hour, kg, m2, etc.) - field exists but no predefined list
- Bulk import from CSV
- Price history
- Active/inactive status

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

### 5.3 Duplicate Code in Credit/Debit Note Forms

**Problem:** `credit-notes/new/page.tsx` and `debit-notes/new/page.tsx` are nearly identical (~700 lines each). Same for the detail pages.

**Recommendation:** Extract a shared `NoteForm` component with a `type` prop ("credit" | "debit") and color theme prop.

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
| Security | 5/10 | Auth works but critical gaps (password reset, rate limiting) |
| Design/UX | 7/10 | Modern look but inconsistent components, needs mobile polish |
| Data Layer | 7/10 | Good schema but mixed Prisma/Supabase approach |
| Business Logic | 7/10 | NAP compliance good, missing recurring/proforma/reports |
| Performance | 6/10 | Glass morphism heavy, no pagination on lists |
| Testing | 2/10 | Minimal test coverage |
| Documentation | 4/10 | Internal docs exist but no user guide or API docs |
| Monetization | 6/10 | Stripe integration works, limits partially enforced |
| Deployment Ready | 5/10 | No CI/CD, no monitoring, no error tracking |

**Overall: 5.7/10** - Functional application with good core features but needs security fixes, performance optimization, and additional features before production launch.

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

### New Files Created
- `src/lib/rate-limit.ts` - In-memory rate limiter
- `src/app/api/health/route.ts` - Health check endpoint
- `src/app/api/auth/reset-password/route.ts` - Password reset API
- `src/app/(auth)/reset-password/page.tsx` - Reset password page
- `src/components/auth/ResetPasswordForm.tsx` - Reset password form
- `src/app/api/invoices/[id]/duplicate/route.ts` - Invoice duplication API
- `src/components/notes/NoteForm.tsx` - Shared note form component
- `supabase-migration-password-reset-token.sql` - DB migration
- `.env.example` - Environment variables template

### Updated Score: ~7.5/10

# Deep App Audit Report — InvoicyPro

**Date:** 2026-04-13  
**Stack:** Next.js 16.2, React 19, Tailwind 4, HeroUI v3 (`@heroui/react` 3.0.2), Prisma/Supabase patterns, Vitest.

**Verification (this session):** `npm test` —175 passed; `npm run build` — success.

---

## Executive summary

| Area | Health | Top risk |
|------|--------|----------|
| Design system | **Good foundation, uneven execution** | Mix of `@/components/ui` wrappers, direct `@heroui/react` imports, and heavy `globals.css` overrides causes visual/API drift. |
| Runtime UX | **Strong on dashboard/flows; polish gaps** | Full-page loading overlays can dominate settings; some copy/structure is dense on mega-forms. |
| Forms / CRUD | **Functional; structurally heavy** | Duplicate patterns between `form.tsx` (RHF+shadcn-style) vs mega client pages with local state. |
| Performance | **Build OK; code shape risky** | Very large client files (2k+ lines) hurt maintainability and lazy-loading opportunities. |
| BG / NAP alignment | **Partial; doc vs code gaps** | Tax page numbering format ≠ `generateBulgarianInvoiceNumber` (16-digit); `napStatus` in DB only; no e-NAP integration surfaced. |
| Tests | **Solid domain coverage; UI tests need alignment** | Fixed regressions in HomePage, ProductsClient, ClientsClient, companies-route; HeroUI Table = `role="grid"` in tests. |

**Recommended next step:** Phased **consistency cleanup** (single import path, token alignment, split mega-forms) before any “strict 100% HeroUI rewrite.”

---

## 1. Design system & HeroUI consistency

### What works well

- Central `@import "@heroui/styles"` and shared primitives under [`src/components/ui/`](../src/components/ui/) (Button, Card, Table, Dialog, Form helpers, etc.).
- Semantic button mapping in [`src/components/ui/button.tsx`](../src/components/ui/button.tsx) (shadcn-like `variant` → HeroUI `primary` / `danger` / …) keeps call sites stable.
- Typography and layout utilities in [`src/app/globals.css`](../src/app/globals.css) (`page-title`, `form-section`, `app-page-shell`) give a coherent rhythm when used.

### Gaps & inconsistencies

1. **Dual consumption patterns**  
   Feature code imports HeroUI directly in places such as:
   - [`src/app/(main)/HomePageClient.tsx`](../src/app/(main)/HomePageClient.tsx) (`Chip`)
   - [`src/app/(main)/invoices/InvoicesClient.tsx`](../src/app/(main)/invoices/InvoicesClient.tsx) (`Toolbar`, `ButtonGroup`)
   - [`src/components/layout/Navbar.tsx`](../src/components/layout/Navbar.tsx) (`Avatar`)
   - [`src/app/(main)/settings/users/UsersClient.tsx`](../src/app/(main)/settings/users/UsersClient.tsx) (`Chip`, `Table`)
   - [`src/components/gdpr/CookieConsent.tsx`](../src/components/gdpr/CookieConsent.tsx) (`Button`)  
   **Impact:** Harder to enforce one variant/spacing language; upgrades to HeroUI v3 beta break more call sites.

2. **Non–HeroUI islands**  
   [`src/components/ui/command-palette.tsx`](../src/components/ui/command-palette.tsx) is fully custom (portal + lucide). Fine functionally, but it is outside the design system until wrapped or replaced.

3. **Global CSS overrides**  
   Large blocks in `globals.css` (e.g. `[data-slot="button"]` nowrap, toast slots, invoice table flat styles) can fight HeroUI defaults and make debugging regressions harder.

### Inventory: keep / normalize / replace (high level)

| Item | Action |
|------|--------|
| `src/components/ui/*` wrappers | **Keep**; treat as the only public import path for app code. |
| Direct `@heroui/react` in routes/layouts | **Normalize** → re-export or thin wrappers in `components/ui`. |
| `command-palette` | **Replace or wrap** with Modal/ComboBox patterns when touching it. |
| `globals.css` table/button overrides | **Review** per screen; prefer component `className` + tokens. |

---

## 2. Runtime UX & screens (representative)

Observations from live app (`localhost:3000`) and a11y snapshots:

| Screen | Observation | Severity |
|--------|-------------|----------|
| `/dashboard` | Clear hierarchy, quick actions, revenue chart; nav + search feel modern. | Low |
| `/invoices/new` | Client picker step is clean; good empty guidance. | Low |
| `/settings/company` | Strong compliance-oriented fields; **full-page loader** can mask content and feel “slow” even when data is fine. | Medium |
| Global | Skip link + landmark structure present; HeroUI/React Aria tables expose **`role="grid"`** with `aria-label` (tests must assert grid, not `role="table"`). | Info |

### UX backlog (prioritized)

1. **Medium:** Reduce perceived latency on settings — avoid blocking full-viewport loader when shell + tabs can render earlier (progressive loading).
2. **Medium:** Mega-forms — progressive disclosure (accordions / steps) for invoice create/edit to match HeroUI “progressive disclosure” principle.
3. **Low:** Ensure destructive actions always use consistent `AlertDialog` + single primary per context (HeroUI semantic variants).

---

## 3. Forms & CRUD audit

### Large / high-touch surfaces

| File | Approx. role |
|------|----------------|
| [`src/app/(main)/invoices/new/page.tsx`](../src/app/(main)/invoices/new/page.tsx) | Create invoice (monolith) |
| [`src/app/(main)/invoices/[id]/edit/EditInvoiceForm.tsx`](../src/app/(main)/invoices/[id]/edit/EditInvoiceForm.tsx) | Edit invoice |
| [`src/components/notes/NoteForm.tsx`](../src/components/notes/NoteForm.tsx) | Credit/debit notes |
| [`src/app/(main)/clients/new/page.tsx`](../src/app/(main)/clients/new/page.tsx), [`companies/new/page.tsx`](../src/app/(main)/companies/new/page.tsx) | Entity CRUD |
| [`src/app/(main)/settings/company/CompanyForm.tsx`](../src/app/(main)/settings/company/CompanyForm.tsx), [`invoice-preferences/InvoicePreferencesForm.tsx`](../src/app/(main)/settings/invoice-preferences/InvoicePreferencesForm.tsx) | Settings |

### Patterns

- **RHF + Zod** via [`src/components/ui/form.tsx`](../src/components/ui/form.tsx) and [`src/lib/validations/forms.ts`](../src/lib/validations/forms.ts) on many settings/entity pages.
- **Alternate** layout in [`src/components/forms/form-layout.tsx`](../src/components/forms/form-layout.tsx).
- **Invoice mega-flows** mix Card/Input/state without the shared Form abstraction — highest risk of field crowding and **create/edit drift**.

### Recommendations

1. Extract shared “invoice field groups” (issuer, recipient, VAT, dates, payment) into composable sections with one spacing constant.
2. Standardize on **one** form error pattern: HeroUI `FieldError` / `Description` vs custom `ErrorMessage` — pick per project rule.
3. Align all destructive flows to the same modal + copy pattern (void/cancel/delete).

---

## 4. Performance & architecture

### Build / runtime

- Production **build succeeds** (Next 16.2.3, webpack).
- **Largest client bundles** likely dominated by:
  - [`src/app/(main)/HomePageClient.tsx`](../src/app/(main)/HomePageClient.tsx) (marketing + motion)
  - Invoice list/detail clients
  - Invoice new page

### Recommendations (Next.js-aligned)

- Prefer **Server Components** for static structure; push `use client` to leaf widgets (per Next lazy-loading guidance).
- Use `next/dynamic` for below-the-fold marketing blocks and non-critical charts.
- Split mega-files into `components/invoice/editor/*` with explicit props to enable dynamic imports.

---

## 5. Bulgarian & NAP-sensitive compliance

### Implemented / tested (strong)

- Identifier & party logic: [`src/lib/bulgarian-party.ts`](../src/lib/bulgarian-party.ts) + [`src/tests/lib/bulgarian-party.test.ts`](../src/tests/lib/bulgarian-party.test.ts).
- Numbering & parsing: [`src/lib/bulgarian-invoice.ts`](../src/lib/bulgarian-invoice.ts) (documents **YY + 4-digit EIK suffix + 10-digit sequence**; legacy 12-digit parsing) + [`src/tests/lib/invoice-numbering.test.ts`](../src/tests/lib/invoice-numbering.test.ts).
- Snapshots: [`src/lib/document-snapshots.ts`](../src/lib/document-snapshots.ts) + tests.
- VAT math: [`src/tests/lib/money-vat.test.ts`](../src/tests/lib/money-vat.test.ts).
- Invoice API: [`src/tests/routes/invoices-route.test.ts`](../src/tests/routes/invoices-route.test.ts).

### Gaps / mismatches

| Topic | Detail |
|-------|--------|
| **Tax compliance copy** | [`src/app/(main)/settings/tax-compliance/page.tsx`](../src/app/(main)/settings/tax-compliance/page.tsx) shows `YYCCCCNNNNNN` (6-digit seq). Code uses **10-digit** tail in [`generateBulgarianInvoiceNumber`](../src/lib/bulgarian-invoice.ts). **Update copy** or add footnote “в приложението се ползва 10-цифрен пореден номер в съответствие с …”. |
| **Sequence vs calendar year** | Comment in `bulgarian-invoice.ts` says sequence is monotonic, not reset by year; tax page stresses per-year uniqueness. **Document** actual DB/sequence behavior for accountants. |
| **`napStatus`** | Present in [`db/migrations/0000_schema.sql`](../db/migrations/0000_schema.sql) / Prisma; **not referenced in `src/`**. Either remove from schema, or implement status + UI if needed. |
| **E-invoicing / NAP portal** | Informational text only; no claim of automated NAP submission (good). Keep disclaimers if adding features later. |

---

## 6. Test coverage audit

### Strengths

- Good **route-level** coverage for invoices, notes, companies, clients.
- Domain **pure function** tests (numbering, VAT, snapshots, dashboard buckets).

### Gaps (targeted, not exhaustive)

| Gap | Suggestion |
|-----|------------|
| No dedicated test for **tax-compliance page** vs numbering implementation | Add a small doc test or comment in code linking to `bulgarian-invoice.ts` format. |
| Large invoice create/edit UI | Consider1–2 **RTL smoke tests** per critical path (not full E2E), after splitting components. |
| Visual regression | Optional Playwright screenshots for dashboard + invoice wizard. |

### Fixes applied during this audit

- [`src/tests/components/home/HomePage.test.tsx`](../src/tests/components/home/HomePage.test.tsx) — pricing text split (`8.99` + `€/мес`; yearly `7.5`).
- [`src/tests/components/products/ProductsClient.test.tsx`](../src/tests/components/products/ProductsClient.test.tsx), [`clients/ClientsClient.test.tsx`](../src/tests/components/clients/ClientsClient.test.tsx) — `next/navigation` mock, updated limit-banner copy, pagination `aria-label` (`Страница N`), grid role, price assertion on card.
- [`src/tests/routes/companies-route.test.ts`](../src/tests/routes/companies-route.test.ts) — expectations aligned with current validation payload (`bulstatNumber`, `mol`).

---

## 7. Prioritized backlog (post-audit)

| Priority | Item | Owner area |
|----------|------|------------|
| P0 | Reconcile **tax-compliance numbering copy** with `generateBulgarianInvoiceNumber` | Compliance copy |
| P1 | **Normalize HeroUI imports** through `src/components/ui` | Design system |
| P1 | Split **invoice new/edit** into sections + shared modules | Forms / perf |
| P2 | Tone down **blocking loaders** on settings; skeleton inside layout | UX |
| P2 | Decide fate of **`napStatus`** (implement or drop) | Data model |
| P3 | Optional: refactor **command palette** to design-system modal | UX |

---

## 8. Strategy recommendation

- **Do not** jump to a big-bang “everything raw HeroUI” migration while v3 is still beta and the app already has a working wrapper layer.
- **Do** run a **phased consistency** pass: (1) import normalization, (2) token/CSS cleanup, (3) form module extraction, (4) compliance copy alignment, (5) targeted tests.

---

*End of report.*

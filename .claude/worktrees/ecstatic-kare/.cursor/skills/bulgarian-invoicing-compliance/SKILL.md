---
name: bulgarian-invoicing-compliance
description: Applies Bulgarian invoicing and company-data rules in this app. Use when working with EIK or BULSTAT, VAT registration fields, CompanyBook lookups, Bulgarian copy, invoice numbering, or compliance-sensitive business fields.
---

# Bulgarian Invoicing Compliance

Use this skill when a change touches Bulgarian business data or compliance-sensitive copy.

## Key context

- The codebase contains Bulgarian-specific company, client, and invoice fields.
- `src/lib/companybook.ts` maps CompanyBook data into form fields.
- `prisma/schema.prisma` defines fields like `bulstatNumber`, `vatRegistered`, `vatRegistrationNumber`, `mol`, `uicType`, `placeOfIssue`, and other tax-related attributes.

## Instructions

1. Preserve Bulgarian-specific fields unless the user explicitly asks to remove or rename them.
2. For company and client flows, keep `bulstatNumber`, `uicType`, `vatRegistered`, `vatRegistrationNumber`, and `mol` behavior consistent across form, API, and persistence layers.
3. When using CompanyBook data, follow the existing mapping rules in `src/lib/companybook.ts` for address, city, VAT, and manager fields.
4. Prefer Bulgarian copy for validation and error states in Bulgarian-facing accounting flows unless the surrounding feature is clearly localized differently.
5. Treat invoice numbering, tax fields, and issued-document history as compliance-sensitive and high risk.
6. If the requirement is ambiguous or could alter legal/business behavior, stop and ask the user before changing the rule.

## Verification

- Check that mapped CompanyBook data still fills the intended fields.
- Check that Bulgarian identifiers and VAT fields survive create and edit flows.
- Check that user-facing copy remains coherent for Bulgarian users.

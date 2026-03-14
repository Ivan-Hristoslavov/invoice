# Subscription Model Update

## Canonical pricing

The live pricing baseline for the Bulgaria-first launch is:

- `FREE`: 0 EUR
- `STARTER`: 4.99 EUR/month or 49.99 EUR/year
- `PRO`: 8.99 EUR/month or 89.99 EUR/year
- `BUSINESS`: 19.99 EUR/month or 199.99 EUR/year

## What changed

- Added a shared plan definition file: `src/lib/subscription-plans.ts`
- Aligned checkout routes and Stripe webhook syncing to price IDs
- Removed amount-threshold plan detection in Stripe logic
- Synced billing UI and landing-page pricing to the shared plan data
- Kept legacy status normalization for old invoices, but new writes now persist `ISSUED`

## Product rules by tier

### FREE
- 3 invoices per month
- 1 company
- 5 clients
- 10 products
- No export
- No credit/debit notes
- No email sending

### STARTER
- 15 invoices per month
- 1 company
- 25 clients
- 50 products
- CSV export
- No credit/debit notes
- No email sending

### PRO
- Unlimited invoices
- 3 companies
- 100 clients
- 200 products
- Full export
- Credit/debit notes
- Email sending

### BUSINESS
- Unlimited invoices
- 10 companies
- Unlimited clients and products
- 5 users
- Full export
- API access

## Operational notes

- Generic invoice status updates no longer allow direct `ISSUED -> CANCELLED`; cancellation must go through the dedicated cancel flow.
- Credit and debit notes can only be created from issued invoices.
- CompanyBook lookup now degrades gracefully when the external service is unavailable.

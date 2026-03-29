# Subscription Summary

## Current plan model

The app now uses four public plans from a shared source of truth:

- `FREE`: 0 EUR
- `STARTER`: 4.99 EUR/month or 49.99 EUR/year
- `PRO`: 8.99 EUR/month or 89.99 EUR/year
- `BUSINESS`: 19.99 EUR/month or 199.99 EUR/year

## Current limits

| Feature | FREE | STARTER | PRO | BUSINESS |
|---------|------|---------|-----|----------|
| Invoices / month | 3 | 15 | Unlimited | Unlimited |
| Companies | 1 | 1 | 3 | 10 |
| Clients | 5 | 25 | 100 | Unlimited |
| Products | 10 | 50 | 200 | Unlimited |
| Credit/debit notes | No | No | Yes | Yes |
| Email sending | No | No | Yes | Yes |
| Export | No | CSV | Full | Full |
| API access | No | No | No | Yes |
| Team members | 1 | 1 | 2 | 5 |

## Implementation notes

- Pricing, Stripe price IDs, feature flags, limits, and plan order live in `src/lib/subscription-plans.ts`.
- Runtime limit enforcement uses `src/middleware/subscription.ts`.
- Checkout routes and Stripe webhook syncing use price-ID-based plan mapping instead of amount thresholds.
- Billing and public pricing UI now read the same plan definitions.

## Verification status

- Focused regression tests pass for company conflicts, invoice status persistence, and credit/debit note restrictions.
- `npm run build` passes on Next.js 16.

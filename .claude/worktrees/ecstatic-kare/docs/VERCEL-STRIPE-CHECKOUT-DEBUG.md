# Stripe Checkout "Invalid URL" on Vercel – Debug Guide

When `POST /api/subscription/direct-link` works locally but returns **500** with **"invalid URL"** (or "Not a valid URL") in production, Stripe is rejecting the `success_url` or `cancel_url` used when creating the Checkout Session.

## Root causes

1. **Missing or wrong `NEXT_PUBLIC_APP_URL`**  
   Next.js inlines `NEXT_PUBLIC_*` at **build time**. If this variable was not set (or was wrong) when Vercel built the project, the server may see `undefined` at runtime and pass invalid URLs to Stripe.

2. **Relative or malformed URLs**  
   Stripe requires **absolute HTTPS URLs** for `success_url` and `cancel_url`. Relative paths or URLs without `https://` can trigger "invalid URL".

3. **Trailing spaces / no protocol**  
   A value like `invoice-ten-sigma.vercel.app` (no `https://`) or `https://invoice-ten-sigma.vercel.app ` (trailing space) can break URL construction or Stripe validation.

4. **Test vs Live**  
   Wrong combination of Stripe key (test/live) and Price IDs (test/live) causes other errors (e.g. "No such price"), not usually "invalid URL", but keep keys and prices in the same mode.

## What the API route does (current behavior)

- Reads base URL from `NEXT_PUBLIC_APP_URL`, or falls back to `VERCEL_URL` (Vercel sets this automatically).
- Normalizes to an origin: `https://<host>` (always HTTPS).
- Builds absolute URLs with `new URL(path, baseOrigin).href`:
  - `success_url`: `https://<your-domain>/settings/subscription?success=true`
  - `cancel_url`: `https://<your-domain>/settings/subscription?canceled=true`
- Returns JSON errors (e.g. missing price, invalid URL) so the client can show them.

## Checklist for Vercel

| Item | Action |
|------|--------|
| **NEXT_PUBLIC_APP_URL** | Set in Vercel → Project → Settings → **Environment Variables** for **Production** (and Preview if needed). Value: `https://invoice-ten-sigma.vercel.app` — no trailing slash, no spaces. |
| **Build vs Runtime** | `NEXT_PUBLIC_*` is baked in at **build**. After adding/changing it, trigger a **new deployment** (Redeploy), not just a new preview. |
| **Fallback** | If `NEXT_PUBLIC_APP_URL` is missing, the route falls back to `https://${VERCEL_URL}` (Vercel provides `VERCEL_URL`). Custom domains still work if `VERCEL_URL` matches the deployment. For a custom domain, set `NEXT_PUBLIC_APP_URL` to that domain. |
| **STRIPE_SECRET_KEY** | Must be set for Production (and match the Stripe mode you use). |
| **STRIPE_STARTER_*_PRICE_ID** | Must be **Price IDs** (`price_...`), not Product IDs (`prod_...`), from the same Stripe account and mode as the secret key. |

## Environment variable names (no secrets)

- `NEXT_PUBLIC_APP_URL` – full app URL (e.g. `https://invoice-ten-sigma.vercel.app`)
- `VERCEL_URL` – set by Vercel automatically (used as fallback if `NEXT_PUBLIC_APP_URL` is missing)
- `STRIPE_SECRET_KEY` or `STRIPE_SECRET_KEY_FIXED`
- `STRIPE_STARTER_MONTHLY_PRICE_ID`
- `STRIPE_STARTER_YEARLY_PRICE_ID`
- (Optional) `STRIPE_PRO_*`, `STRIPE_BUSINESS_*`, `STRIPE_WEBHOOK_SECRET`, etc.

## How to fix

1. In Vercel: **Settings → Environment Variables**  
   Add (or fix) **NEXT_PUBLIC_APP_URL** = `https://invoice-ten-sigma.vercel.app` for **Production**.
2. **Redeploy** the project (so the new value is in the build).
3. Test again: open the subscription page, click pay for a plan; the request should return 200 and a Stripe Checkout URL, or a clear JSON error message.

If it still fails, the API now returns `{ "error": "..." }` with the exact message (e.g. from Stripe or our validation). Check the network tab or the in-app error for that message.

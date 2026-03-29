# Stripe setup for subscriptions

## Required environment variables

| Variable | Description |
|----------|-------------|
| `STRIPE_PUBLISH_KEY` | Publishable key (pk_test_... or pk_live_...) from Stripe Dashboard → API keys. Optional if you only use server-side redirects. |
| `STRIPE_SECRET_KEY_FIXED` | Secret key (sk_test_... or sk_live_...) from Stripe Dashboard → API keys. Used for checkout and webhooks. You can use `STRIPE_SECRET_KEY` instead; the app checks `STRIPE_SECRET_KEY_FIXED` first. |
| `STRIPE_WEBHOOK_SECRET` | Signing secret (whsec_...) from Stripe Dashboard → Developers → Webhooks, after you add the endpoint. |

## Webhook endpoint

**URL to register in Stripe Dashboard (Developers → Webhooks → Add endpoint):**

```
{NEXT_PUBLIC_APP_URL}/api/webhooks/stripe
```

Examples:

- Local: `http://localhost:3000/api/webhooks/stripe`
- Production: `https://yourdomain.com/api/webhooks/stripe`

**Events to send:**  
`checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.paid`, `invoice.payment_failed` (or enable all subscription events).

After creating the endpoint, copy the **Signing secret** into `STRIPE_WEBHOOK_SECRET`.

## Price IDs for plans

The app uses three plans: **STARTER**, **PRO**, **BUSINESS**. Create products/prices in Stripe and set:

- `STRIPE_STARTER_MONTHLY_PRICE_ID` / `STRIPE_STARTER_YEARLY_PRICE_ID`
- `STRIPE_PRO_MONTHLY_PRICE_ID` / `STRIPE_PRO_YEARLY_PRICE_ID`
- `STRIPE_BUSINESS_MONTHLY_PRICE_ID` / `STRIPE_BUSINESS_YEARLY_PRICE_ID`

Prices are always read on the server from these variables; the client never sends a price ID (to prevent manipulation).

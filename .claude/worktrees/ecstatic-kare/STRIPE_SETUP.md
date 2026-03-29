# Stripe Integration Setup Guide

This guide explains how to set up Stripe for the RapidFrame application.

## Prerequisites

1. A Stripe account (you can create one at [stripe.com](https://stripe.com))
2. The application codebase

## Step 1: Set Up Environment Variables

Add the following environment variables to your `.env.local` file:

```
# Stripe configuration
STRIPE_SECRET_KEY=sk_test_your_test_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Stripe product URLs
STRIPE_BASIC=https://buy.stripe.com/test_7sY28t3Wa97J0IMe3Fb7y08
STRIPE_PRO=https://buy.stripe.com/test_5kQeVf64ibfRbnqcZBb7y06
STRIPE_VIP=https://buy.stripe.com/test_fZu14p2S683F4Z2cZBb7y07 

# Subscription prices
STRIPE_BASIC_PRICE=10
STRIPE_PRO_PRICE=20
STRIPE_VIP_PRICE=30

# Stripe product and price IDs
STRIPE_BASIC_PRICE_ID=price_basic_id
STRIPE_PRO_PRICE_ID=price_pro_id
STRIPE_VIP_PRICE_ID=price_vip_id
```

Replace the placeholders with your actual Stripe keys and IDs.

## Step 2: Create Products in Stripe Dashboard

1. Go to the [Stripe Dashboard](https://dashboard.stripe.com/products)
2. Create three products for the subscription plans:
   - Basic Plan ($10/month)
   - Pro Plan ($20/month)
   - VIP Plan ($30/month)
3. For each product, create a recurring price with monthly billing
4. Note the Price IDs and update your environment variables

## Step 3: Set Up Stripe Webhooks

1. Go to the [Stripe Dashboard Webhooks page](https://dashboard.stripe.com/webhooks)
2. Add a new endpoint with the URL: `https://your-domain.com/api/webhook/stripe`
3. Select the following events to listen for:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`
4. After creating the webhook, copy the signing secret and add it to your environment variables as `STRIPE_WEBHOOK_SECRET`

## Step 4: Testing Locally with Stripe CLI

For local development, you can use the Stripe CLI to forward webhooks to your local environment:

1. [Install the Stripe CLI](https://stripe.com/docs/stripe-cli)
2. Login to your Stripe account:
   ```
   stripe login
   ```
3. Forward webhook events to your local server:
   ```
   stripe listen --forward-to http://localhost:3000/api/webhook/stripe
   ```
4. The CLI will provide a webhook secret - use this in your `.env.local` file during development

## Step 5: Testing the Integration

1. Start your application
2. Go to the Subscription page
3. Try subscribing to a plan
4. Check that webhook events are being received and processed
5. Verify the subscription status is updated in your database

## Troubleshooting

- If webhooks aren't being received, verify the webhook URL and signing secret
- Check the Stripe Dashboard for any failed webhook attempts
- Ensure your server is accessible from the internet if testing with real webhooks
- Verify that your environment variables are correctly set

## Additional Resources

- [Stripe API Documentation](https://stripe.com/docs/api)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [Stripe Testing Documentation](https://stripe.com/docs/testing) 
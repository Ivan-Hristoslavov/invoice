'use server';

import Stripe from 'stripe';

// Check if required environment variables are set
if (!process.env.STRIPE_SECRET_KEY && !process.env.STRIPE_SECRET_KEY_FIXED) {
  console.warn('Warning: Neither STRIPE_SECRET_KEY nor STRIPE_SECRET_KEY_FIXED is set in environment variables');
}

// Create a new Stripe instance with the secret key
// Use the fixed key if available, otherwise use the original key with escape characters removed
const stripeSecretKey = process.env.STRIPE_SECRET_KEY_FIXED || 
  (process.env.STRIPE_SECRET_KEY ? process.env.STRIPE_SECRET_KEY.replace(/%/g, '') : '');

// Verify we have a valid API key before initializing Stripe
if (!stripeSecretKey) {
  throw new Error('Stripe API key is missing. Please check your environment variables.');
}

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2023-10-16' as any, // Type cast to avoid version mismatch
  typescript: true,
});

// Export stripe as an async function to be compatible with 'use server' directive
export async function getStripe() {
  return stripe;
}

// Direct checkout URLs
const STRIPE_BASIC_URL = 'https://buy.stripe.com/test_7sY28t3Wa97J0IMe3Fb7y08';
const STRIPE_PRO_URL = 'https://buy.stripe.com/test_5kQeVf64ibfRbnqcZBb7y06';
const STRIPE_VIP_URL = 'https://buy.stripe.com/test_fZu14p2S683F4Z2cZBb7y07';

// Subscription prices in BGN
const STRIPE_BASIC_PRICE = 10;
const STRIPE_PRO_PRICE = 20;
const STRIPE_VIP_PRICE = 30;

// Fallback price IDs (for development only - should be set in environment variables)
const FALLBACK_PRICE_IDS = {
  BASIC: 'price_basic_fallback',
  PRO: 'price_pro_fallback',
  VIP: 'price_vip_fallback'
};

// Subscription plan data structure - safe to expose to client
const PLANS_DATA = {
  BASIC: {
    name: 'Basic',
    url: STRIPE_BASIC_URL,
    price: STRIPE_BASIC_PRICE,
    priceId: process.env.STRIPE_BASIC_PRICE_ID || FALLBACK_PRICE_IDS.BASIC,
    features: [
      'Access to basic invoicing features',
      'Up to 10 clients',
      'Up to 50 invoices per month'
    ],
  },
  PRO: {
    name: 'Pro',
    url: STRIPE_PRO_URL,
    price: STRIPE_PRO_PRICE,
    priceId: process.env.STRIPE_PRO_PRICE_ID || FALLBACK_PRICE_IDS.PRO,
    features: [
      'All Basic features',
      'Up to 50 clients',
      'Unlimited invoices',
      'Custom branding'
    ],
  },
  VIP: {
    name: 'VIP',
    url: STRIPE_VIP_URL,
    price: STRIPE_VIP_PRICE,
    priceId: process.env.STRIPE_VIP_PRICE_ID || FALLBACK_PRICE_IDS.VIP,
    features: [
      'All Pro features',
      'Unlimited clients',
      'Priority support',
      'Advanced analytics'
    ],
  },
};

// Server action to fetch subscription plans data
export async function getSubscriptionPlans() {
  return PLANS_DATA;
}

// Create checkout session
export async function createCheckoutSession(priceId: string) {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/cancelled`,
    });
    
    return { url: session.url };
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw new Error('Failed to create checkout session');
  }
}

// Additional Stripe helper functions
export async function getStripeCustomer(customerId: string) {
  return await stripe.customers.retrieve(customerId);
}

export async function getSubscription(subscriptionId: string) {
  return await stripe.subscriptions.retrieve(subscriptionId);
}

// Create payment link for invoice
export async function createInvoicePaymentLink(
  invoiceId: string,
  amount: number,
  currency: string,
  customerEmail?: string
) {
  try {
    // 1. Create a product for the invoice
    const product = await stripe.products.create({
      name: `Invoice #${invoiceId}`,
      metadata: { invoiceId },
    });

    // 2. Create a price for the product
    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: Math.round(amount * 100),
      currency: currency.toLowerCase(),
    });

    // 3. Create a payment link using the price
    const paymentLink = await stripe.paymentLinks.create({
      line_items: [
        {
          price: price.id,
          quantity: 1,
        },
      ],
      after_completion: {
        type: 'redirect',
        redirect: {
          url: `${process.env.NEXT_PUBLIC_APP_URL}/invoices/${invoiceId}?payment_status=success`,
        },
      },
      metadata: { invoiceId },
    });

    return paymentLink.url;
  } catch (error) {
    console.error('Error creating payment link:', error);
    if (error instanceof Error) {
      // Log extra details if available
      // @ts-ignore
      if (error.response) console.error('Stripe error.response:', error.response);
      // @ts-ignore
      if (error.raw) console.error('Stripe error.raw:', error.raw);
    }
    throw new Error('Failed to create payment link');
  }
}

export async function getStripeInstance() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not set');
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2025-04-30.basil" as Stripe.LatestApiVersion,
  });
} 
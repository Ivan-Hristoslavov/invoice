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
    url: process.env.STRIPE_BASIC,
    price: Number(process.env.STRIPE_BASIC_PRICE) || 10,
    priceId: process.env.STRIPE_BASIC_PRICE_ID || FALLBACK_PRICE_IDS.BASIC,
    features: [
      'Access to basic invoicing features',
      'Up to 10 clients',
      'Up to 50 invoices per month'
    ],
  },
  PRO: {
    name: 'Pro',
    url: process.env.STRIPE_PRO,
    price: Number(process.env.STRIPE_PRO_PRICE) || 20,
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
    url: process.env.STRIPE_VIP,
    price: Number(process.env.STRIPE_VIP_PRICE) || 30,
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

// Server function to get Stripe instance
export async function getStripeInstance() {
  return stripe;
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
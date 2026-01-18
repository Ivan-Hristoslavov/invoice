'use server';

import Stripe from 'stripe';

// Lazy initialization helper to avoid build-time errors
let stripeInstance: Stripe | null = null;

export async function getStripe() {
  if (stripeInstance) {
    return stripeInstance;
  }
  
  // Check if required environment variables are set
  if (!process.env.STRIPE_SECRET_KEY && !process.env.STRIPE_SECRET_KEY_FIXED) {
    throw new Error('Neither STRIPE_SECRET_KEY nor STRIPE_SECRET_KEY_FIXED is set in environment variables');
  }

  // Create a new Stripe instance with the secret key
  // Use the fixed key if available, otherwise use the original key with escape characters removed
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY_FIXED || 
    (process.env.STRIPE_SECRET_KEY ? process.env.STRIPE_SECRET_KEY.replace(/%/g, '') : '');

  // Verify we have a valid API key before initializing Stripe
  if (!stripeSecretKey) {
    throw new Error('Stripe API key is missing. Please check your environment variables.');
  }

  stripeInstance = new Stripe(stripeSecretKey, {
    apiVersion: '2023-10-16' as any, // Type cast to avoid version mismatch
    typescript: true,
  });
  
  return stripeInstance;
}

// Direct checkout URLs (to be updated with actual Stripe Payment Links)
// FREE plan doesn't need a checkout URL
const STRIPE_PRO_MONTHLY_URL = process.env.STRIPE_PRO_MONTHLY_URL || 'https://buy.stripe.com/test_pro_monthly';
const STRIPE_PRO_YEARLY_URL = process.env.STRIPE_PRO_YEARLY_URL || 'https://buy.stripe.com/test_pro_yearly';
const STRIPE_BUSINESS_MONTHLY_URL = process.env.STRIPE_BUSINESS_MONTHLY_URL || 'https://buy.stripe.com/test_business_monthly';
const STRIPE_BUSINESS_YEARLY_URL = process.env.STRIPE_BUSINESS_YEARLY_URL || 'https://buy.stripe.com/test_business_yearly';

// Prices from environment variables (can be managed from Vercel)
// These are the actual prices in EUR that users will pay
const STRIPE_FREE_PRICE = 0; // Free plan
const STRIPE_PRO_PRICE = parseFloat(process.env.STRIPE_PRO_PRICE || '13'); // Default to 13 EUR/month
const STRIPE_BUISNESS_PRICE = parseFloat(process.env.STRIPE_BUISNESS_PRICE || '28'); // Default to 28 EUR/month (note: keeping typo as per user's request)

// Calculate yearly prices (20% discount)
const STRIPE_PRO_YEARLY_PRICE = STRIPE_PRO_PRICE * 12 * 0.8; // 20% discount
const STRIPE_BUISNESS_YEARLY_PRICE = STRIPE_BUISNESS_PRICE * 12 * 0.8; // 20% discount

// Price IDs from environment variables
// Note: User provided product IDs, but we need price IDs. These should be updated with actual price IDs from Stripe
const STRIPE_PRO_PRICE_ID = process.env.STRIPE_PRO_PRICE_ID || null;
const STRIPE_BUISNESS_PRICE_ID = process.env.STRIPE_BUISNESS_PRICE_ID || null;

// Fallback price IDs (for development only - should be set in environment variables)
const FALLBACK_PRICE_IDS = {
  PRO_MONTHLY: 'price_pro_monthly_fallback',
  PRO_YEARLY: 'price_pro_yearly_fallback',
  BUSINESS_MONTHLY: 'price_business_monthly_fallback',
  BUSINESS_YEARLY: 'price_business_yearly_fallback',
};

// Subscription plan data structure - safe to expose to client
const PLANS_DATA = {
  FREE: {
    name: 'Free',
    price: STRIPE_FREE_PRICE,
    priceMonthly: STRIPE_FREE_PRICE,
    priceYearly: STRIPE_FREE_PRICE,
    priceIdMonthly: null, // Free plan doesn't need Stripe
    priceIdYearly: null,
    features: [
      'До 3 фактури на месец',
      '1 фирма',
      'Basic PDF (с воден знак)',
      'Без експорт',
      'Без лого',
    ],
    limitations: [
      'Без кредитни известия',
      'Без изпращане по имейл',
    ],
  },
  PRO: {
    name: 'Pro',
    price: STRIPE_PRO_PRICE,
    priceMonthly: STRIPE_PRO_PRICE,
    priceYearly: STRIPE_PRO_YEARLY_PRICE,
    priceId: STRIPE_PRO_PRICE_ID || FALLBACK_PRICE_IDS.PRO_MONTHLY,
    priceIdMonthly: STRIPE_PRO_PRICE_ID || FALLBACK_PRICE_IDS.PRO_MONTHLY,
    priceIdYearly: process.env.STRIPE_PRO_YEARLY_PRICE_ID || FALLBACK_PRICE_IDS.PRO_YEARLY,
    features: [
      'Неограничени фактури',
      '3 фирми',
      'Собствено лого',
      'Професионален PDF',
      'Кредитни известия',
      'Експорт PDF / CSV',
      'Изпращане по имейл',
    ],
    popular: true, // Mark as popular plan
  },
  BUSINESS: {
    name: 'Business',
    price: STRIPE_BUISNESS_PRICE,
    priceMonthly: STRIPE_BUISNESS_PRICE,
    priceYearly: STRIPE_BUISNESS_YEARLY_PRICE,
    priceId: STRIPE_BUISNESS_PRICE_ID || FALLBACK_PRICE_IDS.BUSINESS_MONTHLY,
    priceIdMonthly: STRIPE_BUISNESS_PRICE_ID || FALLBACK_PRICE_IDS.BUSINESS_MONTHLY,
    priceIdYearly: process.env.STRIPE_BUISNESS_YEARLY_PRICE_ID || FALLBACK_PRICE_IDS.BUSINESS_YEARLY,
    features: [
      'Всичко от Pro',
      'Неограничени фирми',
      'Приоритетна поддръжка',
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
    const stripe = await getStripe();
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
  const stripe = await getStripe();
  return await stripe.customers.retrieve(customerId);
}

export async function getSubscription(subscriptionId: string) {
  const stripe = await getStripe();
  return await stripe.subscriptions.retrieve(subscriptionId);
}

// Payment link functionality removed - invoices are for issuance only, not payment processing

export async function getStripeInstance() {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY_FIXED || process.env.STRIPE_SECRET_KEY;
  
  if (!stripeSecretKey) {
    throw new Error('STRIPE_SECRET_KEY_FIXED or STRIPE_SECRET_KEY is not set');
  }
  
  return new Stripe(stripeSecretKey, {
    apiVersion: "2025-04-30.basil" as Stripe.LatestApiVersion,
  });
}

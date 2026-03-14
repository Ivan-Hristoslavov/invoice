import "server-only";

import Stripe from 'stripe';
import {
  getCanonicalPriceId,
  getPlanByPriceId,
  SUBSCRIPTION_PLANS,
  type BillingInterval,
  type SubscriptionPlanKey,
} from '@/lib/subscription-plans';

let stripeInstance: Stripe | null = null;
const STRIPE_API_VERSION = "2025-04-30.basil" as Stripe.LatestApiVersion;

export async function getStripe() {
  if (stripeInstance) {
    return stripeInstance;
  }

  const stripeSecretKey =
    process.env.STRIPE_SECRET_KEY_FIXED || process.env.STRIPE_SECRET_KEY || "";

  if (!stripeSecretKey) {
    throw new Error("Stripe API key is missing. Please check your environment variables.");
  }

  stripeInstance = new Stripe(stripeSecretKey, {
    apiVersion: STRIPE_API_VERSION,
    typescript: true,
  });

  return stripeInstance;
}

export async function getSubscriptionPlans() {
  return SUBSCRIPTION_PLANS;
}

export function getPlanPriceId(plan: SubscriptionPlanKey, interval: BillingInterval) {
  return getCanonicalPriceId(plan, interval);
}

export function resolvePlanFromPriceId(priceId?: string | null) {
  return getPlanByPriceId(priceId);
}

export function mapStripeStatusToDbStatus(
  status: Stripe.Subscription.Status
): "ACTIVE" | "PAST_DUE" | "UNPAID" | "CANCELED" | "INCOMPLETE" | "INCOMPLETE_EXPIRED" | "TRIALING" | "PAUSED" {
  switch (status) {
    case "active":
      return "ACTIVE";
    case "past_due":
      return "PAST_DUE";
    case "unpaid":
      return "UNPAID";
    case "canceled":
      return "CANCELED";
    case "incomplete":
      return "INCOMPLETE";
    case "incomplete_expired":
      return "INCOMPLETE_EXPIRED";
    case "trialing":
      return "TRIALING";
    case "paused":
      return "PAUSED";
    default:
      return "INCOMPLETE";
  }
}

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

export async function getStripeInstance() {
  return getStripe();
}

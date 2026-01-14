import { PrismaClient } from '@prisma/client';
import { prisma } from '@/lib/db';
import { getStripeInstance, getSubscriptionPlans } from '@/lib/stripe';
import { Stripe } from 'stripe';

// Define enums that match the Prisma schema
enum SubscriptionPlan {
  FREE = 'FREE',
  PRO = 'PRO',
  BUSINESS = 'BUSINESS',
}

enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  PAST_DUE = 'PAST_DUE',
  UNPAID = 'UNPAID',
  CANCELED = 'CANCELED',
  INCOMPLETE = 'INCOMPLETE',
  INCOMPLETE_EXPIRED = 'INCOMPLETE_EXPIRED',
  TRIALING = 'TRIALING',
  PAUSED = 'PAUSED',
}

enum PaymentStatus {
  PAID = 'PAID',
  UNPAID = 'UNPAID',
  FAILED = 'FAILED',
  PENDING = 'PENDING',
  REFUNDED = 'REFUNDED',
  VOID = 'VOID',
}

export async function createOrRetrieveCustomer(userId: string, email: string, name?: string) {
  if (!userId || !email) {
    throw new Error('User ID and email are required to create a customer');
  }

  try {
    // Find the user
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      console.warn(`User not found with ID: ${userId}, attempting to find by email`);
      
      // Try to find the user by email as fallback
      const userByEmail = await prisma.user.findUnique({
        where: { email }
      });
      
      if (!userByEmail) {
        throw new Error(`No user found with ID: ${userId} or email: ${email}`);
      }
      
      // Use the user found by email
      if (userByEmail.stripeCustomerId) {
        return userByEmail.stripeCustomerId;
      }
      
      // Continue with the user found by email
      const stripe = await getStripeInstance();
      
      const customer = await stripe.customers.create({
        email,
        name: name || email,
        metadata: {
          userId: userByEmail.id,
        },
      });

      if (!customer || !customer.id) {
        throw new Error('Failed to create Stripe customer');
      }

      // Update the user with the new Stripe customer ID
      await prisma.user.update({
        where: { id: userByEmail.id },
        data: { stripeCustomerId: customer.id },
      });

      return customer.id;
    }

    // If user already has a Stripe customer ID, return it
    if (user.stripeCustomerId) {
      return user.stripeCustomerId;
    }

    // Get Stripe instance
    const stripe = await getStripeInstance();

    // Otherwise, create a new customer in Stripe
    const customer = await stripe.customers.create({
      email,
      name: name || email,
      metadata: {
        userId,
      },
    });

    if (!customer || !customer.id) {
      throw new Error('Failed to create Stripe customer');
    }

    // Update the user with the new Stripe customer ID
    await prisma.user.update({
      where: { id: userId },
      data: { stripeCustomerId: customer.id },
    });

    return customer.id;
  } catch (error) {
    console.error('Error creating or retrieving customer:', error);
    throw new Error('Failed to create or retrieve Stripe customer');
  }
}

export async function createCheckoutSession(
  userId: string,
  email: string,
  name: string | undefined,
  plan: 'FREE' | 'PRO' | 'BUSINESS',
  redirectUrl: string,
) {
  if (!userId || !email || !plan || !redirectUrl) {
    throw new Error('Missing required parameters for checkout session');
  }

  try {
    // Get Stripe instance
    const stripe = await getStripeInstance();
    
    // Get subscription plans
    const SUBSCRIPTION_PLANS = await getSubscriptionPlans();

    // Get or create a Stripe customer
    const customerId = await createOrRetrieveCustomer(userId, email, name);

    if (!customerId) {
      throw new Error('Failed to create or retrieve customer ID');
    }

    // Get the price ID for the selected plan
    const priceId = SUBSCRIPTION_PLANS[plan].priceId;

    if (!priceId) {
      throw new Error(`Invalid price ID for plan: ${plan}. Make sure STRIPE_${plan}_PRICE_ID is set in environment variables.`);
    }

    // Check if the price ID is an example/placeholder
    if (priceId.includes('example')) {
      // Instead of creating a checkout session with an invalid price ID,
      // return a fake session with a URL to a placeholder payment page
      console.warn(`Using example price ID: ${priceId}. This would fail in production.`);
      
      return {
        id: 'example_session_id',
        url: `${redirectUrl}/settings/subscription/example-checkout?plan=${plan}`,
        // Include other required fields that might be used in your application
        object: 'checkout.session',
        payment_status: 'unpaid',
        status: 'open',
      };
    }

    // Create a checkout session with a real price ID
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${redirectUrl}/settings/subscription?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${redirectUrl}/settings/subscription?canceled=true`,
      metadata: {
        userId,
        plan,
      },
    });

    if (!session || !session.url) {
      throw new Error('Failed to create checkout session');
    }

    return session;
  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    if (error.message.includes('price_pro_fallback') || 
        error.message.includes('price_business_fallback')) {
      throw new Error('Missing Stripe price IDs. Please configure STRIPE_PRO_MONTHLY_PRICE_ID, STRIPE_PRO_YEARLY_PRICE_ID, STRIPE_BUSINESS_MONTHLY_PRICE_ID, and STRIPE_BUSINESS_YEARLY_PRICE_ID in your environment variables.');
    }
    throw error;
  }
}

export async function cancelSubscription(subscriptionId: string) {
  try {
    // Get Stripe instance
    const stripe = await getStripeInstance();
    
    // Retrieve the subscription from our database
    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
    });

    if (!subscription) {
      throw new Error('Subscription not found');
    }

    // Cancel the subscription in Stripe
    await stripe.subscriptions.cancel(subscription.stripeSubscriptionId);

    // Update our database
    await prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        status: SubscriptionStatus.CANCELED,
        cancelAtPeriodEnd: true,
      },
    });

    return { success: true };
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    throw new Error('Failed to cancel subscription');
  }
}

export async function handleSubscriptionUpdated(
  stripeSubscriptionId: string,
  stripeCustomerId: string,
  status: Stripe.Subscription.Status,
) {
  try {
    // Get Stripe instance
    const stripe = await getStripeInstance();
    
    // Get subscription plans
    const SUBSCRIPTION_PLANS = await getSubscriptionPlans();
    
    // Find the user by Stripe customer ID
    const user = await prisma.user.findUnique({
      where: { stripeCustomerId },
    });

    if (!user) {
      throw new Error(`No user found for Stripe customer ID: ${stripeCustomerId}`);
    }

    // Get subscription details from Stripe
    const stripeSubscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);
    
    // Get the plan from the subscription item's price ID
    const priceId = stripeSubscription.items.data[0].price.id;
    let plan: SubscriptionPlan;
    
    // Determine the plan based on price ID (FREE plan doesn't have a price ID)
    if (priceId === SUBSCRIPTION_PLANS.PRO.priceIdMonthly || priceId === SUBSCRIPTION_PLANS.PRO.priceIdYearly) {
      plan = SubscriptionPlan.PRO;
    } else if (priceId === SUBSCRIPTION_PLANS.BUSINESS.priceIdMonthly || priceId === SUBSCRIPTION_PLANS.BUSINESS.priceIdYearly) {
      plan = SubscriptionPlan.BUSINESS;
    } else {
      // Default to FREE if we can't determine the plan (fallback)
      console.warn(`Unknown price ID: ${priceId}, defaulting to FREE plan`);
      plan = SubscriptionPlan.FREE;
    }

    // Map Stripe status to our database status
    const subscriptionStatus = mapStripeStatusToDbStatus(status);

    // Find existing subscription in our database
    const existingSubscription = await prisma.subscription.findFirst({
      where: { stripeSubscriptionId },
    });

    if (existingSubscription) {
      // Update existing subscription
      return await prisma.subscription.update({
        where: { id: existingSubscription.id },
        data: {
          status: subscriptionStatus,
          priceId,
          plan,
          cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
          currentPeriodStart: new Date((stripeSubscription as any).current_period_start * 1000),
          currentPeriodEnd: new Date((stripeSubscription as any).current_period_end * 1000),
        },
      });
    } else {
      // Create new subscription
      return await prisma.subscription.create({
        data: {
          userId: user.id,
          stripeSubscriptionId,
          status: subscriptionStatus,
          priceId,
          plan,
          cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
          currentPeriodStart: new Date((stripeSubscription as any).current_period_start * 1000),
          currentPeriodEnd: new Date((stripeSubscription as any).current_period_end * 1000),
        },
      });
    }
  } catch (error) {
    console.error('Error handling subscription update:', error);
    throw error;
  }
}

export async function handleInvoicePaid(stripeInvoiceId: string, stripeSubscriptionId: string, amount: number) {
  try {
    // Find the subscription in our database
    const subscription = await prisma.subscription.findFirst({
      where: { stripeSubscriptionId },
    });

    if (!subscription) {
      throw new Error(`No subscription found for Stripe subscription ID: ${stripeSubscriptionId}`);
    }

    // Check if we've already recorded this payment
    const existingPayment = await prisma.subscriptionPayment.findUnique({
      where: { stripeInvoiceId },
    });

    if (existingPayment) {
      // Update payment if it exists
      return await prisma.subscriptionPayment.update({
        where: { id: existingPayment.id },
        data: {
          status: PaymentStatus.PAID,
          amount: amount,
        },
      });
    } else {
      // Create new payment record
      return await prisma.subscriptionPayment.create({
        data: {
          subscriptionId: subscription.id,
          stripeInvoiceId,
          amount: amount,
          status: PaymentStatus.PAID,
        },
      });
    }
  } catch (error) {
    console.error('Error handling invoice payment:', error);
    throw error;
  }
}

export async function handleInvoiceFailed(stripeInvoiceId: string, stripeSubscriptionId: string) {
  try {
    // Find the subscription
    const subscription = await prisma.subscription.findFirst({
      where: { stripeSubscriptionId },
    });

    if (!subscription) {
      throw new Error(`No subscription found for Stripe subscription ID: ${stripeSubscriptionId}`);
    }

    // Update the subscription status
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: { status: SubscriptionStatus.PAST_DUE },
    });

    // Check if we've already recorded this payment
    const existingPayment = await prisma.subscriptionPayment.findUnique({
      where: { stripeInvoiceId },
    });

    if (existingPayment) {
      // Update payment status if it exists
      return await prisma.subscriptionPayment.update({
        where: { id: existingPayment.id },
        data: { status: PaymentStatus.FAILED },
      });
    } 
    
    // If we don't have a record yet, the invoice failed before we could record it
    // This is handled when Stripe attempts to retry the payment
  } catch (error) {
    console.error('Error handling invoice failure:', error);
    throw error;
  }
}

function mapStripeStatusToDbStatus(status: Stripe.Subscription.Status): SubscriptionStatus {
  switch (status) {
    case 'active':
      return SubscriptionStatus.ACTIVE;
    case 'past_due':
      return SubscriptionStatus.PAST_DUE;
    case 'unpaid':
      return SubscriptionStatus.UNPAID;
    case 'canceled':
      return SubscriptionStatus.CANCELED;
    case 'incomplete':
      return SubscriptionStatus.INCOMPLETE;
    case 'incomplete_expired':
      return SubscriptionStatus.INCOMPLETE_EXPIRED;
    case 'trialing':
      return SubscriptionStatus.TRIALING;
    case 'paused':
      return SubscriptionStatus.PAUSED;
    default:
      return SubscriptionStatus.INCOMPLETE;
  }
} 
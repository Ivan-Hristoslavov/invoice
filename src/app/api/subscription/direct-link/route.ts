import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from '@/lib/auth';
import { getStripe } from '@/lib/stripe';

// Get direct Stripe checkout URLs from environment variables
const STRIPE_URLS = {
  FREE: { monthly: null, yearly: null }, // Free plan doesn't need Stripe
  STARTER: { 
    monthly: process.env.STRIPE_STARTER_MONTHLY_URL || null,
    yearly: process.env.STRIPE_STARTER_YEARLY_URL || null,
  },
  PRO: { 
    monthly: process.env.STRIPE_PRO_MONTHLY_URL || null,
    yearly: process.env.STRIPE_PRO_YEARLY_URL || null,
  },
  BUSINESS: { 
    monthly: process.env.STRIPE_BUSINESS_MONTHLY_URL || null,
    yearly: process.env.STRIPE_BUSINESS_YEARLY_URL || null,
  },
};

// Price IDs for fallback checkout sessions
const STRIPE_PRICE_IDS = {
  STARTER: {
    monthly: process.env.STRIPE_STARTER_MONTHLY_PRICE_ID,
    yearly: process.env.STRIPE_STARTER_YEARLY_PRICE_ID,
  },
  PRO: {
    monthly: process.env.STRIPE_PRO_MONTHLY_PRICE_ID || process.env.STRIPE_PRO_PRICE_ID,
    yearly: process.env.STRIPE_PRO_YEARLY_PRICE_ID,
  },
  BUSINESS: {
    monthly: process.env.STRIPE_BUSINESS_MONTHLY_PRICE_ID || process.env.STRIPE_BUISNESS_PRICE_ID,
    yearly: process.env.STRIPE_BUSINESS_YEARLY_PRICE_ID,
  },
};

// Helper function to serialize objects
function serializeValue(value: any): any {
  if (typeof value === 'object' && value !== null && typeof value.toString === 'function' && value.constructor?.name === 'Decimal') {
    return value.toString();
  }
  if (Array.isArray(value)) {
    return value.map(serializeValue);
  }
  if (typeof value === 'object' && value !== null) {
    const result: any = {};
    for (const [key, val] of Object.entries(value)) {
      result[key] = serializeValue(val);
    }
    return result;
  }
  return value;
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { plan, billingInterval = 'yearly' } = await req.json();

    if (!plan || !['FREE', 'STARTER', 'PRO', 'BUSINESS'].includes(plan)) {
      return new NextResponse('Invalid plan', { status: 400 });
    }

    // FREE plan doesn't need checkout
    if (plan === 'FREE') {
      return new NextResponse('FREE plan does not require checkout', { status: 400 });
    }

    const interval = billingInterval === 'monthly' ? 'monthly' : 'yearly';

    // Get the direct URL for the selected plan
    const planUrls = STRIPE_URLS[plan as keyof typeof STRIPE_URLS];
    if (planUrls && typeof planUrls === 'object') {
      const directUrl = planUrls[interval as keyof typeof planUrls];
      if (directUrl) {
        return NextResponse.json({ url: directUrl });
      }
    }

    // Fallback to creating a Checkout session if direct URL is not available
    // Get the price ID for the selected plan
    const planPrices = STRIPE_PRICE_IDS[plan as keyof typeof STRIPE_PRICE_IDS];
    const priceId = planPrices?.[interval as keyof typeof planPrices];
    
    if (!priceId) {
      return new NextResponse(`Price ID not configured for ${plan} ${interval}`, { status: 500 });
    }

    // Get the Stripe instance
    const stripe = await getStripe();

    // Create a Stripe Checkout Session
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings/subscription?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings/subscription?canceled=true`,
      customer_email: session.user.email || undefined,
      metadata: {
        userId: session.user.id,
        plan: plan,
      },
    });

    // Serialize the response
    const serializedResponse = serializeValue({
      url: checkoutSession.url,
      sessionId: checkoutSession.id
    });

    return NextResponse.json(serializedResponse);
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

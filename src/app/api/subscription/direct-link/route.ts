import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from '@/lib/auth';
import { getStripe } from '@/lib/stripe';
import { Decimal } from '@prisma/client/runtime/library';

// Get direct Stripe checkout URLs from environment variables
const STRIPE_URLS = {
  FREE: null, // Free plan doesn't need Stripe
  PRO: process.env.STRIPE_PRO_MONTHLY_URL || 'https://buy.stripe.com/test_pro_monthly',
  BUSINESS: process.env.STRIPE_BUSINESS_MONTHLY_URL || 'https://buy.stripe.com/test_business_monthly',
};

// Helper function to serialize Prisma Decimal objects
function serializeDecimal(value: any): any {
  if (value instanceof Decimal) {
    return value.toString();
  }
  if (Array.isArray(value)) {
    return value.map(serializeDecimal);
  }
  if (typeof value === 'object' && value !== null) {
    const result: any = {};
    for (const [key, val] of Object.entries(value)) {
      result[key] = serializeDecimal(val);
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

    const { plan } = await req.json();

    if (!plan || !['FREE', 'PRO', 'BUSINESS'].includes(plan)) {
      return new NextResponse('Invalid plan', { status: 400 });
    }

    // FREE plan doesn't need checkout
    if (plan === 'FREE') {
      return new NextResponse('FREE plan does not require checkout', { status: 400 });
    }

    // Get the direct URL for the selected plan
    const directUrl = STRIPE_URLS[plan as keyof typeof STRIPE_URLS];
    if (directUrl) {
      return NextResponse.json({ url: directUrl });
    }

    // Fallback to creating a Checkout session if direct URL is not available
    // Get the price ID for the selected plan
    const priceId = process.env[`STRIPE_${plan}_PRICE_ID`];
    if (!priceId) {
      return new NextResponse('Price ID not configured', { status: 500 });
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

    // Serialize the response to handle any potential Decimal objects
    const serializedResponse = serializeDecimal({
      url: checkoutSession.url,
      sessionId: checkoutSession.id
    });

    return NextResponse.json(serializedResponse);
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 
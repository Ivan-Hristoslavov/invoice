import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from '@/lib/auth';
import { getStripe } from '@/lib/stripe';
import { ensureStripeCustomerBinding } from "@/lib/stripe-customer";
import {
  getCanonicalPriceId,
  type BillingInterval,
  type SubscriptionPlanKey,
} from "@/lib/subscription-plans";
import { resolveSessionUser } from "@/lib/session-user";
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const sessionUser = await resolveSessionUser(session.user);
    if (!sessionUser) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const customerEmail = session.user.email || sessionUser.email;
    if (!customerEmail) {
      return new NextResponse("Missing user email", { status: 400 });
    }

    const { plan, billingInterval = 'yearly' } = await req.json();
    const selectedPlan = plan as SubscriptionPlanKey;

    if (!selectedPlan || !['FREE', 'STARTER', 'PRO', 'BUSINESS'].includes(selectedPlan)) {
      return new NextResponse('Invalid plan', { status: 400 });
    }

    // FREE plan doesn't need checkout
    if (selectedPlan === 'FREE') {
      return new NextResponse('FREE plan does not require checkout', { status: 400 });
    }

    const interval: BillingInterval = billingInterval === 'monthly' ? 'monthly' : 'yearly';

    // Price is always resolved server-side from env. Never accept price_id or amount from client to prevent manipulation.
    const priceId = getCanonicalPriceId(selectedPlan, interval);
    if (!priceId) {
      return new NextResponse(`Липсва Stripe цена за ${selectedPlan} (${interval}). Задайте в .env (напр. STRIPE_STARTER_YEARLY_PRICE_ID).`, { status: 500 });
    }
    if (priceId.startsWith("prod_")) {
      return new NextResponse(
        "В .env е зададен Product ID (prod_...). Нужен е Price ID (price_...). В Stripe: отвори продукта → под него са цените → копирай Price ID.",
        { status: 400 }
      );
    }

    const stripe = await getStripe();
    const customerId = await ensureStripeCustomerBinding({
      userId: sessionUser.id,
      email: customerEmail,
      name: session.user.name,
    });

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
      customer: customerId,
      client_reference_id: sessionUser.id,
      metadata: {
        userId: sessionUser.id,
        plan: selectedPlan,
        billingInterval: interval,
      },
      subscription_data: {
        metadata: {
          userId: sessionUser.id,
          plan: selectedPlan,
          billingInterval: interval,
        },
      },
    });

    return NextResponse.json({
      url: checkoutSession.url,
      sessionId: checkoutSession.id,
    });
  } catch (error: any) {
    console.error("Error creating checkout session:", error);
    const isNoSuchPrice =
      error?.type === "StripeInvalidRequestError" &&
      error?.code === "resource_missing" &&
      String(error?.param || "").includes("price");
    const message = isNoSuchPrice
      ? "Stripe не намира тази цена. Провери: (1) В .env само Price ID (price_...). (2) Същия режим Test/Live като ключа. (3) Същия Stripe акаунт."
      : "Internal Server Error";
    return new NextResponse(message, { status: 500 });
  }
}

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

/** GET is not supported; redirect to subscription page so user can start checkout from there. */
export async function GET() {
  return NextResponse.redirect("/settings/subscription", 302);
}

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
      return NextResponse.json(
        { error: `Липсва Stripe цена за ${selectedPlan} (${interval}). Задайте в Vercel env (напр. STRIPE_STARTER_YEARLY_PRICE_ID).` },
        { status: 500 }
      );
    }
    if (priceId.startsWith("prod_")) {
      return NextResponse.json(
        { error: "В .env е зададен Product ID (prod_...). Нужен е Price ID (price_...). В Stripe: отвори продукта → под него са цените → копирай Price ID." },
        { status: 400 }
      );
    }

    // Prefer NEXT_PUBLIC_APP_URL; on Vercel fall back to VERCEL_URL (set automatically, no protocol)
    const rawAppUrl = process.env.NEXT_PUBLIC_APP_URL?.trim() ?? "";
    const vercelUrl = process.env.VERCEL_URL?.trim() ?? "";
    let originInput = rawAppUrl || (vercelUrl ? `https://${vercelUrl}` : "");
    // If no protocol (e.g. user set "invoice-ten-sigma.vercel.app"), Stripe will reject; force https
    if (originInput && !/^https?:\/\//i.test(originInput)) {
      originInput = `https://${originInput}`;
    }

    if (!originInput) {
      return NextResponse.json(
        { error: "NEXT_PUBLIC_APP_URL (or VERCEL_URL) не е зададен. Задайте NEXT_PUBLIC_APP_URL в Vercel (напр. https://invoice-ten-sigma.vercel.app)." },
        { status: 500 }
      );
    }
    let baseOrigin: string;
    try {
      const parsed = new URL(originInput);
      if (!parsed.host) throw new Error("Missing host");
      baseOrigin = `https://${parsed.host}`;
    } catch {
      return NextResponse.json(
        { error: "NEXT_PUBLIC_APP_URL не е валиден URL (напр. https://invoice-ten-sigma.vercel.app, без интервал в края)." },
        { status: 500 }
      );
    }

    const successUrl = new URL("/settings/subscription?success=true", baseOrigin).href;
    const cancelUrl = new URL("/settings/subscription?canceled=true", baseOrigin).href;

    // Log in Vercel → Project → Logs to see what URLs are sent to Stripe (helps debug "invalid URL")
    console.log("[direct-link] redirect URLs", { baseOrigin, successUrl, cancelUrl, hasNextPublic: !!rawAppUrl, vercelUrl: vercelUrl || "(none)" });

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
      success_url: successUrl,
      cancel_url: cancelUrl,
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
    let message: string;
    if (isNoSuchPrice) {
      message = "Stripe не намира тази цена. Провери: (1) В Vercel env само Price ID (price_...). (2) Същия режим Test/Live като ключа. (3) Същия Stripe акаунт.";
    } else if (error?.message) {
      message = error.message;
    } else {
      message = "Internal Server Error";
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

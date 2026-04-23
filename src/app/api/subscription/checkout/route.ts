import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getStripe } from "@/lib/stripe";
import { validateRedirectUrl } from "@/lib/redirect-url";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { resolveSessionUser } from "@/lib/session-user";
import { ensureStripeCustomerBinding } from "@/lib/stripe-customer";
import {
  getCanonicalPriceId,
  type BillingInterval,
  type SubscriptionPlanKey,
} from "@/lib/subscription-plans";

export async function POST(req: NextRequest) {
  try {
    // Rate limit checkout attempts per IP (prevents abuse / spam)
    const ip = getClientIp(req.headers);
    const { success, remaining, resetIn } = await rateLimit(`checkout:${ip}`, {
      windowMs: 60_000,
      maxRequests: 10,
    });
    if (!success) {
      return NextResponse.json(
        {
          error: "Твърде много опити. Моля, опитайте отново след минута.",
        },
        { status: 429 }
      );
    }

    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: "Необходима е автентикация" },
        { status: 401 }
      );
    }

    const sessionUser = await resolveSessionUser(session.user);
    if (!sessionUser || !session.user.email) {
      return NextResponse.json(
        { error: "Липсва информация за потребителя в сесията" },
        { status: 400 }
      );
    }

    let body;
    try {
      body = await req.json();
    } catch (error) {
      console.log("Грешка при парсване на тялото на заявката:", error);
      return NextResponse.json(
        { error: "Невалидно тяло на заявката" },
        { status: 400 }
      );
    }

    const { plan, billingInterval = "yearly", returnUrl } = body;
    const selectedPlan = plan as SubscriptionPlanKey;
    const interval: BillingInterval =
      billingInterval === "monthly" ? "monthly" : "yearly";

    if (!selectedPlan) {
      return NextResponse.json({ error: "Планът е задължителен" }, { status: 400 });
    }

    if (!["FREE", "STARTER", "PRO", "BUSINESS"].includes(selectedPlan)) {
      return NextResponse.json(
        { error: "Невалиден абонаментен план" },
        { status: 400 }
      );
    }

    if (selectedPlan === "FREE") {
      return NextResponse.json(
        { error: "Безплатният план не изисква checkout" },
        { status: 400 }
      );
    }

    // Price is always resolved server-side from env. Never accept price_id or amount from client to prevent manipulation.
    const redirectBase = validateRedirectUrl(returnUrl);
    const priceId = getCanonicalPriceId(selectedPlan, interval);

    if (!priceId) {
      return NextResponse.json(
        { error: `Липсва Stripe цена за ${selectedPlan} (${interval}). Задайте в .env (напр. STRIPE_STARTER_YEARLY_PRICE_ID).` },
        { status: 500 }
      );
    }

    if (priceId.startsWith("prod_")) {
      return NextResponse.json(
        {
          error:
            "В .env е зададен Product ID (prod_...). Нужен е Price ID (price_...). В Stripe Dashboard: отвори продукта → под него са цените → копирай Price ID за съответната цена.",
        },
        { status: 400 }
      );
    }

    const stripe = await getStripe();
    const customerId = await ensureStripeCustomerBinding({
      userId: sessionUser.id,
      email: session.user.email,
      name: session.user.name,
    });

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      customer: customerId,
      client_reference_id: sessionUser.id,
      success_url: `${redirectBase}/settings/subscription?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${redirectBase}/settings/subscription?canceled=true`,
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

    if (!checkoutSession?.url) {
      return NextResponse.json(
        { error: "Неуспешно създаване на URL за checkout сесия" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      sessionId: checkoutSession.id,
      url: checkoutSession.url,
    });
  } catch (error: any) {
    console.error("Грешка при checkout сесия:", error);
    const isNoSuchPrice =
      error?.type === "StripeInvalidRequestError" &&
      error?.code === "resource_missing" &&
      String(error?.param || "").includes("price");
    const message = isNoSuchPrice
      ? "Stripe не намира тази цена. Провери: (1) В .env да е само Price ID (price_...), не Product ID. (2) Stripe Dashboard да е в същия режим като ключа (Test/Live). (3) Цената да е създадена в същия акаунт като STRIPE_SECRET_KEY."
      : error?.message || "Неуспешно създаване на checkout сесия";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

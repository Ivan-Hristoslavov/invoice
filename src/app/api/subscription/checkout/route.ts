import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { createCheckoutSession } from "@/services/subscription-service";
import { getSubscriptionPlans } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase";
import { validateRedirectUrl } from "@/lib/redirect-url";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    // Rate limit checkout attempts per IP (prevents abuse / spam)
    const ip = getClientIp(req.headers);
    const { success, remaining, resetIn } = rateLimit(`checkout:${ip}`, {
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

    // Get session
    const session = await getServerSession();
    console.log("Данни за сесията:", JSON.stringify(session));

    if (!session) {
      console.log("Липсва сесия");
      return NextResponse.json(
        { error: "Необходима е автентикация" },
        { status: 401 }
      );
    }

    if (!session.user || !session.user.email) {
      console.log("Липсва информация за потребителя в сесията");
      return NextResponse.json(
        { error: "Липсва информация за потребителя в сесията" },
        { status: 400 }
      );
    }

    // Find the user ID from the email in the session
    const { data: user, error: userError } = await supabaseAdmin
      .from('User')
      .select('id')
      .eq('email', session.user.email)
      .single();

    if (userError || !user) {
      console.log("Потребител не е намерен с имейл:", session.user.email);
      return NextResponse.json(
        { error: "Потребителят не е намерен" },
        { status: 404 }
      );
    }

    console.log("Намерен потребител:", user.id);

    // Parse request body
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

    const { plan, returnUrl } = body;
    // Log plan only (avoid logging full returnUrl in production)
    
    if (!plan) {
      console.log("Липсва план в заявката");
      return NextResponse.json({ error: "Планът е задължителен" }, { status: 400 });
    }
    
    // Get subscription plans
    const SUBSCRIPTION_PLANS = await getSubscriptionPlans();
    
    // Validate plan
    if (!Object.keys(SUBSCRIPTION_PLANS).includes(plan)) {
      console.log("Невалиден план:", plan);
      return NextResponse.json(
        { error: "Невалиден абонаментен план" },
        { status: 400 }
      );
    }

    // Checkout session created for authenticated user

    // Only allow redirect to our app (prevents open redirect / phishing)
    const redirectBase = validateRedirectUrl(returnUrl);

    // Create checkout session using the user ID from the database
    const checkoutSession = await createCheckoutSession(
      user.id,
      session.user.email,
      session.user.name || undefined,
      plan,
      redirectBase
    );

    // Verify we have a URL to redirect to
    if (!checkoutSession?.url) {
      console.error("Липсва URL в checkout сесията:", checkoutSession);
      return NextResponse.json(
        { error: "Неуспешно създаване на URL за checkout сесия" },
        { status: 500 }
      );
    }


    // Return the URL explicitly
    return NextResponse.json({
      sessionId: checkoutSession.id,
      url: checkoutSession.url,
    });
  } catch (error: any) {
    console.error("Грешка при checkout сесия:", error);
    return NextResponse.json(
      { error: error.message || "Неуспешно създаване на checkout сесия" },
      { status: 500 }
    );
  }
}

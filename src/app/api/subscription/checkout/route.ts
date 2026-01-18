import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { createCheckoutSession } from "@/services/subscription-service";
import { getSubscriptionPlans } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
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
    console.log("Данни на заявката:", { plan, returnUrl });
    
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

    console.log("Създаване на checkout сесия с:", { 
      userId: user.id, 
      email: session.user.email,
      name: session.user.name,
      plan
    });

    // Create checkout session using the user ID from the database
    const checkoutSession = await createCheckoutSession(
      user.id,
      session.user.email,
      session.user.name || undefined,
      plan,
      returnUrl || process.env.NEXTAUTH_URL || "http://localhost:3000"
    );

    // Verify we have a URL to redirect to
    if (!checkoutSession?.url) {
      console.error("Липсва URL в checkout сесията:", checkoutSession);
      return NextResponse.json(
        { error: "Неуспешно създаване на URL за checkout сесия" },
        { status: 500 }
      );
    }

    console.log("Създадена checkout сесия:", { 
      sessionId: checkoutSession.id, 
      url: checkoutSession.url 
    });

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

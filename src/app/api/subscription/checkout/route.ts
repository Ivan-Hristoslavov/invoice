import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { createCheckoutSession } from "@/services/subscription-service";
import { getSubscriptionPlans } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    // Get session
    const session = await getServerSession();
    console.log("Session data:", JSON.stringify(session));

    if (!session) {
      console.log("No session found");
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    if (!session.user || !session.user.email) {
      console.log("Missing user information in session");
      return NextResponse.json(
        { error: "User information missing from session" },
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
      console.log("User not found with email:", session.user.email);
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    console.log("Found user:", user.id);

    // Parse request body
    let body;
    try {
      body = await req.json();
    } catch (error) {
      console.log("Error parsing request body:", error);
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    const { plan, returnUrl } = body;
    console.log("Request data:", { plan, returnUrl });
    
    if (!plan) {
      console.log("Missing plan in request");
      return NextResponse.json({ error: "Plan is required" }, { status: 400 });
    }
    
    // Get subscription plans
    const SUBSCRIPTION_PLANS = await getSubscriptionPlans();
    
    // Validate plan
    if (!Object.keys(SUBSCRIPTION_PLANS).includes(plan)) {
      console.log("Invalid plan:", plan);
      return NextResponse.json(
        { error: "Invalid subscription plan" },
        { status: 400 }
      );
    }

    console.log("Creating checkout session with:", { 
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
      console.error("Missing URL in checkout session:", checkoutSession);
      return NextResponse.json(
        { error: "Failed to create checkout session URL" },
        { status: 500 }
      );
    }

    console.log("Created checkout session:", { 
      sessionId: checkoutSession.id, 
      url: checkoutSession.url 
    });

    // Return the URL explicitly
    return NextResponse.json({
      sessionId: checkoutSession.id,
      url: checkoutSession.url,
    });
  } catch (error: any) {
    console.error("Checkout session error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create checkout session" },
      { status: 500 }
    );
  }
}

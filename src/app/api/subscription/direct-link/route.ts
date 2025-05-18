import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

// Get direct Stripe checkout URLs from environment variables
const STRIPE_URLS = {
  BASIC: process.env.STRIPE_BASIC,
  PRO: process.env.STRIPE_PRO,
  VIP: process.env.STRIPE_VIP,
};

export async function POST(req: Request) {
  try {
    // Verify authentication
    const session = await getServerSession();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Parse request body
    let body;
    try {
      body = await req.json();
    } catch (error) {
      console.error("Error parsing request body:", error);
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    const { plan } = body;
    
    if (!plan) {
      return NextResponse.json(
        { error: "Plan is required" },
        { status: 400 }
      );
    }

    // Validate plan
    if (!Object.keys(STRIPE_URLS).includes(plan)) {
      return NextResponse.json(
        { error: "Invalid subscription plan" },
        { status: 400 }
      );
    }

    // Get direct checkout URL
    const url = STRIPE_URLS[plan as keyof typeof STRIPE_URLS];

    if (!url) {
      console.error(`Missing URL for plan: ${plan}`);
      return NextResponse.json(
        { error: `No checkout URL configured for ${plan} plan` },
        { status: 500 }
      );
    }

    console.log(`Returning direct Stripe URL for ${plan}:`, url);

    // Return the URL
    return NextResponse.json({ url });
  } catch (error: any) {
    console.error("Error getting direct link:", error);
    return NextResponse.json(
      { error: error.message || "Failed to get checkout link" },
      { status: 500 }
    );
  }
} 
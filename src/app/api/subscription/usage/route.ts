import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { PLAN_LIMITS } from "@/middleware/subscription";
import { resolveSessionUser } from "@/lib/session-user";

export interface UsageData {
  plan: string;
  invoices: {
    used: number;
    limit: number;
    periodStart: string;
    periodEnd: string;
  };
  companies: {
    used: number;
    limit: number;
  };
  clients: {
    used: number;
    limit: number;
  };
  products: {
    used: number;
    limit: number;
  };
  users: {
    used: number;
    limit: number;
  };
  features: {
    customBranding: boolean;
    export: boolean | string;
    creditNotes: boolean;
    emailSending: boolean;
    apiAccess: boolean;
  };
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: "Неоторизиран достъп" },
        { status: 401 }
      );
    }

    const sessionUser = await resolveSessionUser(session.user);
    if (!sessionUser) {
      return NextResponse.json(
        { error: "Потребителят не е намерен" },
        { status: 404 }
      );
    }

    const userId = sessionUser.id;
    const supabase = createAdminClient();

    // Get user's subscription
    const { data: subscriptions } = await supabase
      .from("Subscription")
      .select("*")
      .eq("userId", userId)
      .in("status", ["ACTIVE", "TRIALING", "PAST_DUE"])
      .limit(1);

    const subscription = subscriptions && subscriptions.length > 0 ? subscriptions[0] : null;
    const plan = (subscription?.plan || "FREE") as keyof typeof PLAN_LIMITS;
    const limits = PLAN_LIMITS[plan];

    // Calculate period for invoice count (current month)
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const endOfMonth = new Date(startOfMonth);
    endOfMonth.setMonth(endOfMonth.getMonth() + 1);
    endOfMonth.setMilliseconds(-1);

    // Get invoice count for current month
    const { count: invoiceCount } = await supabase
      .from("Invoice")
      .select("*", { count: "exact", head: true })
      .eq("userId", userId)
      .gte("createdAt", startOfMonth.toISOString())
      .lt("createdAt", endOfMonth.toISOString());

    // Get company count
    const { count: companyCount } = await supabase
      .from("Company")
      .select("*", { count: "exact", head: true })
      .eq("userId", userId);

    // Get client count
    const { count: clientCount } = await supabase
      .from("Client")
      .select("*", { count: "exact", head: true })
      .eq("userId", userId);

    // Get product count
    const { count: productCount } = await supabase
      .from("Product")
      .select("*", { count: "exact", head: true })
      .eq("userId", userId);

    // Get user/team member count
    const { count: userCount } = await supabase
      .from("UserRole")
      .select("*", { count: "exact", head: true })
      .eq("userId", userId);

    const usageData: UsageData = {
      plan,
      invoices: {
        used: invoiceCount || 0,
        limit: limits.maxInvoicesPerMonth === Infinity ? -1 : limits.maxInvoicesPerMonth,
        periodStart: startOfMonth.toISOString(),
        periodEnd: endOfMonth.toISOString(),
      },
      companies: {
        used: companyCount || 0,
        limit: limits.maxCompanies === Infinity ? -1 : limits.maxCompanies,
      },
      clients: {
        used: clientCount || 0,
        limit: limits.maxClients === Infinity ? -1 : limits.maxClients,
      },
      products: {
        used: productCount || 0,
        limit: limits.maxProducts === Infinity ? -1 : limits.maxProducts,
      },
      users: {
        used: userCount || 1, // At least 1 (the owner)
        limit: limits.maxUsers,
      },
      features: {
        customBranding: limits.allowCustomBranding,
        export: limits.allowExport,
        creditNotes: limits.allowCreditNotes,
        emailSending: limits.allowEmailSending,
        apiAccess: limits.allowApiAccess,
      },
    };

    return NextResponse.json(usageData);
  } catch (error) {
    console.error("Error fetching usage data:", error);
    return NextResponse.json(
      { error: "Грешка при извличане на данните за използване" },
      { status: 500 }
    );
  }
}

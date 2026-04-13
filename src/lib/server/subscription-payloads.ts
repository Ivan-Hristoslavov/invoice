import { supabaseAdmin } from "@/lib/supabase";
import { createAdminClient } from "@/lib/supabase/server";
import { PLAN_LIMITS } from "@/middleware/subscription";
import type { ExportCapability } from "@/lib/subscription-plans";
import type { Subscription, UsageData } from "@/lib/subscription-types";

export async function getSubscriptionPayloadForUser(userId: string): Promise<Subscription | null> {
  const { data: subscription, error } = await supabaseAdmin
    .from("Subscription")
    .select(
      `
          id,
          plan,
          status,
          cancelAtPeriodEnd,
          currentPeriodEnd,
          stripeSubscriptionId,
          priceId,
          currentPeriodStart,
          createdAt,
          updatedAt
        `
    )
    .eq("userId", userId)
    .in("status", ["ACTIVE", "TRIALING", "PAST_DUE"])
    .order("createdAt", { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== "PGRST116") {
    throw new Error(`subscription fetch: ${error.message}`);
  }

  if (!subscription) {
    return {
      id: "free-plan",
      plan: "FREE",
      status: "ACTIVE",
      cancelAtPeriodEnd: false,
      currentPeriodEnd: null,
      paymentHistory: [],
      history: [],
    };
  }

  const { data: payments } = await supabaseAdmin
    .from("SubscriptionPayment")
    .select("*")
    .eq("subscriptionId", subscription.id)
    .order("createdAt", { ascending: false });

  const { data: statusHistory } = await supabaseAdmin
    .from("SubscriptionHistory")
    .select("*")
    .eq("subscriptionId", subscription.id)
    .order("createdAt", { ascending: false });

  const paymentHistory = (payments || []).map((p: Record<string, unknown>) => ({
    id: String(p.id),
    amount: Number(p.amount),
    currency: String(p.currency ?? ""),
    status: String(p.status ?? ""),
    createdAt: String(p.createdAt ?? ""),
  }));

  const history = (statusHistory || []).map((h: Record<string, unknown>) => ({
    id: String(h.id),
    status: String(h.status ?? ""),
    event: String(h.event ?? ""),
    createdAt: String(h.createdAt ?? ""),
  }));

  return {
    ...subscription,
    plan: subscription.plan as Subscription["plan"],
    paymentHistory,
    history,
  } as Subscription;
}

export async function getUsagePayloadForUser(userId: string): Promise<{
  usage: UsageData;
  plan: string;
}> {
  const supabase = createAdminClient();

  const { data: subscriptions } = await supabase
    .from("Subscription")
    .select("*")
    .eq("userId", userId)
    .in("status", ["ACTIVE", "TRIALING", "PAST_DUE"])
    .order("createdAt", { ascending: false })
    .limit(1);

  const subscription = subscriptions && subscriptions.length > 0 ? subscriptions[0] : null;
  const plan = (subscription?.plan || "FREE") as keyof typeof PLAN_LIMITS;
  const limits = PLAN_LIMITS[plan];

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const endOfMonth = new Date(startOfMonth);
  endOfMonth.setMonth(endOfMonth.getMonth() + 1);
  endOfMonth.setMilliseconds(-1);

  const { count: invoiceCount } = await supabase
    .from("Invoice")
    .select("*", { count: "exact", head: true })
    .eq("userId", userId)
    .gte("createdAt", startOfMonth.toISOString())
    .lt("createdAt", endOfMonth.toISOString());

  const { count: companyCount } = await supabase
    .from("Company")
    .select("*", { count: "exact", head: true })
    .eq("userId", userId);

  const { count: clientCount } = await supabase
    .from("Client")
    .select("*", { count: "exact", head: true })
    .eq("userId", userId);

  const { count: productCount } = await supabase
    .from("Product")
    .select("*", { count: "exact", head: true })
    .eq("userId", userId);

  const { data: ownedCompanies } = await supabase.from("Company").select("id").eq("userId", userId);

  const ownedCompanyIds = (ownedCompanies || []).map((company) => company.id);
  const { count: invitedMemberCount } =
    ownedCompanyIds.length > 0
      ? await supabase
          .from("UserRole")
          .select("*", { count: "exact", head: true })
          .in("companyId", ownedCompanyIds)
          .neq("role", "OWNER")
      : { count: 0 };

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
      used: Math.max(1, (invitedMemberCount || 0) + 1),
      limit: limits.maxUsers,
    },
    features: {
      customBranding: limits.allowCustomBranding,
      export: limits.allowExport as ExportCapability,
      creditNotes: limits.allowCreditNotes,
      emailSending: limits.allowEmailSending,
      apiAccess: limits.allowApiAccess,
      eikSearch: limits.allowEikSearch,
    },
  };

  return { usage: usageData, plan };
}

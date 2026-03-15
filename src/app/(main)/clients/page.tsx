import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { APP_NAME } from "@/config/constants";
import { createAdminClient } from "@/lib/supabase/server";
import { resolveSessionUser } from "@/lib/session-user";
import { getAccessibleOwnerUserIdsForUser } from "@/lib/team";
import { redirect } from "next/navigation";
import { PLAN_LIMITS } from "@/middleware/subscription";
import ClientsClient from "./ClientsClient";

export const metadata: Metadata = {
  title: `Клиенти | ${APP_NAME}`,
  description: "Управлявайте вашите клиенти",
};

export default async function ClientsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/signin");
  }

  const sessionUser = await resolveSessionUser(session.user);
  if (!sessionUser) {
    redirect("/signin");
  }

  const supabase = createAdminClient();
  const accessibleOwnerIds = await getAccessibleOwnerUserIdsForUser(sessionUser.id);

  // Fetch clients for all companies the user can access
  const { data: clients, error } = await supabase
    .from("Client")
    .select("*")
    .in("userId", accessibleOwnerIds)
    .order("name", { ascending: true });

  if (error) {
    console.error("Error fetching clients:", error);
  }

  const clientsList = clients || [];

  // Resolve creator names for "Created by" column
  const createdByIds = [...new Set((clientsList as { createdById?: string }[]).map((c) => c.createdById).filter(Boolean))] as string[];
  const createdByMap: Record<string, { name: string | null; email?: string | null }> = {};
  if (createdByIds.length > 0) {
    const { data: creators } = await supabase
      .from("User")
      .select("id, name, email")
      .in("id", createdByIds);
    for (const u of creators || []) {
      createdByMap[u.id] = { name: u.name ?? null, email: u.email ?? null };
    }
  }

  // Get invoice counts per client (invoices from accessible companies)
  const { data: invoiceCounts } = await supabase
    .from("Invoice")
    .select("clientId")
    .in("userId", accessibleOwnerIds);
  
  const clientInvoiceCounts = (invoiceCounts || []).reduce((acc: Record<string, number>, inv: any) => {
    acc[inv.clientId] = (acc[inv.clientId] || 0) + 1;
    return acc;
  }, {});

  // Get user's subscription plan
  const { data: subscriptions } = await supabase
    .from("Subscription")
    .select("*")
    .eq("userId", sessionUser.id)
    .in("status", ["ACTIVE", "TRIALING", "PAST_DUE"])
    .order("createdAt", { ascending: false })
    .limit(1);
  
  const subscription = subscriptions && subscriptions.length > 0 ? subscriptions[0] : null;
  const plan = (subscription?.plan || "FREE") as keyof typeof PLAN_LIMITS;
  const limits = PLAN_LIMITS[plan];
  const clientLimit = limits.maxClients === Infinity ? -1 : limits.maxClients;
  const canCreateClient = clientLimit === -1 || clientsList.length < clientLimit;
  const clientsRemaining = clientLimit === -1 ? Infinity : clientLimit - clientsList.length;
  const isApproachingLimit = clientLimit !== -1 && clientsRemaining > 0 && clientsRemaining <= 2;
  const isAtLimit = clientLimit !== -1 && clientsRemaining <= 0;

  return (
    <ClientsClient
      clients={clientsList}
      invoiceCounts={clientInvoiceCounts}
      plan={plan}
      clientLimit={clientLimit}
      canCreateClient={canCreateClient}
      clientsRemaining={clientsRemaining === Infinity ? -1 : clientsRemaining}
      isApproachingLimit={isApproachingLimit}
      isAtLimit={isAtLimit}
      createdByMap={createdByMap}
    />
  );
}

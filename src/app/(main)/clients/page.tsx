import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { APP_NAME } from "@/config/constants";
import { createAdminClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PLAN_LIMITS } from "@/middleware/subscription";
import ClientsClient from "./ClientsClient";

export const metadata: Metadata = {
  title: `Клиенти | ${APP_NAME}`,
  description: "Управлявайте вашите клиенти",
};

export default async function ClientsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/signin");
  }

  const supabase = createAdminClient();
  
  // Fetch clients
  const { data: clients, error } = await supabase
    .from("Client")
    .select("*")
    .eq("userId", session.user.id)
    .order("name", { ascending: true });
  
  if (error) {
    console.error("Error fetching clients:", error);
  }
  
  const clientsList = clients || [];

  // Get invoice counts per client
  const { data: invoiceCounts } = await supabase
    .from("Invoice")
    .select("clientId")
    .eq("userId", session.user.id);
  
  const clientInvoiceCounts = (invoiceCounts || []).reduce((acc: Record<string, number>, inv: any) => {
    acc[inv.clientId] = (acc[inv.clientId] || 0) + 1;
    return acc;
  }, {});

  // Get user's subscription plan
  const { data: subscriptions } = await supabase
    .from("Subscription")
    .select("*")
    .eq("userId", session.user.id)
    .in("status", ["ACTIVE", "TRIALING", "PAST_DUE"])
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
    />
  );
}

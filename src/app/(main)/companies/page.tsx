import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { APP_NAME } from "@/config/constants";
import { createAdminClient } from "@/lib/supabase/server";
import { resolveSessionUser } from "@/lib/session-user";
import { redirect } from "next/navigation";
import CompaniesClient from "./CompaniesClient";

export const metadata: Metadata = {
  title: `Компании | ${APP_NAME}`,
  description: "Управлявайте вашите компании",
};

export default async function CompaniesPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect("/signin");
  }

  const sessionUser = await resolveSessionUser(session.user);
  if (!sessionUser) {
    redirect("/signin");
  }

  const supabase = createAdminClient();
  
  // Fetch companies
  const { data: companies, error } = await supabase
    .from("Company")
    .select("*")
    .eq("userId", sessionUser.id)
    .order("name", { ascending: true });
  
  if (error) {
    console.error("Error fetching companies:", error);
  }
  
  const companiesList = companies || [];

  // Get invoice counts per company
  const { data: invoiceCounts } = await supabase
    .from("Invoice")
    .select("companyId")
    .eq("userId", sessionUser.id);
  
  const companyInvoiceCounts = (invoiceCounts || []).reduce((acc: Record<string, number>, inv: any) => {
    acc[inv.companyId] = (acc[inv.companyId] || 0) + 1;
    return acc;
  }, {});

  return (
    <CompaniesClient 
      companies={companiesList} 
      invoiceCounts={companyInvoiceCounts} 
    />
  );
}

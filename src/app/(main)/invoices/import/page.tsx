import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Metadata } from "next";
import InvoiceImportClient from "./InvoiceImportClient";
import { createAdminClient } from "@/lib/supabase/server";
import { checkPermission } from "@/lib/permissions";

export const metadata: Metadata = {
  title: "Import Invoices - Invoicy",
  description: "Import multiple invoices from a CSV file",
};

export default async function InvoiceImportPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect("/signin?callbackUrl=/invoices/import");
  }

  // Check if user has permission to create invoices
  const canCreateInvoices = await checkPermission("invoice:create");
  if (!canCreateInvoices) {
    redirect("/dashboard");
  }

  const supabase = createAdminClient();

  // Get clients for this user to populate the dropdown
  const { data: clients } = await supabase
    .from("Client")
    .select("id, name, email")
    .eq("userId", session.user.id)
    .order("name", { ascending: true });

  // Get companies for this user to populate the dropdown
  const { data: companies } = await supabase
    .from("Company")
    .select("id, name")
    .eq("userId", session.user.id)
    .order("name", { ascending: true });

  // Get products for this user to populate the dropdown
  const { data: products } = await supabase
    .from("Product")
    .select("id, name, price, taxRate")
    .eq("userId", session.user.id)
    .order("name", { ascending: true });

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Import Invoices</h1>
        <p className="text-muted-foreground mt-2">
          Upload a CSV file to bulk import multiple invoices
        </p>
      </div>
      
      <InvoiceImportClient 
        clients={clients || []}
        companies={companies || []}
        products={products || []}
      />
    </div>
  );
}

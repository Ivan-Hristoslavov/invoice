import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { resolveSessionUser } from "@/lib/session-user";
import { createAdminClient } from "@/lib/supabase/server";
import ProformaNewClient from "./proforma-new-client";

export default async function ProformaNewPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/signin");
  const sessionUser = await resolveSessionUser(session.user);
  if (!sessionUser) redirect("/signin");

  const supabase = createAdminClient();
  const [{ data: clients }, { data: companies }, { data: products }] = await Promise.all([
    supabase.from("Client").select("id,name").eq("userId", sessionUser.id).order("name"),
    supabase.from("Company").select("id,name").eq("userId", sessionUser.id).order("name"),
    supabase.from("Product").select("id,name,price,taxRate").eq("userId", sessionUser.id).order("name"),
  ]);

  return (
    <ProformaNewClient
      clients={clients || []}
      companies={companies || []}
      products={products || []}
    />
  );
}

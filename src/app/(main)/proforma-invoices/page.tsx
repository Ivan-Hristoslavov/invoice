import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { resolveSessionUser } from "@/lib/session-user";
import { createAdminClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ProformaInvoicesClient from "./proforma-invoices-client";

export default async function ProformaInvoicesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/signin");
  const sessionUser = await resolveSessionUser(session.user);
  if (!sessionUser) redirect("/signin");

  const supabase = createAdminClient();
  const { data: rows } = await supabase
    .from("ProformaInvoice")
    .select("*, client:Client(id,name)")
    .eq("userId", sessionUser.id)
    .order("issueDate", { ascending: false });

  return <ProformaInvoicesClient initialRows={rows || []} />;
}

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { resolveSessionUser } from "@/lib/session-user";
import { createAdminClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import InvoicesReportsClient from "./InvoicesReportsClient";

export default async function InvoicesReportsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/signin");
  }
  const sessionUser = await resolveSessionUser(session.user);
  if (!sessionUser) {
    redirect("/signin");
  }

  const supabase = createAdminClient();
  const { data: clients } = await supabase
    .from("Client")
    .select("id,name")
    .eq("userId", sessionUser.id)
    .order("name", { ascending: true });

  return <InvoicesReportsClient clients={clients || []} />;
}

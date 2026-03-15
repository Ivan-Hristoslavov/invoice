import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { checkPermission } from "@/lib/permissions";
import { resolveSessionUser } from "@/lib/session-user";
import InvoicesClient from "./InvoicesClient";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface Invoice {
  id: string;
  invoiceNumber: string;
  issueDate: Date;
  dueDate: Date;
  total: number;
  status: string;
  userId: string;
  client: {
    id: string;
    name: string;
    userId: string;
  };
}

export default async function InvoicesPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Достъпът е отказан</h2>
          <p className="text-muted-foreground mb-6">Моля, влезте в системата, за да имате достъп до фактурите</p>
          <Button asChild>
            <Link href="/signin">Вход</Link>
          </Button>
        </div>
      </div>
    );
  }

  const sessionUser = await resolveSessionUser(session.user);
  if (!sessionUser) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Сесията е невалидна</h2>
          <p className="text-muted-foreground mb-6">Моля, влезте отново, за да имате достъп до фактурите</p>
          <Button asChild>
            <Link href="/signin">Вход</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Check if user has permission to create invoices
  const canCreateInvoices = await checkPermission("invoice:create");

  const supabase = createAdminClient();

  // Fetch invoices (company scope)
  const { data: userInvoices } = await supabase
    .from("Invoice")
    .select("*, client:Client(*)")
    .eq("userId", sessionUser.id)
    .order("issueDate", { ascending: false });
  const invoices = userInvoices || [];

  // Resolve creator names for "Created by" column
  const createdByIds = [...new Set((invoices as { createdById?: string }[]).map((inv) => inv.createdById).filter(Boolean))] as string[];
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

  // Fetch clients and companies for export dialog
  const { data: clients } = await supabase
    .from("Client")
    .select("id, name")
    .eq("userId", sessionUser.id)
    .order("name", { ascending: true });

  const { data: companies } = await supabase
    .from("Company")
    .select("id, name")
    .eq("userId", sessionUser.id)
    .order("name", { ascending: true });

  return (
    <InvoicesClient
      initialInvoices={invoices.map((inv) => ({
        ...inv,
        issueDate: typeof inv.issueDate === "string" ? inv.issueDate : inv.issueDate,
        dueDate: typeof inv.dueDate === "string" ? inv.dueDate : inv.dueDate,
      }))}
      clients={clients || []}
      companies={companies || []}
      canCreateInvoices={canCreateInvoices}
      currentUserId={sessionUser.id}
      createdByMap={createdByMap}
    />
  );
} 
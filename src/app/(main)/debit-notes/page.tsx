import Link from "next/link";
import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { APP_NAME } from "@/config/constants";
import { createAdminClient } from "@/lib/supabase/server";
import { resolveSessionUser } from "@/lib/session-user";
import DebitNotesClient, { type DebitNoteListItem } from "./DebitNotesClient";
import { ListPageShell } from "@/components/list";

export const metadata: Metadata = {
  title: `Дебитни известия | ${APP_NAME}`,
  description: "Преглед на дебитни известия",
};

export default async function DebitNotesPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/signin");
  }

  const sessionUser = await resolveSessionUser(session.user);
  if (!sessionUser) {
    redirect("/signin");
  }

  const supabase = createAdminClient();

  const { data: debitNotesData, error } = await supabase
    .from("DebitNote")
    .select(
      `
      id,
      debitNoteNumber,
      issueDate,
      reason,
      subtotal,
      taxAmount,
      total,
      currency,
      invoiceId,
      clientId,
      companyId
    `
    )
    .eq("userId", sessionUser.id)
    .order("issueDate", { ascending: false });

  if (error) {
    console.error("Error fetching debit notes:", error);
  }

  const debitNotes: DebitNoteListItem[] = [];

  if (debitNotesData && debitNotesData.length > 0) {
    const invoiceIds = [...new Set(debitNotesData.map((dn) => dn.invoiceId).filter(Boolean))];
    const clientIds = [...new Set(debitNotesData.map((dn) => dn.clientId))];
    const companyIds = [...new Set(debitNotesData.map((dn) => dn.companyId))];

    const [invoicesResult, clientsResult, companiesResult] = await Promise.all([
      invoiceIds.length > 0
        ? supabase.from("Invoice").select("id, invoiceNumber").in("id", invoiceIds)
        : Promise.resolve({ data: [], error: null }),
      supabase.from("Client").select("id, name").in("id", clientIds),
      supabase.from("Company").select("id, name").in("id", companyIds),
    ]);

    const invoicesMap = new Map((invoicesResult.data || []).map((i) => [i.id, i]));
    const clientsMap = new Map((clientsResult.data || []).map((c) => [c.id, c]));
    const companiesMap = new Map((companiesResult.data || []).map((c) => [c.id, c]));

    for (const dn of debitNotesData) {
      debitNotes.push({
        ...dn,
        invoice: dn.invoiceId ? invoicesMap.get(dn.invoiceId) : undefined,
        client: clientsMap.get(dn.clientId),
        company: companiesMap.get(dn.companyId),
      });
    }
  }

  return (
    <ListPageShell
      className="min-w-0"
      title="Дебитни известия"
      description="Преглед на дебитни известия за доплащания при замяна на продукти"
      actions={
        <Button asChild className="btn-responsive">
          <Link href="/debit-notes/new" className="flex items-center whitespace-nowrap">
            <Plus className="mr-2 h-4 w-4" />
            Ново дебитно известие
          </Link>
        </Button>
      }
    >
      <DebitNotesClient debitNotes={debitNotes} />
    </ListPageShell>
  );
}

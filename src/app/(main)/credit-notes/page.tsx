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
import CreditNotesClient, { type CreditNoteListItem } from "./CreditNotesClient";

export const metadata: Metadata = {
  title: `Сторно документи | ${APP_NAME}`,
  description: "Преглед на сторно документи",
};

export default async function CreditNotesPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/signin");
  }

  const sessionUser = await resolveSessionUser(session.user);
  if (!sessionUser) {
    redirect("/signin");
  }

  const supabase = createAdminClient();

  const { data: creditNotesData, error } = await supabase
    .from("CreditNote")
    .select(
      `
      id,
      creditNoteNumber,
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
    console.error("Error fetching credit notes:", error);
  }

  const creditNotes: CreditNoteListItem[] = [];

  if (creditNotesData && creditNotesData.length > 0) {
    const invoiceIds = [
      ...new Set(creditNotesData.map((cn) => cn.invoiceId).filter((id): id is string => id !== null)),
    ];
    const clientIds = [
      ...new Set(creditNotesData.map((cn) => cn.clientId).filter((id): id is string => id !== null)),
    ];
    const companyIds = [
      ...new Set(creditNotesData.map((cn) => cn.companyId).filter((id): id is string => id !== null)),
    ];

    const [invoicesResult, clientsResult, companiesResult] = await Promise.all([
      invoiceIds.length > 0
        ? supabase.from("Invoice").select("id, invoiceNumber").in("id", invoiceIds)
        : Promise.resolve({ data: [], error: null }),
      clientIds.length > 0
        ? supabase.from("Client").select("id, name").in("id", clientIds)
        : Promise.resolve({ data: [], error: null }),
      companyIds.length > 0
        ? supabase.from("Company").select("id, name").in("id", companyIds)
        : Promise.resolve({ data: [], error: null }),
    ]);

    const invoicesMap = new Map((invoicesResult.data || []).map((i) => [i.id, i]));
    const clientsMap = new Map((clientsResult.data || []).map((c) => [c.id, c]));
    const companiesMap = new Map((companiesResult.data || []).map((c) => [c.id, c]));

    for (const cn of creditNotesData) {
      creditNotes.push({
        ...cn,
        invoice: cn.invoiceId ? invoicesMap.get(cn.invoiceId) : undefined,
        client: cn.clientId ? clientsMap.get(cn.clientId) : undefined,
        company: cn.companyId ? companiesMap.get(cn.companyId) : undefined,
      });
    }
  }

  return (
    <div className="app-page-shell min-w-0">
      <div className="page-header">
        <div className="min-w-0">
          <h1 className="page-title">Кредитни известия</h1>
          <p className="card-description mt-1">
            Преглед на издадени кредитни известия за отменени фактури
          </p>
        </div>
        <Button asChild className="btn-responsive">
          <Link href="/credit-notes/new" className="flex items-center whitespace-nowrap">
            <Plus className="mr-2 h-4 w-4" />
            Ново кредитно известие
          </Link>
        </Button>
      </div>

      <CreditNotesClient creditNotes={creditNotes} />
    </div>
  );
}

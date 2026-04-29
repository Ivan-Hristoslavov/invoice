import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { APP_NAME } from "@/config/constants";
import { createAdminClient } from "@/lib/supabase/server";
import { resolveSessionUser } from "@/lib/session-user";
import CreditNotesClient, { type CreditNoteListItem } from "./CreditNotesClient";
import { NewCreditNoteButton } from "./NewCreditNoteButton";
import { ListPageShell } from "@/components/list";

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
    <ListPageShell
      className="min-w-0"
      title="Кредитни известия"
      description="Преглед на издадени кредитни известия за отменени фактури"
      actions={<NewCreditNoteButton />}
    >
      <CreditNotesClient creditNotes={creditNotes} />
    </ListPageShell>
  );
}

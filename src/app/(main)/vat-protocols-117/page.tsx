import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { APP_NAME } from "@/config/constants";
import { createAdminClient } from "@/lib/supabase/server";
import { resolveSessionUser } from "@/lib/session-user";
import { getAccessibleCompaniesForUser } from "@/lib/team";
import { checkPermission } from "@/lib/permissions";
import { Plus } from "lucide-react";
import { LinkButton } from "@/components/dashboard/LinkButton";
import VatProtocols117Client, { type VatProtocol117ListItem } from "./VatProtocols117Client";

export const metadata: Metadata = {
  title: `Протоколи чл. 117 | ${APP_NAME}`,
  description: "Протоколи по чл. 117 от ЗДДС за самоначисляване на ДДС",
};

export default async function VatProtocols117Page() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/signin");
  }

  const sessionUser = await resolveSessionUser(session.user);
  if (!sessionUser) {
    redirect("/signin");
  }

  const supabase = createAdminClient();
  const accessibleCompanies = await getAccessibleCompaniesForUser(sessionUser.id);
  const accessibleCompanyIds = accessibleCompanies.map((c) => c.id);

  const { data: rows, error } =
    accessibleCompanyIds.length > 0
      ? await supabase
          .from("VatProtocol117")
          .select(
            `
      id,
      protocolNumber,
      issueDate,
      taxEventDate,
      scenario,
      subtotal,
      taxAmount,
      total,
      currency,
      clientId,
      companyId
    `
          )
          .in("companyId", accessibleCompanyIds)
          .order("issueDate", { ascending: false })
      : { data: [], error: null };

  if (error) {
    console.error("Error fetching VatProtocol117:", error);
  }

  const protocols: VatProtocol117ListItem[] = [];
  const canSendEmail = await checkPermission("invoice:send");

  if (rows && rows.length > 0) {
    const clientIds = [...new Set(rows.map((r) => r.clientId).filter(Boolean))] as string[];
    const companyIds = [...new Set(rows.map((r) => r.companyId).filter(Boolean))] as string[];

    const [clientsResult, companiesResult] = await Promise.all([
      clientIds.length > 0
        ? supabase.from("Client").select("id, name, email").in("id", clientIds)
        : Promise.resolve({ data: [], error: null }),
      companyIds.length > 0
        ? supabase.from("Company").select("id, name").in("id", companyIds)
        : Promise.resolve({ data: [], error: null }),
    ]);

    const clientsMap = new Map((clientsResult.data || []).map((c) => [c.id, c]));
    const companiesMap = new Map((companiesResult.data || []).map((c) => [c.id, c]));

    for (const r of rows) {
      protocols.push({
        ...r,
        client: r.clientId ? clientsMap.get(r.clientId) : undefined,
        company: r.companyId ? companiesMap.get(r.companyId) : undefined,
      });
    }
  }

  return (
    <div className="app-page-shell min-w-0">
      <div className="page-header">
        <div className="min-w-0">
          <h1 className="page-title">Протоколи по чл. 117 ЗДДС</h1>
          <p className="card-description mt-1">
            Документи за самоначисляване при доставки с изискуем от получателя ДДС
          </p>
        </div>
        <LinkButton
          href="/vat-protocols-117/new"
          linkClassName="flex items-center whitespace-nowrap"
          className="btn-responsive"
        >
          <Plus className="mr-2 h-4 w-4" />
          Нов протокол
        </LinkButton>
      </div>

      <VatProtocols117Client protocols={protocols} canSendEmail={canSendEmail} />
    </div>
  );
}

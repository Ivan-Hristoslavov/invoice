import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import {
  ClipboardList,
  Calendar,
  Building,
  Info,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { APP_NAME } from "@/config/constants";
import { createAdminClient } from "@/lib/supabase/server";
import { resolveSessionUser } from "@/lib/session-user";
import { getAccessibleCompaniesForUser } from "@/lib/team";
import { checkPermission } from "@/lib/permissions";
import { VatProtocol117DetailBackLink } from "@/components/vat-protocol-117/VatProtocol117DetailBackLink";
import { VatProtocol117DetailActions } from "@/components/vat-protocol-117/VatProtocol117DetailActions";
import { format } from "date-fns";
import { bg } from "date-fns/locale";
import { getVatProtocol117ScenarioLabel } from "@/lib/vat-protocol-117-scenarios";

export const metadata: Metadata = {
  title: `Протокол чл. 117 | ${APP_NAME}`,
  description: "Детайли за протокол по чл. 117 от ЗДДС",
};

interface ProtocolItem {
  id: string;
  description: string;
  quantity: string | number;
  unitPrice: string | number;
  taxRate: string | number;
  subtotal: string | number;
  taxAmount: string | number;
  total: string | number;
}

export default async function VatProtocol117DetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
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

  if (accessibleCompanyIds.length === 0) {
    notFound();
  }

  const { data: protocol, error } = await supabase
    .from("VatProtocol117")
    .select(`
      *,
      items:VatProtocol117Item(*)
    `)
    .eq("id", id)
    .in("companyId", accessibleCompanyIds)
    .single();

  if (error || !protocol) {
    notFound();
  }

  const canSendEmail = await checkPermission("invoice:send");

  const [clientResult, companyResult] = await Promise.all([
    supabase
      .from("Client")
      .select("id, name, email, phone, address, city, country, bulstatNumber, vatNumber, vatRegistrationNumber, mol")
      .eq("id", protocol.clientId)
      .maybeSingle(),
    supabase
      .from("Company")
      .select("id, name, email, phone, address, city, country, bulstatNumber, vatRegistrationNumber, mol")
      .eq("id", protocol.companyId)
      .maybeSingle(),
  ]);

  const client = clientResult.data;
  const company = companyResult.data;
  const currency = protocol.currency || "EUR";

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("bg-BG", { style: "currency", currency }).format(amount);

  return (
    <div className="mx-auto max-w-[1400px] px-4">
      <div className="mb-6 flex flex-col gap-4">
        <VatProtocol117DetailBackLink />

        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-xl font-bold">Протокол чл. 117 — {protocol.protocolNumber}</h1>
            <Badge className="border-teal-500/20 bg-teal-500/10 text-teal-700 dark:text-teal-400">
              <ClipboardList className="mr-1 h-3 w-3" />
              Издаден
            </Badge>
          </div>
          <VatProtocol117DetailActions
            protocolId={id}
            clientEmail={client?.email}
            canSendEmail={canSendEmail}
          />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="space-y-6 md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Info className="h-5 w-5" />
                Данни
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-muted-foreground">Сценарий</p>
                  <p className="font-medium">{getVatProtocol117ScenarioLabel(protocol.scenario)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Дата на протокол</p>
                  <p className="font-medium">
                    {format(new Date(protocol.issueDate), "d MMMM yyyy", { locale: bg })}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Данъчно събитие</p>
                  <p className="font-medium">
                    {format(new Date(protocol.taxEventDate), "d MMMM yyyy", { locale: bg })}
                  </p>
                </div>
                {protocol.placeOfIssue ? (
                  <div>
                    <p className="text-muted-foreground">Място на издаване</p>
                    <p className="font-medium">{protocol.placeOfIssue}</p>
                  </div>
                ) : null}
              </div>

              {(protocol.supplierInvoiceNumber || protocol.supplierInvoiceDate) && (
                <div className="rounded-lg border border-border/60 bg-muted/30 p-3">
                  <p className="text-xs font-medium text-muted-foreground">Фактура на доставчик</p>
                  <p className="mt-1">
                    № {protocol.supplierInvoiceNumber || "—"}
                    {protocol.supplierInvoiceDate
                      ? ` от ${format(new Date(protocol.supplierInvoiceDate), "d.MM.yyyy", { locale: bg })}`
                      : ""}
                  </p>
                </div>
              )}

              {protocol.legalBasisNote ? (
                <div>
                  <p className="text-muted-foreground">Правно основание / пояснение</p>
                  <p className="whitespace-pre-wrap">{protocol.legalBasisNote}</p>
                </div>
              ) : null}

              {protocol.notes ? (
                <div>
                  <p className="text-muted-foreground">Бележки</p>
                  <p className="whitespace-pre-wrap">{protocol.notes}</p>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Редове</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="pb-2 pr-2">Описание</th>
                      <th className="pb-2 pr-2 text-right">К-во</th>
                      <th className="pb-2 pr-2 text-right">Цена</th>
                      <th className="pb-2 pr-2 text-right">ДДС</th>
                      <th className="pb-2 text-right">Сума</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(protocol.items || []).map((item: ProtocolItem) => (
                      <tr key={item.id} className="border-b border-border/50">
                        <td className="py-2 pr-2">{item.description}</td>
                        <td className="py-2 pr-2 text-right">{Number(item.quantity)}</td>
                        <td className="py-2 pr-2 text-right">
                          {formatCurrency(Number(item.unitPrice))}
                        </td>
                        <td className="py-2 pr-2 text-right">{Number(item.taxRate)}%</td>
                        <td className="py-2 text-right font-medium">
                          {formatCurrency(Number(item.total))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Separator className="my-4" />
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Основа</span>
                  <span>{formatCurrency(Number(protocol.subtotal))}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ДДС</span>
                  <span>{formatCurrency(Number(protocol.taxAmount))}</span>
                </div>
                <div className="flex justify-between text-base font-semibold">
                  <span>Общо</span>
                  <span>{formatCurrency(Number(protocol.total))}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Building className="h-4 w-4" />
                Ваша фирма
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              {company ? (
                <>
                  <p className="font-medium">{company.name}</p>
                  {company.vatRegistrationNumber ? (
                    <p className="text-muted-foreground">ДДС: {company.vatRegistrationNumber}</p>
                  ) : null}
                  {company.bulstatNumber ? (
                    <p className="text-muted-foreground">ЕИК: {company.bulstatNumber}</p>
                  ) : null}
                </>
              ) : (
                <p className="text-muted-foreground">—</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Доставчик</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              {client ? (
                <>
                  <p className="font-medium">{client.name}</p>
                  {(client.vatRegistrationNumber || client.vatNumber) && (
                    <p className="text-muted-foreground">
                      ДДС: {client.vatRegistrationNumber || client.vatNumber}
                    </p>
                  )}
                </>
              ) : (
                <p className="text-muted-foreground">—</p>
              )}
            </CardContent>
          </Card>

          <Card className="border-dashed">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Calendar className="h-4 w-4" />
                НАП / е-фактури (бъдеще)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs text-muted-foreground">
              <p>
                Тук ще се показват данни за евентуално електронно подаване към НАП, ако в бъдеще
                бъдат въведени такива изисквания и за протоколи по чл. 117. Засега не се изисква
                действие от вас.
              </p>
              {protocol.uniqueNapId ? (
                <p className="text-foreground">
                  Идентификатор в системата на НАП:{" "}
                  <span className="font-mono break-all">{protocol.uniqueNapId}</span>
                </p>
              ) : null}
              {protocol.napStatus ? (
                <p className="text-foreground">Статус спрямо НАП: {protocol.napStatus}</p>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

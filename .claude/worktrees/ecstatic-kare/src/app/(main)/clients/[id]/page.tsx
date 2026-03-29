import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ArrowLeft, Building, Mail, Phone, Globe, FileText, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createAdminClient } from "@/lib/supabase/server";
import { resolveSessionUser } from "@/lib/session-user";
import { getAccessibleOwnerUserIdsForUser } from "@/lib/team";
import { format } from "date-fns";
import { Metadata } from "next";
import { APP_NAME } from "@/config/constants";
import { Badge } from "@/components/ui/badge";
import { normalizeInvoiceStatus } from "@/lib/invoice-status";

// Define the invoice status type
type InvoiceStatus = 'DRAFT' | 'ISSUED' | 'VOIDED' | 'CANCELLED';

// Define the invoice type
interface Invoice {
  id: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  status: InvoiceStatus;
  total: number;
  clientId: string;
  companyId: string;
  userId: string;
  subtotal: number;
  taxAmount: number;
  discount?: number;
  notes?: string;
  termsAndConditions?: string;
  currency: string;
  locale: string;
  createdAt: string;
  updatedAt: string;
}

// Generate dynamic metadata
export async function generateMetadata(props: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await props.params;
  const client = await getClient(id);
  
  if (!client) {
    return {
      title: `Клиентът не е намерен | ${APP_NAME}`,
    };
  }
  
  return {
    title: `${client.name} | ${APP_NAME}`,
    description: `Преглед и управление на профила и фактурите на ${client.name}`,
  };
}

// Helper function to get client data
async function getClient(id: string) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return null;
  }

  const sessionUser = await resolveSessionUser(session.user);
  if (!sessionUser) {
    return null;
  }
  
  const supabase = createAdminClient();
  const accessibleOwnerIds = await getAccessibleOwnerUserIdsForUser(sessionUser.id);
  const { data: client, error } = await supabase
    .from("Client")
    .select("*")
    .eq("id", id)
    .in("userId", accessibleOwnerIds)
    .single();
  
  if (error || !client) {
    return null;
  }
  
  return client;
}

export default async function ClientDetailPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Достъпът е отказан</h2>
          <p className="text-muted-foreground mb-6">Моля, влезте в системата, за да имате достъп до детайлите на клиента</p>
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
          <p className="text-muted-foreground mb-6">Моля, влезте отново, за да имате достъп до детайлите на клиента</p>
          <Button asChild>
            <Link href="/signin">Вход</Link>
          </Button>
        </div>
      </div>
    );
  }
  
  const client = await getClient(params.id);

  if (!client) {
    notFound();
  }

  const supabase = createAdminClient();
  const accessibleOwnerIds = await getAccessibleOwnerUserIdsForUser(sessionUser.id);

  // Resolve creator name for "Created by"
  let createdByName: string | null = null;
  const createdById = (client as { createdById?: string }).createdById;
  if (createdById) {
    const { data: creator } = await supabase
      .from("User")
      .select("name")
      .eq("id", createdById)
      .single();
    createdByName = creator?.name ?? null;
  }
  
  // Get client's invoices (from accessible companies)
  const { data: invoices } = await supabase
    .from("Invoice")
    .select("*")
    .eq("clientId", client.id)
    .in("userId", accessibleOwnerIds)
    .order("issueDate", { ascending: false })
    .limit(5);
  
  const invoiceList = (invoices || []) as Invoice[];
  
  // Calculate stats
  const totalInvoices = invoiceList.length;
  const issuedInvoices = invoiceList.filter((inv) => inv.status === 'ISSUED').length;
  const totalAmount = invoiceList.reduce((sum, inv) => sum + Number(inv.total), 0);
  const issuedAmount = invoiceList
    .filter((inv) => inv.status === 'ISSUED')
    .reduce((sum, inv) => sum + Number(inv.total), 0);

  const localeLabel =
    client.locale === "en"
      ? "Английски"
      : client.locale === "bg"
        ? "Български"
        : client.locale === "es"
          ? "Испански"
          : client.locale === "fr"
            ? "Френски"
            : client.locale === "de"
              ? "Немски"
              : client.locale;
  
  return (
    <div className="app-page-shell">
      <div className="rounded-2xl border border-border/60 bg-card/70 p-4 shadow-sm backdrop-blur">
        <div className="page-header">
          <div className="space-y-3">
            <Button variant="ghost" size="sm" asChild className="h-9 rounded-full px-3">
              <Link href="/clients" className="flex items-center whitespace-nowrap">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Назад към клиентите
              </Link>
            </Button>

            <div className="space-y-2">
              <h1 className="page-title">{client.name}</h1>
              <div className="flex flex-wrap gap-2">
                {client.bulstatNumber && <Badge variant="outline">ЕИК: {client.bulstatNumber}</Badge>}
                {client.vatRegistrationNumber && (
                  <Badge className="border-emerald-500/20 bg-emerald-500/10 text-emerald-600">
                    ДДС: {client.vatRegistrationNumber}
                  </Badge>
                )}
                <Badge variant="secondary">Език: {localeLabel}</Badge>
              </div>
            </div>
          </div>

          <div className="app-page-actions">
            <Button variant="outline" size="sm" asChild className="btn-responsive whitespace-nowrap">
              <Link href={`/clients/${client.id}/edit`} className="flex items-center whitespace-nowrap">
                <Edit className="mr-2 h-4 w-4" />
                Редактиране
              </Link>
            </Button>
            <Button size="sm" asChild className="btn-responsive whitespace-nowrap">
              <Link href={`/invoices/new?client=${client.id}`} className="flex items-center whitespace-nowrap">
                <FileText className="mr-2 h-4 w-4" />
                Нова фактура
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_340px]">
        <div className="space-y-4">
          <Card className="border-border/60 shadow-sm">
            <CardHeader className="space-y-1 pb-3">
              <Badge variant="info" className="mb-2 w-fit">
                Профил
              </Badge>
              <CardTitle>Информация за клиента</CardTitle>
              <CardDescription>Контакти, адрес и данъчни детайли в по-подреден вид.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-border/60 bg-background/60 p-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Контакт</p>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-2">
                    <Mail className="mt-0.5 h-4 w-4 text-muted-foreground" />
                    <span>{client.email || "Няма имейл"}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Phone className="mt-0.5 h-4 w-4 text-muted-foreground" />
                    <span>{client.phone || "Няма телефон"}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Building className="mt-0.5 h-4 w-4 text-muted-foreground" />
                    <span>{client.mol || "Няма посочен МОЛ"}</span>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-border/60 bg-background/60 p-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Адрес</p>
                <div className="space-y-2 text-sm">
                  <p>{client.address || "Няма адрес"}</p>
                  <p>{[client.city, client.state, client.zipCode].filter(Boolean).join(", ") || "Няма град/област"}</p>
                  <div className="flex items-start gap-2">
                    <Globe className="mt-0.5 h-4 w-4 text-muted-foreground" />
                    <span>{client.country || "Няма държава"}</span>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-border/60 bg-background/60 p-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Данъчни данни</p>
                <div className="space-y-2 text-sm">
                  <p><span className="text-muted-foreground">ДДС номер:</span> {client.vatNumber || client.vatRegistrationNumber || "Няма"}</p>
                  <p><span className="text-muted-foreground">Данъчен номер:</span> {client.taxIdNumber || "Няма"}</p>
                  <p><span className="text-muted-foreground">ЕИК:</span> {client.bulstatNumber || "Няма"}</p>
                </div>
              </div>

              <div className="rounded-2xl border border-border/60 bg-background/60 p-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Предпочитания</p>
                <div className="space-y-2 text-sm">
                  <p><span className="text-muted-foreground">Език:</span> {localeLabel}</p>
                  {createdByName && (
                    <p><span className="text-muted-foreground">Създадена от:</span> {createdByName}</p>
                  )}
                  <p><span className="text-muted-foreground">Статус:</span> Активен клиент</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-sm">
            <CardHeader className="space-y-1 pb-3">
              <Badge variant="secondary" className="mb-2 w-fit">
                История
              </Badge>
              <CardTitle>Последни фактури</CardTitle>
              <CardDescription>Най-новите документи за този клиент.</CardDescription>
            </CardHeader>
            <CardContent>
              {invoiceList.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border/70 bg-background/40 px-4 py-8 text-center">
                  <p className="text-sm text-muted-foreground">Все още няма фактури за този клиент.</p>
                  <Button size="sm" asChild className="mt-4 rounded-full px-4">
                    <Link href={`/invoices/new?client=${client.id}`} className="flex items-center whitespace-nowrap">
                      <FileText className="mr-2 h-4 w-4" />
                      Създаване на фактура
                    </Link>
                  </Button>
                </div>
              ) : (
                <>
                  <div className="space-y-3 md:hidden">
                    {invoiceList.map((invoice) => (
                      <Link
                        key={invoice.id}
                        href={`/invoices/${invoice.id}`}
                        className="block rounded-2xl border border-border/60 bg-background/60 p-4 transition-colors hover:bg-muted/30"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-xs uppercase tracking-wide text-muted-foreground">Фактура</p>
                            <p className="mt-1 truncate font-semibold text-primary">{invoice.invoiceNumber}</p>
                          </div>
                          <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${getStatusStyles(invoice.status)}`}>
                            {getStatusText(invoice.status)}
                          </span>
                        </div>
                        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <p className="text-xs uppercase tracking-wide text-muted-foreground">Дата</p>
                            <p className="mt-1 font-medium">{format(new Date(invoice.issueDate), "dd.MM.yyyy")}</p>
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-wide text-muted-foreground">Сума</p>
                            <p className="mt-1 font-semibold">{Number(invoice.total).toFixed(2)} €</p>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                  <div className="hidden overflow-x-auto md:block">
                    <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border/50">
                        <th className="px-2 pb-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Фактура</th>
                        <th className="px-2 pb-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Дата</th>
                        <th className="px-2 pb-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Сума</th>
                        <th className="px-2 pb-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Статус</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoiceList.map((invoice) => (
                        <tr key={invoice.id} className="border-b border-border/40 transition-colors hover:bg-muted/40">
                          <td className="px-2 py-3">
                            <Link href={`/invoices/${invoice.id}`} className="font-medium text-primary hover:underline">
                              {invoice.invoiceNumber}
                            </Link>
                          </td>
                          <td className="px-2 py-3">{format(new Date(invoice.issueDate), "dd.MM.yyyy")}</td>
                          <td className="px-2 py-3">{Number(invoice.total).toFixed(2)} €</td>
                          <td className="px-2 py-3">
                            <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${getStatusStyles(invoice.status)}`}>
                              {getStatusText(invoice.status)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    </table>
                  </div>
                </>
              )}

              {invoiceList.length > 0 && (
                <div className="mt-4 flex justify-end">
                  <Button size="sm" variant="outline" asChild className="rounded-full px-4">
                    <Link href={`/invoices?client=${client.id}`} className="flex items-center whitespace-nowrap">
                      Преглед на всички
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="border-border/60 shadow-sm">
            <CardHeader className="space-y-1 pb-3">
              <Badge variant="success" className="mb-2 w-fit">
                Обобщение
              </Badge>
              <CardTitle>Обобщение</CardTitle>
              <CardDescription>Кратък поглед върху работата с този клиент.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-background/60 p-4">
                <p className="text-sm font-medium text-muted-foreground">Общо фактури</p>
                <p className="text-2xl font-semibold">{totalInvoices}</p>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-background/60 p-4">
                <p className="text-sm font-medium text-muted-foreground">Издадени</p>
                <p className="text-2xl font-semibold text-emerald-600">{issuedInvoices}</p>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-background/60 p-4">
                <p className="text-sm font-medium text-muted-foreground">Обща сума</p>
                <p className="text-2xl font-semibold">{totalAmount.toFixed(2)} €</p>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-background/60 p-4">
                <p className="text-sm font-medium text-muted-foreground">Издадена стойност</p>
                <p className="text-2xl font-semibold text-emerald-600">{issuedAmount.toFixed(2)} €</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function getStatusStyles(status: InvoiceStatus) {
  switch (normalizeInvoiceStatus(status)) {
    case "ISSUED":
      return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400";
    case "DRAFT":
      return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400";
    case "VOIDED":
      return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400";
    case "CANCELLED":
      return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400";
  }
}

function getStatusText(status: InvoiceStatus) {
  switch (normalizeInvoiceStatus(status)) {
    case "ISSUED":
      return "Издадена";
    case "DRAFT":
      return "Чернова";
    case "VOIDED":
      return "Анулирана";
    case "CANCELLED":
      return "Отказана";
    default:
      return status;
  }
}

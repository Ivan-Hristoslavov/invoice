import Link from "next/link";
import {
  FileText,
  Building,
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  ArrowUpRight,
  Activity,
  Hash,
  Inbox,
  Receipt,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Calendar,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LinkButton } from "@/components/dashboard/LinkButton";
import { format, formatDistanceToNow, differenceInDays } from "date-fns";
import { bg } from "date-fns/locale";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { DashboardQuickActions } from "@/components/dashboard/DashboardQuickActions";
import { AppSectionKicker } from "@/components/app/AppSectionKicker";
import { normalizeInvoiceStatus, type AppInvoiceStatus } from "@/lib/invoice-status";
import {
  getDashboardShell,
  getDashboardBody,
  type InvoiceRow,
  type CreditNoteRow,
  type DebitNoteRow,
} from "./load-dashboard-data";
import { DashboardRevenueChart } from "@/components/dashboard/DashboardRevenueChart";

const actionLabels: Record<string, string> = {
  CREATE: "Нова",
  UPDATE: "Обнови",
  ISSUE: "Издаде",
  CANCEL: "Отмени",
  VOID: "Анулира",
  SEND: "Изпрати",
  EXPORT: "Експортира",
  DELETE: "Изтри",
  MARK_PAID: "Платена",
  MARK_UNPAID: "Неплатена",
};

const entityLabels: Record<string, string> = {
  INVOICE: "фактура",
  CREDIT_NOTE: "кредитно известие",
  DEBIT_NOTE: "дебитно известие",
  CLIENT: "клиент",
  COMPANY: "компания",
  PRODUCT: "продукт",
};

interface InvoiceWithClient {
  id: string;
  invoiceNumber: string;
  issueDate: Date;
  dueDate: Date;
  total: number;
  status: AppInvoiceStatus;
  client: { id: string; name: string };
  company: { id: string; name: string };
}

export async function DashboardMainSection({
  userId,
  sessionUserDisplayName,
}: {
  userId: string;
  sessionUserDisplayName: string;
}) {
  const [shell, body] = await Promise.all([getDashboardShell(userId), getDashboardBody(userId)]);

  const recentInvoices: InvoiceWithClient[] = body.recentInvoicesData.map((inv: InvoiceRow) => {
    const client = body.mergedClientsMap.get(inv.clientId);
    return {
      id: inv.id,
      invoiceNumber: inv.invoiceNumber,
      issueDate: new Date(inv.issueDate),
      dueDate: new Date(inv.dueDate),
      total: Number(inv.total),
      status: normalizeInvoiceStatus(inv.status),
      client: {
        id: client?.id || inv.clientId,
        name: client?.name || "Неизвестен клиент",
      },
      company: {
        id: inv.companyId,
        name: body.mergedCompaniesMap.get(inv.companyId)?.name || "Неизвестна компания",
      },
    };
  });

  const stats = [
    {
      title: "Обща стойност",
      value: body.totalIssued.toFixed(2),
      currency: "€",
      description: "От издадени фактури",
      iconName: "euro",
      trend: body.totalTrend.text,
      trendUp: body.totalTrend.up,
      gradient: "from-emerald-500 to-teal-600",
      bgGradient: "from-emerald-500/10 via-emerald-500/5 to-transparent",
      iconBg: "bg-emerald-500/20",
    },
    {
      title: "Този месец",
      value: body.thisMonthTotal.toFixed(2),
      currency: "€",
      description: `${body.thisMonthInvoicesLen} ${body.thisMonthInvoicesLen === 1 ? "фактура" : "фактури"}`,
      iconName: "calendar",
      trend: body.thisMonthTotalTrend.text,
      trendUp: body.thisMonthTotalTrend.up,
      gradient: "from-blue-500 to-indigo-600",
      bgGradient: "from-blue-500/10 via-blue-500/5 to-transparent",
      iconBg: "bg-blue-500/20",
    },
    {
      title: "Фактури",
      value: body.counts.total.toString(),
      currency: "",
      description: `${body.counts.issued} издадени, ${body.counts.draft} чернови`,
      iconName: "fileText",
      trend: body.countTrend.text,
      trendUp: body.countTrend.up,
      gradient: "from-violet-500 to-purple-600",
      bgGradient: "from-violet-500/10 via-violet-500/5 to-transparent",
      iconBg: "bg-violet-500/20",
    },
    {
      title: "Клиенти",
      value: (shell.clientCount || 0).toString(),
      currency: "",
      description: "Активни клиенти",
      iconName: "users",
      trend: body.clientTrend.text,
      trendUp: body.clientTrend.up,
      gradient: "from-amber-500 to-orange-600",
      bgGradient: "from-amber-500/10 via-amber-500/5 to-transparent",
      iconBg: "bg-amber-500/20",
    },
  ];

  const { mergedClientsMap, mergedCompaniesMap, auditInvoicesMap, noteInvoiceMap } = body;
  const { today, topOverdue, overdueCount, overdueTotal } = body;
  const { recentCreditNotes, recentDebitNotes, creditNoteCount, debitNoteCount } = body;
  const { auditLogs } = body;

  return (
    <>
      <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
        {stats.map((stat) => (
          <StatsCard
            key={stat.title}
            title={stat.title}
            value={parseFloat(stat.value) || 0}
            currency={stat.currency}
            description={stat.description}
            iconName={stat.iconName}
            trend={stat.trend}
            trendUp={stat.trendUp}
            gradient={stat.gradient}
            bgGradient={stat.bgGradient}
            iconBg={stat.iconBg}
            decimals={stat.currency === "€" ? 2 : 0}
          />
        ))}
      </div>

      <div className="grid gap-4 sm:gap-5 lg:grid-cols-3">
        <DashboardQuickActions hasInvoiceWorkspaceSetup={shell.hasInvoiceWorkspaceSetup} />

        <Card className="relative overflow-hidden lg:col-span-2 border border-border/50 shadow-md">
          <div
            className="absolute left-0 right-0 top-0 h-[3px] bg-linear-to-r from-emerald-500 via-teal-500 to-cyan-500"
            aria-hidden
          />
          <CardHeader className="flex flex-row items-center justify-between px-3 pb-3 pt-4 sm:px-6 sm:pb-4 sm:pt-6">
            <div className="min-w-0 flex-1 space-y-2">
              <AppSectionKicker icon={Inbox}>Последни записи</AppSectionKicker>
              <CardTitle className="card-title">Последни фактури</CardTitle>
              <CardDescription className="card-description">
                Най-новите документи към клиентите ви
              </CardDescription>
            </div>
            <LinkButton
              href="/invoices"
              linkClassName="flex items-center gap-1"
              variant="ghost"
              size="sm"
              className="tiny-text shrink-0"
            >
              <span className="hidden sm:inline">Всички</span>
              <ArrowUpRight className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            </LinkButton>
          </CardHeader>
          <CardContent className="px-3 pb-3 sm:px-5 sm:pb-5">
            {recentInvoices.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 text-center sm:py-16">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-border/60 bg-muted/60 shadow-inner">
                  <FileText className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="mb-1 text-lg font-semibold">Все още няма фактури</p>
                <p className="mb-6 max-w-xs text-sm text-muted-foreground">
                  Създайте първата за минути и започнете да проследявате какво ви дължат
                </p>
                <LinkButton
                  href="/invoices/new"
                  linkClassName="flex items-center whitespace-nowrap"
                  size="sm"
                  className="shadow-md"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Нова фактура
                </LinkButton>
              </div>
            ) : (
              <div className="space-y-2.5">
                {recentInvoices.map((invoice) => (
                  <Link
                    key={invoice.id}
                    href={`/invoices/${invoice.id}`}
                    className="group flex items-center gap-3 rounded-xl border border-border/50 bg-muted/20 p-3 transition-all duration-200 hover:bg-muted/50 sm:gap-4"
                  >
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-background ${
                        invoice.status === "ISSUED"
                          ? "text-emerald-600"
                          : invoice.status === "DRAFT"
                            ? "text-amber-600"
                            : "text-red-600"
                      }`}
                    >
                      {invoice.status === "ISSUED" ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : invoice.status === "DRAFT" ? (
                        <Clock className="h-4 w-4" />
                      ) : (
                        <XCircle className="h-4 w-4" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground sm:text-xs">
                        <Building className="h-3 w-3 text-muted-foreground/80" />
                        <span className="truncate">От: {invoice.company.name}</span>
                      </p>
                      <p className="flex items-center gap-1.5 font-semibold text-sm text-foreground">
                        <Hash className="h-3.5 w-3.5 text-muted-foreground/90" />
                        <span className="truncate">{invoice.invoiceNumber}</span>
                      </p>
                      <p className="hidden text-[11px] text-muted-foreground sm:block truncate">
                        {invoice.client.name}
                      </p>
                    </div>
                    <div className="min-w-0 text-right space-y-1">
                      <p
                        className={`inline-flex items-center justify-end rounded-full px-2 py-0.5 text-[10px] font-medium sm:text-xs ${
                          invoice.status === "ISSUED"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                            : invoice.status === "DRAFT"
                              ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                              : "bg-red-500/10 text-red-400 border border-red-500/30"
                        }`}
                      >
                        {invoice.status === "ISSUED"
                          ? "Издадена"
                          : invoice.status === "DRAFT"
                            ? "Чернова"
                            : "Отказана"}
                      </p>
                      <p className="font-bold text-sm leading-tight">{invoice.total.toFixed(2)} €</p>
                      <p className="text-[11px] text-muted-foreground sm:text-xs leading-tight">
                        {format(invoice.issueDate, "d MMM yyyy", { locale: bg })}
                      </p>
                    </div>
                    <Eye className="hidden h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 sm:block" />
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 sm:gap-5 lg:grid-cols-3">
        <Card className="relative overflow-hidden lg:col-span-1 border border-border/50 shadow-md">
          <div
            className="absolute left-0 right-0 top-0 h-[3px] bg-linear-to-r from-orange-500 via-red-500 to-rose-500"
            aria-hidden
          />
          <CardHeader className="pb-3 px-3 pt-4 sm:px-6 sm:pt-6">
            <div className="space-y-2">
              <AppSectionKicker icon={AlertTriangle}>Внимание</AppSectionKicker>
              <CardTitle className="card-title">Просрочени фактури</CardTitle>
              <CardDescription className="card-description">
                {overdueCount > 0
                  ? `${overdueCount} ${overdueCount === 1 ? "фактура" : "фактури"} за ${overdueTotal.toFixed(2)} €`
                  : "Всичко е наред — няма просрочени"}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="px-3 pb-3 sm:px-6 sm:pb-6">
            {overdueCount === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                  <CheckCircle className="h-6 w-6 text-emerald-500" />
                </div>
                <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Няма просрочия</p>
              </div>
            ) : (
              <div className="space-y-2">
                {topOverdue.map((inv) => {
                  const days = differenceInDays(today, new Date(inv.dueDate));
                  const clientName = mergedClientsMap.get(inv.clientId)?.name || "—";
                  return (
                    <Link
                      key={inv.id}
                      href={`/invoices/${inv.id}`}
                      className="group flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/5 p-2.5 transition-all hover:bg-red-500/10"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-500/15 text-red-600 dark:text-red-400">
                        <Clock className="h-3.5 w-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium">{clientName}</p>
                        <p className="text-[11px] text-red-600 dark:text-red-400">
                          {days} {days === 1 ? "ден" : "дни"} просрочие
                        </p>
                      </div>
                      <p className="shrink-0 text-xs font-bold whitespace-nowrap">
                        {Number(inv.total).toFixed(2)} €
                      </p>
                    </Link>
                  );
                })}
                {overdueCount > 5 && (
                  <LinkButton
                    href="/invoices?status=OVERDUE"
                    linkClassName="flex items-center justify-center gap-1"
                    variant="ghost"
                    size="sm"
                    className="w-full text-xs text-red-600 hover:text-red-700"
                  >
                    Виж всички {overdueCount} просрочени
                    <ArrowUpRight className="ml-1 h-3 w-3" />
                  </LinkButton>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden lg:col-span-2 border border-border/50 shadow-md">
          <div
            className="absolute left-0 right-0 top-0 h-[3px] bg-linear-to-r from-rose-500 via-red-500 to-orange-500"
            aria-hidden
          />
          <CardHeader className="flex flex-row items-center justify-between pb-3 px-3 pt-4 sm:px-6 sm:pt-6">
            <div className="min-w-0 flex-1 space-y-2">
              <AppSectionKicker icon={Receipt}>Финансови документи</AppSectionKicker>
              <CardTitle className="card-title">Последни известия</CardTitle>
              <CardDescription className="card-description">
                {creditNoteCount || 0} кредитни, {debitNoteCount || 0} дебитни известия
              </CardDescription>
            </div>
            <div className="flex gap-1.5">
              <LinkButton
                href="/credit-notes"
                linkClassName="flex items-center gap-1"
                variant="ghost"
                size="sm"
                className="tiny-text shrink-0"
              >
                <span className="hidden sm:inline">Кредитни</span>
                <ArrowUpRight className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              </LinkButton>
              <LinkButton
                href="/debit-notes"
                linkClassName="flex items-center gap-1"
                variant="ghost"
                size="sm"
                className="tiny-text shrink-0"
              >
                <span className="hidden sm:inline">Дебитни</span>
                <ArrowUpRight className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              </LinkButton>
            </div>
          </CardHeader>
          <CardContent className="px-3 pb-3 sm:px-5 sm:pb-5">
            {(recentCreditNotes?.length || 0) === 0 && (recentDebitNotes?.length || 0) === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-border/60 bg-muted/60 shadow-inner">
                  <Receipt className="h-7 w-7 text-muted-foreground" />
                </div>
                <p className="mb-1 text-sm font-semibold">Няма известия</p>
                <p className="text-xs text-muted-foreground max-w-xs">
                  Кредитните и дебитните известия ще се показват тук
                </p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 pb-1">
                    <div className="h-6 w-6 rounded-md bg-linear-to-br from-red-500 to-rose-600 flex items-center justify-center">
                      <TrendingDown className="h-3 w-3 text-white" />
                    </div>
                    <p className="text-xs font-semibold">Кредитни</p>
                    <span className="ml-auto text-[11px] text-muted-foreground">{creditNoteCount || 0}</span>
                  </div>
                  {(recentCreditNotes || []).length === 0 ? (
                    <p className="py-3 text-center text-xs text-muted-foreground">Няма</p>
                  ) : (
                    (recentCreditNotes || []).map((note: CreditNoteRow) => (
                      <Link
                        key={note.id}
                        href="/credit-notes"
                        className="group flex items-center gap-2.5 rounded-lg border border-border/40 bg-muted/15 p-2.5 transition-all hover:bg-muted/40"
                      >
                        <div className="min-w-0 flex-1 space-y-0.5">
                          <p className="truncate text-xs font-medium">{note.creditNoteNumber}</p>
                          <p className="truncate text-[11px] text-muted-foreground">
                            {note.invoiceId ? `Към ф-ра ${noteInvoiceMap.get(note.invoiceId) || "—"}` : "Без фактура"}
                            {" · "}
                            {format(new Date(note.issueDate), "d MMM", { locale: bg })}
                          </p>
                        </div>
                        <p className="shrink-0 text-xs font-bold text-red-600 dark:text-red-400 whitespace-nowrap">
                          -{Number(note.total).toFixed(2)} {note.currency === "BGN" ? "лв" : "€"}
                        </p>
                      </Link>
                    ))
                  )}
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 pb-1">
                    <div className="h-6 w-6 rounded-md bg-linear-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                      <TrendingUp className="h-3 w-3 text-white" />
                    </div>
                    <p className="text-xs font-semibold">Дебитни</p>
                    <span className="ml-auto text-[11px] text-muted-foreground">{debitNoteCount || 0}</span>
                  </div>
                  {(recentDebitNotes || []).length === 0 ? (
                    <p className="py-3 text-center text-xs text-muted-foreground">Няма</p>
                  ) : (
                    (recentDebitNotes || []).map((note: DebitNoteRow) => (
                      <Link
                        key={note.id}
                        href="/debit-notes"
                        className="group flex items-center gap-2.5 rounded-lg border border-border/40 bg-muted/15 p-2.5 transition-all hover:bg-muted/40"
                      >
                        <div className="min-w-0 flex-1 space-y-0.5">
                          <p className="truncate text-xs font-medium">{note.debitNoteNumber}</p>
                          <p className="truncate text-[11px] text-muted-foreground">
                            {note.invoiceId ? `Към ф-ра ${noteInvoiceMap.get(note.invoiceId) || "—"}` : "Без фактура"}
                            {" · "}
                            {format(new Date(note.issueDate), "d MMM", { locale: bg })}
                          </p>
                        </div>
                        <p className="shrink-0 text-xs font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                          +{Number(note.total).toFixed(2)} {note.currency === "BGN" ? "лв" : "€"}
                        </p>
                      </Link>
                    ))
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 sm:gap-5 lg:grid-cols-3">
        <Card className="relative overflow-hidden lg:col-span-3 border border-border/50 shadow-md">
          <div
            className="absolute left-0 right-0 top-0 h-[3px] bg-linear-to-r from-violet-500 via-indigo-500 to-blue-500"
            aria-hidden
          />
          <CardHeader className="flex flex-row items-center justify-between pb-3 px-3 pt-4 sm:px-6 sm:pt-6">
            <div className="min-w-0 flex-1 space-y-2">
              <AppSectionKicker icon={Activity}>Проследяване</AppSectionKicker>
              <CardTitle className="card-title">Последна активност</CardTitle>
              <CardDescription className="card-description">Скорошни действия в акаунта ви</CardDescription>
            </div>
            <LinkButton
              href="/settings/audit-logs"
              linkClassName="flex items-center gap-1"
              variant="ghost"
              size="sm"
              className="tiny-text shrink-0"
            >
              <span className="hidden sm:inline">Всички</span>
              <ArrowUpRight className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            </LinkButton>
          </CardHeader>
          <CardContent>
            {!auditLogs || auditLogs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 text-center sm:py-16">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-border/60 bg-muted/60 shadow-inner">
                  <Activity className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="mb-1 text-lg font-semibold">Няма активност</p>
                <p className="text-sm text-muted-foreground max-w-xs">Тук ще се показват последните ви действия</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {auditLogs.map((log) => {
                  const actionLabel = actionLabels[log.action] || log.action;
                  const entityLabel = entityLabels[log.entityType] || log.entityType;
                  const timeAgo = formatDistanceToNow(new Date(log.createdAt), {
                    addSuffix: true,
                    locale: bg,
                  });
                  const relatedInvoice =
                    log.entityType === "INVOICE" && log.entityId ? auditInvoicesMap.get(log.entityId) : null;
                  const relatedCompany =
                    log.entityType === "COMPANY" && log.entityId ? mergedCompaniesMap.get(log.entityId) : null;
                  const relatedClient =
                    log.entityType === "CLIENT" && log.entityId ? mergedClientsMap.get(log.entityId) : null;

                  const contextText = relatedInvoice
                    ? `\u2116 ${relatedInvoice.invoiceNumber} • ${relatedInvoice.companyName} • ${relatedInvoice.clientName}`
                    : relatedCompany
                      ? relatedCompany.name
                      : relatedClient
                        ? relatedClient.name
                        : null;

                  return (
                    <div
                      key={log.id}
                      className="flex items-center gap-3 rounded-xl border border-border/50 bg-muted/20 p-3"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-background border border-border/60">
                        {log.action === "CREATE" && <Plus className="h-4 w-4 text-emerald-600" />}
                        {log.action === "UPDATE" && <FileText className="h-4 w-4 text-blue-600" />}
                        {log.action === "ISSUE" && <CheckCircle className="h-4 w-4 text-emerald-600" />}
                        {log.action === "CANCEL" && <XCircle className="h-4 w-4 text-red-600" />}
                        {log.action === "VOID" && <XCircle className="h-4 w-4 text-orange-600" />}
                        {log.action === "SEND" && <ArrowUpRight className="h-4 w-4 text-violet-600" />}
                        {log.action === "EXPORT" && <FileText className="h-4 w-4 text-amber-600" />}
                        {log.action === "DELETE" && <XCircle className="h-4 w-4 text-red-600" />}
                        {(log.action === "MARK_PAID" || log.action === "MARK_UNPAID") && (
                          <Calendar className="h-4 w-4 text-sky-600" />
                        )}
                        {![
                          "CREATE",
                          "UPDATE",
                          "ISSUE",
                          "CANCEL",
                          "VOID",
                          "SEND",
                          "EXPORT",
                          "DELETE",
                          "MARK_PAID",
                          "MARK_UNPAID",
                        ].includes(log.action) && <Activity className="h-4 w-4 text-muted-foreground" />}
                      </div>
                      <div className="min-w-0 flex-1 flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm leading-5">
                            <span className="font-medium">{actionLabel}</span>{" "}
                            <span className="text-muted-foreground">{entityLabel}</span>
                          </p>
                          {relatedInvoice ? (
                            <div className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                              <p className="truncate">
                                {"\u2116"}: {relatedInvoice.invoiceNumber}
                              </p>
                              <p className="truncate">От: {sessionUserDisplayName}</p>
                            </div>
                          ) : contextText ? (
                            <p className="mt-1 truncate text-xs text-muted-foreground">{contextText}</p>
                          ) : null}
                        </div>
                        <div className="flex flex-col items-end gap-1 text-[11px] text-muted-foreground">
                          {relatedInvoice && (
                            <>
                              <span
                                className={`rounded-full px-2 py-0.5 font-medium ${
                                  relatedInvoice.status === "ISSUED"
                                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                                    : relatedInvoice.status === "DRAFT"
                                      ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                                      : "bg-red-500/10 text-red-400 border border-red-500/30"
                                }`}
                              >
                                {relatedInvoice.status === "ISSUED"
                                  ? "Издадена"
                                  : relatedInvoice.status === "DRAFT"
                                    ? "Чернова"
                                    : "Отказана"}
                              </span>
                              <span className="font-semibold text-foreground whitespace-nowrap">
                                {Number(relatedInvoice.total).toFixed(2)} €
                              </span>
                            </>
                          )}
                          <p className="whitespace-nowrap">{timeAgo}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <DashboardRevenueChart
        anchorMs={body.today.getTime()}
        rows={body.statsRows.map((r) => ({
          issueDate: r.issueDate,
          total: Number(r.total || 0),
          status: r.status,
        }))}
      />
    </>
  );
}

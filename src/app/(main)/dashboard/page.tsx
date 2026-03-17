import Link from "next/link";
import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { 
  FileText, 
  Users,
  Building,
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  MoreHorizontal,
  Sparkles,
  ArrowUpRight,
  MinusCircle,
  PlusCircle,
  Activity,
  Hash,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { APP_NAME } from "@/config/constants";
import { createAdminClient } from "@/lib/supabase/server";
import { resolveSessionUser } from "@/lib/session-user";
import { format, formatDistanceToNow } from "date-fns";
import { bg } from "date-fns/locale";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { DashboardQuickActions } from "@/components/dashboard/DashboardQuickActions";
import { isIssuedLikeStatus, normalizeInvoiceStatus, type AppInvoiceStatus } from "@/lib/invoice-status";
import { InvoiceWorkspaceSetup } from "@/components/invoice/InvoiceWorkspaceSetup";

export const metadata: Metadata = {
  title: `Табло | ${APP_NAME}`,
  description: "Управлявайте вашия акаунт и прегледайте вашето табло",
};

interface InvoiceWithClient {
  id: string;
  invoiceNumber: string;
  issueDate: Date;
  dueDate: Date;
  total: number;
  status: AppInvoiceStatus;
  client: {
    id: string;
    name: string;
  };
  company: {
    id: string;
    name: string;
  };
}

const actionLabels: Record<string, string> = {
  CREATE: "Нова",
  UPDATE: "Обнови",
  CANCEL: "Отмени",
  SEND: "Изпрати",
  EXPORT: "Експортира",
  DELETE: "Изтри",
};

const entityLabels: Record<string, string> = {
  INVOICE: "фактура",
  CREDIT_NOTE: "кредитно известие",
  DEBIT_NOTE: "дебитно известие",
  CLIENT: "клиент",
  COMPANY: "компания",
  PRODUCT: "продукт",
};

function calcTrend(current: number, previous: number): { text: string; up: boolean } {
  if (previous === 0) {
    return current > 0 ? { text: "+100%", up: true } : { text: "Нов", up: true };
  }
  const pct = ((current - previous) / previous) * 100;
  const sign = pct >= 0 ? "+" : "";
  return { text: `${sign}${pct.toFixed(1)}%`, up: pct >= 0 };
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect("/signin");
  }

  const sessionUser = await resolveSessionUser(session.user);
  if (!sessionUser) {
    redirect("/signin");
  }
  
  const sessionUserDisplayName =
    (sessionUser as any).name ??
    (sessionUser.email ? sessionUser.email.split("@")[0] : "—");

  const supabase = createAdminClient();
  
  // Get recent invoices
  const { data: recentInvoicesData } = await supabase
    .from("Invoice")
    .select("id, invoiceNumber, issueDate, dueDate, total, status, clientId, companyId")
    .eq("userId", sessionUser.id)
    .order("issueDate", { ascending: false })
    .limit(5);
  
  // Get client data for the invoices
  interface InvoiceRow { id: string; invoiceNumber: string; issueDate: string; dueDate: string; total: number; status: string; clientId: string; companyId: string; createdAt?: string; }
  interface ClientRow { id: string; name: string; }
  interface CompanyRow { id: string; name: string; }

  const clientIds = [...new Set((recentInvoicesData || []).map((inv: InvoiceRow) => inv.clientId))];
  const companyIds = [...new Set((recentInvoicesData || []).map((inv: InvoiceRow) => inv.companyId))];
  const { data: clientsData } = await supabase
    .from("Client")
    .select("id, name")
    .in("id", clientIds.length > 0 ? clientIds : ['']);
  const { data: companiesData } = await supabase
    .from("Company")
    .select("id, name")
    .in("id", companyIds.length > 0 ? companyIds : ['']);
  
  const clientsMap = new Map((clientsData || []).map((c: ClientRow) => [c.id, c]));
  const companiesMap = new Map((companiesData || []).map((c: CompanyRow) => [c.id, c]));
  
  const recentInvoices: InvoiceWithClient[] = (recentInvoicesData || []).map((inv: InvoiceRow) => {
    const client = clientsMap.get(inv.clientId);
    return {
      id: inv.id,
      invoiceNumber: inv.invoiceNumber,
      issueDate: new Date(inv.issueDate),
      dueDate: new Date(inv.dueDate),
      total: Number(inv.total),
      status: normalizeInvoiceStatus(inv.status),
      client: {
        id: client?.id || inv.clientId,
        name: client?.name || 'Неизвестен клиент'
      },
      company: {
        id: inv.companyId,
        name: companiesMap.get(inv.companyId)?.name || "Неизвестна компания",
      }
    };
  });
  
  // Get all invoices for stats (minimal fields)
  interface InvoiceStatsRow { id: string; status: string; total: number; createdAt: string; }
  const { data: allInvoices } = await supabase
    .from("Invoice")
    .select("id, status, total, createdAt")
    .eq("userId", sessionUser.id);
  
  const statsRows: InvoiceStatsRow[] = allInvoices || [];

  // Calculate invoice counts
  const invoiceCounts = statsRows.reduce((acc: Record<string, number>, invoice: InvoiceStatsRow) => {
    const status = normalizeInvoiceStatus(invoice.status);
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<AppInvoiceStatus, number>);
  
  const counts = {
    total: statsRows.length,
    issued: invoiceCounts.ISSUED || 0,
    draft: invoiceCounts.DRAFT || 0,
    cancelled: invoiceCounts.CANCELLED || 0,
  };
  
  // Get total from issued invoices
  const issuedInvoices = statsRows.filter((inv: InvoiceStatsRow) => isIssuedLikeStatus(inv.status));
  const totalIssued = issuedInvoices.reduce((sum: number, inv: InvoiceStatsRow) => sum + Number(inv.total || 0), 0);
  
  // Current month boundaries
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  
  const thisMonthInvoices = statsRows.filter(
    (inv: InvoiceStatsRow) => new Date(inv.createdAt) >= startOfMonth
  );
  const thisMonthTotal = thisMonthInvoices
    .filter((inv: InvoiceStatsRow) => isIssuedLikeStatus(inv.status))
    .reduce((sum: number, inv: InvoiceStatsRow) => sum + Number(inv.total || 0), 0);

  // Previous month invoices for trend calculation
  const prevMonthInvoices = statsRows.filter(
    (inv: InvoiceStatsRow) => {
      const d = new Date(inv.createdAt);
      return d >= startOfPrevMonth && d < startOfMonth;
    }
  );
  const prevMonthTotal = prevMonthInvoices
    .filter((inv: InvoiceStatsRow) => isIssuedLikeStatus(inv.status))
    .reduce((sum: number, inv: InvoiceStatsRow) => sum + Number(inv.total || 0), 0);
  const prevMonthIssuedTotal = prevMonthInvoices
    .filter((inv: InvoiceStatsRow) => isIssuedLikeStatus(inv.status))
    .reduce((sum: number, inv: InvoiceStatsRow) => sum + Number(inv.total || 0), 0);

  // Overall issued total trend (current month issued vs prev month issued)
  const currentMonthIssuedTotal = thisMonthInvoices
    .filter((inv: InvoiceStatsRow) => isIssuedLikeStatus(inv.status))
    .reduce((sum: number, inv: InvoiceStatsRow) => sum + Number(inv.total || 0), 0);
  const totalTrend = calcTrend(currentMonthIssuedTotal, prevMonthIssuedTotal);

  // This month total trend
  const thisMonthTotalTrend = calcTrend(thisMonthTotal, prevMonthTotal);

  // Invoice count trend
  const thisMonthCount = thisMonthInvoices.length;
  const prevMonthCount = prevMonthInvoices.length;
  const countTrend = calcTrend(thisMonthCount, prevMonthCount);
  
  // Client counts and trend
  const { count: clientCount } = await supabase
    .from("Client")
    .select("*", { count: "exact", head: true })
    .eq("userId", sessionUser.id);

  const { count: clientsThisMonth } = await supabase
    .from("Client")
    .select("*", { count: "exact", head: true })
    .eq("userId", sessionUser.id)
    .gte("createdAt", startOfMonth.toISOString());

  const { count: clientsPrevMonth } = await supabase
    .from("Client")
    .select("*", { count: "exact", head: true })
    .eq("userId", sessionUser.id)
    .gte("createdAt", startOfPrevMonth.toISOString())
    .lt("createdAt", startOfMonth.toISOString());

  const clientTrend = calcTrend(clientsThisMonth || 0, clientsPrevMonth || 0);

  const { count: companyCount } = await supabase
    .from("Company")
    .select("*", { count: "exact", head: true })
    .eq("userId", sessionUser.id);

  // Credit note & debit note counts
  const { count: creditNoteCount } = await supabase
    .from("CreditNote")
    .select("*", { count: "exact", head: true })
    .eq("userId", sessionUser.id);

  const { count: debitNoteCount } = await supabase
    .from("DebitNote")
    .select("*", { count: "exact", head: true })
    .eq("userId", sessionUser.id);

  // Audit log (last 5 entries)
  const { data: auditLogs } = await supabase
    .from("AuditLog")
    .select("id, action, entityType, entityId, createdAt")
    .eq("userId", sessionUser.id)
    .order("createdAt", { ascending: false })
    .limit(5);

  const auditInvoiceIds = [...new Set((auditLogs || [])
    .filter((log: { entityType: string; entityId?: string }) => log.entityType === "INVOICE" && log.entityId)
    .map((log: { entityId?: string }) => log.entityId as string))];
  const auditCompanyIds = [...new Set((auditLogs || [])
    .filter((log: { entityType: string; entityId?: string }) => log.entityType === "COMPANY" && log.entityId)
    .map((log: { entityId?: string }) => log.entityId as string))];
  const auditClientIds = [...new Set((auditLogs || [])
    .filter((log: { entityType: string; entityId?: string }) => log.entityType === "CLIENT" && log.entityId)
    .map((log: { entityId?: string }) => log.entityId as string))];

  const { data: auditInvoicesData } = auditInvoiceIds.length > 0
    ? await supabase
        .from("Invoice")
        .select("id, invoiceNumber, clientId, companyId, total, status")
        .in("id", auditInvoiceIds)
        .eq("userId", sessionUser.id)
    : { data: [] as Array<{ id: string; invoiceNumber: string; clientId: string; companyId: string; total: number; status: string }> };

  const auditInvoiceClientIds = [...new Set((auditInvoicesData || []).map((invoice) => invoice.clientId).filter(Boolean))];
  const auditInvoiceCompanyIds = [...new Set((auditInvoicesData || []).map((invoice) => invoice.companyId).filter(Boolean))];

  const mergedClientIds = [...new Set([...clientIds, ...auditClientIds, ...auditInvoiceClientIds])];
  const mergedCompanyIds = [...new Set([...companyIds, ...auditCompanyIds, ...auditInvoiceCompanyIds])];

  const { data: mergedClientsData } = await supabase
    .from("Client")
    .select("id, name")
    .in("id", mergedClientIds.length > 0 ? mergedClientIds : [""]);
  const { data: mergedCompaniesData } = await supabase
    .from("Company")
    .select("id, name")
    .in("id", mergedCompanyIds.length > 0 ? mergedCompanyIds : [""]);

  const mergedClientsMap = new Map((mergedClientsData || []).map((client: ClientRow) => [client.id, client]));
  const mergedCompaniesMap = new Map((mergedCompaniesData || []).map((company: CompanyRow) => [company.id, company]));
  const auditInvoicesMap = new Map(
    (auditInvoicesData || []).map((invoice) => [
      invoice.id,
      {
        ...invoice,
        clientName: mergedClientsMap.get(invoice.clientId)?.name || "Неизвестен клиент",
        companyName: mergedCompaniesMap.get(invoice.companyId)?.name || "Неизвестна компания",
      },
    ])
  );

  const stats = [
    {
      title: "Обща стойност",
      value: totalIssued.toFixed(2),
      currency: "€",
      description: "От издадени фактури",
      iconName: "euro",
      trend: totalTrend.text,
      trendUp: totalTrend.up,
      gradient: "from-emerald-500 to-teal-600",
      bgGradient: "from-emerald-500/10 via-emerald-500/5 to-transparent",
      iconBg: "bg-emerald-500/20"
    },
    {
      title: "Този месец",
      value: thisMonthTotal.toFixed(2),
      currency: "€",
      description: `${thisMonthInvoices.length} ${thisMonthInvoices.length === 1 ? 'фактура' : 'фактури'}`,
      iconName: "calendar",
      trend: thisMonthTotalTrend.text,
      trendUp: thisMonthTotalTrend.up,
      gradient: "from-blue-500 to-indigo-600",
      bgGradient: "from-blue-500/10 via-blue-500/5 to-transparent",
      iconBg: "bg-blue-500/20"
    },
    {
      title: "Фактури",
      value: counts.total.toString(),
      currency: "",
      description: `${counts.issued} издадени, ${counts.draft} чернови`,
      iconName: "fileText",
      trend: countTrend.text,
      trendUp: countTrend.up,
      gradient: "from-violet-500 to-purple-600",
      bgGradient: "from-violet-500/10 via-violet-500/5 to-transparent",
      iconBg: "bg-violet-500/20"
    },
    {
      title: "Клиенти",
      value: (clientCount || 0).toString(),
      currency: "",
      description: "Активни клиенти",
      iconName: "users",
      trend: clientTrend.text,
      trendUp: clientTrend.up,
      gradient: "from-amber-500 to-orange-600",
      bgGradient: "from-amber-500/10 via-amber-500/5 to-transparent",
      iconBg: "bg-amber-500/20"
    }
  ];

  const hasCompanies = (companyCount || 0) > 0;
  const hasClients = (clientCount || 0) > 0;
  const hasInvoiceWorkspaceSetup = hasCompanies && hasClients;

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Header */}
      <div className="page-header">
        <div className="flex-1 min-w-0">
          <h1 className="page-title">Табло</h1>
          <p className="card-description mt-1">
            Ето преглед на фактурите и дейностите ви
          </p>
        </div>
        <Button 
          asChild 
          size="2" 
          variant="solid" 
          color="green"
          className="shadow-lg hover:shadow-xl transition-shadow btn-responsive"
        >
          <Link href={hasInvoiceWorkspaceSetup ? "/invoices/new" : "/invoices"} className="flex items-center whitespace-nowrap">
            <Plus className="mr-1.5 h-4 w-4" />
            <span className="hidden sm:inline">
              {hasInvoiceWorkspaceSetup ? "Нова фактура" : "Настрой фактуриране"}
            </span>
            <span className="sm:hidden">
              {hasInvoiceWorkspaceSetup ? "Нова" : "Старт"}
            </span>
          </Link>
        </Button>
      </div>

      {!hasInvoiceWorkspaceSetup && (
        <InvoiceWorkspaceSetup
          hasCompanies={hasCompanies}
          hasClients={hasClients}
          title="Стъпки за първа фактура"
          description="Добавете фирма и клиент веднъж — след това всяка нова фактура е с няколко клика."
        />
      )}

      {/* Stats Grid */}
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

      {/* Quick Actions & Recent Invoices */}
      <div className="grid gap-4 sm:gap-5 lg:grid-cols-3">
        {/* Quick Actions - only show when usage loaded and user is allowed */}
        <DashboardQuickActions hasInvoiceWorkspaceSetup={hasInvoiceWorkspaceSetup} />

        {/* Recent Invoices */}
        <Card className="lg:col-span-2 border border-border/50 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between px-3 pb-3 pt-3 sm:px-6 sm:pb-4 sm:pt-6">
            <div className="min-w-0 flex-1">
              <Badge variant="info" className="mb-2">
                Последни записи
              </Badge>
              <CardTitle className="card-title">Последни фактури</CardTitle>
              <CardDescription className="card-description">Най-новите фактури</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild className="tiny-text shrink-0">
              <Link href="/invoices" className="flex items-center gap-1">
                <span className="hidden sm:inline">Всички</span>
                <ArrowUpRight className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="px-3 pb-3 sm:px-5 sm:pb-5">
            {recentInvoices.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                  <FileText className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="mb-1 text-lg font-semibold">Все още няма фактури</p>
                <p className="mb-6 max-w-xs text-sm text-muted-foreground">
                  Създайте първата за минути и започнете да проследявате какво ви дължат
                </p>
                <Button size="sm" asChild className="shadow-md">
                  <Link href="/invoices/new" className="flex items-center whitespace-nowrap">
                    <Plus className="mr-2 h-4 w-4" />
                    Нова фактура
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {recentInvoices.map((invoice) => (
                  <Link
                    key={invoice.id}
                    href={`/invoices/${invoice.id}`}
                    className="group flex items-center gap-3 rounded-xl border border-border/50 bg-muted/20 p-3 transition-all duration-200 hover:bg-muted/50 sm:gap-4"
                  >
                    {/* Icon: left middle */}
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-background ${
                      invoice.status === 'ISSUED'
                        ? 'text-emerald-600'
                        : invoice.status === 'DRAFT'
                        ? 'text-amber-600'
                        : 'text-red-600'
                    }`}>
                      {invoice.status === 'ISSUED' ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : invoice.status === 'DRAFT' ? (
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
                      <p className="font-bold text-sm leading-tight">
                        {invoice.total.toFixed(2)} €
                      </p>
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

      {/* Summary counts + Activity */}
      <div className="grid gap-4 sm:gap-5 lg:grid-cols-3">
        {/* Credit & Debit Note Summary */}
        <Card className="lg:col-span-1 border border-border/50 shadow-md">
          <CardHeader className="pb-3 px-3 sm:px-6 pt-3 sm:pt-6">
            <Badge variant="warning" className="mb-2">
              Финансови документи
            </Badge>
            <CardTitle className="card-title">Известия</CardTitle>
            <CardDescription className="card-description">Кредитни и дебитни известия</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 px-3 sm:px-6 pb-3 sm:pb-6">
            <Link
              href="/credit-notes"
              className="flex items-center justify-between p-3 rounded-xl bg-muted/30 hover:bg-muted/50 border border-border/50 transition-all duration-200 group"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-linear-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-xs">
                  <MinusCircle className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="small-text font-medium">Кредитни известия</p>
                  <p className="tiny-text text-muted-foreground">{creditNoteCount || 0} общо</p>
                </div>
              </div>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
            <Link
              href="/debit-notes"
              className="flex items-center justify-between p-3 rounded-xl bg-muted/30 hover:bg-muted/50 border border-border/50 transition-all duration-200 group"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-linear-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-xs">
                  <PlusCircle className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="small-text font-medium">Дебитни известия</p>
                  <p className="tiny-text text-muted-foreground">{debitNoteCount || 0} общо</p>
                </div>
              </div>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
          </CardContent>
        </Card>

        {/* Recent Activity (Audit Log) */}
        <Card className="lg:col-span-2 border border-border/50 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-3 px-3 sm:px-6 pt-3 sm:pt-6">
            <div className="min-w-0 flex-1">
              <Badge variant="secondary" className="mb-2">
                Проследяване
              </Badge>
              <CardTitle className="card-title">Последна активност</CardTitle>
              <CardDescription className="card-description">Скорошни действия в системата</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild className="tiny-text shrink-0">
              <Link href="/settings/audit-logs" className="flex items-center gap-1">
                <span className="hidden sm:inline">Всички</span>
                <ArrowUpRight className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {!auditLogs || auditLogs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                  <Activity className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="mb-1 text-lg font-semibold">Няма активност</p>
                <p className="text-sm text-muted-foreground max-w-xs">
                  Тук ще се показват последните ви действия
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                  {auditLogs.map((log: { id: string; action: string; entityType: string; entityId?: string; createdAt: string }) => {
                    const actionLabel = actionLabels[log.action] || log.action;
                    const entityLabel = entityLabels[log.entityType] || log.entityType;
                    const timeAgo = formatDistanceToNow(new Date(log.createdAt), {
                      addSuffix: true,
                      locale: bg,
                    });
                    const relatedInvoice = log.entityType === "INVOICE" && log.entityId
                      ? auditInvoicesMap.get(log.entityId)
                      : null;
                    const relatedCompany = log.entityType === "COMPANY" && log.entityId
                      ? mergedCompaniesMap.get(log.entityId)
                      : null;
                    const relatedClient = log.entityType === "CLIENT" && log.entityId
                      ? mergedClientsMap.get(log.entityId)
                      : null;

                    const contextText = relatedInvoice
                      ? `№ ${relatedInvoice.invoiceNumber} • ${relatedInvoice.companyName} • ${relatedInvoice.clientName}`
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
                          {log.action === "CANCEL" && <XCircle className="h-4 w-4 text-red-600" />}
                          {log.action === "SEND" && <ArrowUpRight className="h-4 w-4 text-violet-600" />}
                          {log.action === "EXPORT" && <FileText className="h-4 w-4 text-amber-600" />}
                          {log.action === "DELETE" && <XCircle className="h-4 w-4 text-red-600" />}
                          {!["CREATE", "UPDATE", "CANCEL", "SEND", "EXPORT", "DELETE"].includes(log.action) && (
                            <Activity className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1 flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm leading-5">
                              <span className="font-medium">{actionLabel}</span>{" "}
                              <span className="text-muted-foreground">
                                {entityLabel}
                              </span>
                            </p>
                            {relatedInvoice ? (
                              <div className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                                <p className="truncate">
                                  №: {relatedInvoice.invoiceNumber}
                                </p>
                                <p className="truncate">
                                  От: {sessionUserDisplayName}
                                </p>
                              </div>
                            ) : contextText ? (
                              <p className="mt-1 truncate text-xs text-muted-foreground">
                                {contextText}
                              </p>
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
    </div>
  );
}

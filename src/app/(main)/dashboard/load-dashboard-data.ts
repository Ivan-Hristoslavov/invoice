import { cache } from "react";
import { createAdminClient } from "@/lib/supabase/server";
import { isIssuedLikeStatus, normalizeInvoiceStatus, type AppInvoiceStatus } from "@/lib/invoice-status";

export interface InvoiceRow {
  id: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  total: number;
  status: string;
  clientId: string;
  companyId: string;
  createdAt?: string;
}

export interface ClientRow {
  id: string;
  name: string;
}

export interface CompanyRow {
  id: string;
  name: string;
}

export interface InvoiceStatsRow {
  id: string;
  status: string;
  total: number;
  createdAt: string;
  issueDate: string;
  dueDate: string;
  clientId: string;
}

export interface CreditNoteRow {
  id: string;
  creditNoteNumber: string;
  issueDate: string;
  total: number;
  currency: string;
  invoiceId: string | null;
  clientId: string | null;
}

export interface DebitNoteRow {
  id: string;
  debitNoteNumber: string;
  issueDate: string;
  total: number;
  currency: string;
  invoiceId: string | null;
  clientId: string | null;
}

export function calcTrend(current: number, previous: number): { text: string; up: boolean } {
  if (previous === 0) {
    return current > 0 ? { text: "+100%", up: true } : { text: "Нов", up: true };
  }
  const pct = ((current - previous) / previous) * 100;
  const sign = pct >= 0 ? "+" : "";
  return { text: `${sign}${pct.toFixed(1)}%`, up: pct >= 0 };
}

/** Бързи2 заявки за хедър и CTA преди тежкото тяло (Suspense). */
export const getDashboardShell = cache(async (userId: string) => {
  const supabase = createAdminClient();
  const [companiesRes, clientsRes] = await Promise.all([
    supabase.from("Company").select("*", { count: "exact", head: true }).eq("userId", userId),
    supabase.from("Client").select("*", { count: "exact", head: true }).eq("userId", userId),
  ]);
  const companyCount = companiesRes.count ?? 0;
  const clientCount = clientsRes.count ?? 0;
  return {
    companyCount,
    clientCount,
    hasCompanies: companyCount > 0,
    hasClients: clientCount > 0,
    hasInvoiceWorkspaceSetup: companyCount > 0 && clientCount > 0,
  };
});

export type DashboardShell = Awaited<ReturnType<typeof getDashboardShell>>;

export interface DashboardBody {
  statsRows: InvoiceStatsRow[];
  recentInvoicesData: InvoiceRow[];
  recentCreditNotes: CreditNoteRow[] | null;
  recentDebitNotes: DebitNoteRow[] | null;
  creditNoteCount: number | null;
  debitNoteCount: number | null;
  clientsThisMonth: number | null;
  clientsPrevMonth: number | null;
  auditLogs: Array<{
    id: string;
    action: string;
    entityType: string;
    entityId?: string;
    createdAt: string;
  }> | null;
  noteInvoiceMap: Map<string, string>;
  mergedClientsMap: Map<string, ClientRow>;
  mergedCompaniesMap: Map<string, CompanyRow>;
  auditInvoicesMap: Map<
    string,
    {
      id: string;
      invoiceNumber: string;
      clientId: string;
      companyId: string;
      total: number;
      status: string;
      clientName: string;
      companyName: string;
    }
  >;
  invoiceCounts: Record<AppInvoiceStatus, number>;
  counts: { total: number; issued: number; draft: number; cancelled: number };
  totalIssued: number;
  thisMonthTotal: number;
  currentMonthIssuedTotal: number;
  prevMonthIssuedTotal: number;
  thisMonthTotalTrend: { text: string; up: boolean };
  totalTrend: { text: string; up: boolean };
  countTrend: { text: string; up: boolean };
  thisMonthInvoicesLen: number;
  overdueCount: number;
  overdueTotal: number;
  topOverdue: InvoiceStatsRow[];
  today: Date;
  clientTrend: { text: string; up: boolean };
}

export const getDashboardBody = cache(async (userId: string): Promise<DashboardBody> => {
  const supabase = createAdminClient();
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    recentRes,
    allInvoicesRes,
    clientsThisMonthRes,
    clientsPrevMonthRes,
    creditNoteCountRes,
    debitNoteCountRes,
    recentCreditRes,
    recentDebitRes,
    auditLogsRes,
  ] = await Promise.all([
    supabase
      .from("Invoice")
      .select("id, invoiceNumber, issueDate, dueDate, total, status, clientId, companyId")
      .eq("userId", userId)
      .order("issueDate", { ascending: false })
      .limit(5),
    supabase
      .from("Invoice")
      .select("id, status, total, createdAt, issueDate, dueDate, clientId")
      .eq("userId", userId),
    supabase
      .from("Client")
      .select("*", { count: "exact", head: true })
      .eq("userId", userId)
      .gte("createdAt", startOfMonth.toISOString()),
    supabase
      .from("Client")
      .select("*", { count: "exact", head: true })
      .eq("userId", userId)
      .gte("createdAt", startOfPrevMonth.toISOString())
      .lt("createdAt", startOfMonth.toISOString()),
    supabase.from("CreditNote").select("*", { count: "exact", head: true }).eq("userId", userId),
    supabase.from("DebitNote").select("*", { count: "exact", head: true }).eq("userId", userId),
    supabase
      .from("CreditNote")
      .select("id, creditNoteNumber, issueDate, total, currency, invoiceId, clientId")
      .eq("userId", userId)
      .order("createdAt", { ascending: false })
      .limit(3),
    supabase
      .from("DebitNote")
      .select("id, debitNoteNumber, issueDate, total, currency, invoiceId, clientId")
      .eq("userId", userId)
      .order("createdAt", { ascending: false })
      .limit(3),
    supabase
      .from("AuditLog")
      .select("id, action, entityType, entityId, createdAt")
      .eq("userId", userId)
      .order("createdAt", { ascending: false })
      .limit(5),
  ]);

  const recentInvoicesData = (recentRes.data || []) as InvoiceRow[];
  const statsRows: InvoiceStatsRow[] = (allInvoicesRes.data || []) as InvoiceStatsRow[];
  const recentCreditNotes = recentCreditRes.data as CreditNoteRow[] | null;
  const recentDebitNotes = recentDebitRes.data as DebitNoteRow[] | null;
  const auditLogs = auditLogsRes.data as DashboardBody["auditLogs"];

  const clientIds = [...new Set(recentInvoicesData.map((inv) => inv.clientId))];
  const companyIds = [...new Set(recentInvoicesData.map((inv) => inv.companyId))];

  const noteInvoiceIds = [
    ...(recentCreditNotes || []).map((n) => n.invoiceId).filter(Boolean) as string[],
    ...(recentDebitNotes || []).map((n) => n.invoiceId).filter(Boolean) as string[],
  ];
  const noteClientIds = [
    ...(recentCreditNotes || []).map((n) => n.clientId).filter(Boolean) as string[],
    ...(recentDebitNotes || []).map((n) => n.clientId).filter(Boolean) as string[],
  ];

  const auditInvoiceIds = [
    ...new Set(
      (auditLogs || [])
        .filter((log) => log.entityType === "INVOICE" && log.entityId)
        .map((log) => log.entityId as string)
    ),
  ];
  const auditCompanyIds = [
    ...new Set(
      (auditLogs || [])
        .filter((log) => log.entityType === "COMPANY" && log.entityId)
        .map((log) => log.entityId as string)
    ),
  ];
  const auditClientIds = [
    ...new Set(
      (auditLogs || [])
        .filter((log) => log.entityType === "CLIENT" && log.entityId)
        .map((log) => log.entityId as string)
    ),
  ];

  const overdueInvoices = statsRows
    .filter(
      (inv) =>
        isIssuedLikeStatus(inv.status) &&
        inv.status !== "PAID" &&
        new Date(inv.dueDate) < today
    )
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  const topOverdue = overdueInvoices.slice(0, 5);
  const overdueClientIds = topOverdue.map((inv) => inv.clientId).filter(Boolean);

  const [noteInvoicesRes, auditInvoicesRes] = await Promise.all([
    noteInvoiceIds.length > 0
      ? supabase.from("Invoice").select("id, invoiceNumber").in("id", noteInvoiceIds)
      : Promise.resolve({ data: [] as Array<{ id: string; invoiceNumber: string }> }),
    auditInvoiceIds.length > 0
      ? supabase
          .from("Invoice")
          .select("id, invoiceNumber, clientId, companyId, total, status")
          .in("id", auditInvoiceIds)
          .eq("userId", userId)
      : Promise.resolve({
          data: [] as Array<{
            id: string;
            invoiceNumber: string;
            clientId: string;
            companyId: string;
            total: number;
            status: string;
          }>,
        }),
  ]);

  const noteInvoicesData = noteInvoicesRes.data || [];
  const noteInvoiceMap = new Map(noteInvoicesData.map((i) => [i.id, i.invoiceNumber]));
  const auditInvoicesData = auditInvoicesRes.data || [];

  const auditInvoiceClientIds = [...new Set(auditInvoicesData.map((i) => i.clientId).filter(Boolean))];
  const auditInvoiceCompanyIds = [...new Set(auditInvoicesData.map((i) => i.companyId).filter(Boolean))];

  const mergedClientIds = [
    ...new Set([
      ...clientIds,
      ...auditClientIds,
      ...auditInvoiceClientIds,
      ...noteClientIds,
      ...overdueClientIds,
    ]),
  ];
  const mergedCompanyIds = [
    ...new Set([...companyIds, ...auditCompanyIds, ...auditInvoiceCompanyIds]),
  ];

  const [mergedClientsRes, mergedCompaniesRes] = await Promise.all([
    supabase.from("Client").select("id, name").in("id", mergedClientIds.length > 0 ? mergedClientIds : [""]),
    supabase.from("Company").select("id, name").in("id", mergedCompanyIds.length > 0 ? mergedCompanyIds : [""]),
  ]);

  const mergedClientsMap = new Map(
    ((mergedClientsRes.data || []) as ClientRow[]).map((c) => [c.id, c])
  );
  const mergedCompaniesMap = new Map(
    ((mergedCompaniesRes.data || []) as CompanyRow[]).map((c) => [c.id, c])
  );

  const auditInvoicesMap = new Map(
    auditInvoicesData.map((invoice) => [
      invoice.id,
      {
        ...invoice,
        clientName: mergedClientsMap.get(invoice.clientId)?.name || "Неизвестен клиент",
        companyName: mergedCompaniesMap.get(invoice.companyId)?.name || "Неизвестна компания",
      },
    ])
  );

  const invoiceCounts = statsRows.reduce((acc, invoice) => {
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

  const issuedInvoices = statsRows.filter((inv) => isIssuedLikeStatus(inv.status));
  const totalIssued = issuedInvoices.reduce((sum, inv) => sum + Number(inv.total || 0), 0);

  const thisMonthInvoices = statsRows.filter((inv) => new Date(inv.createdAt) >= startOfMonth);
  const thisMonthTotal = thisMonthInvoices
    .filter((inv) => isIssuedLikeStatus(inv.status))
    .reduce((sum, inv) => sum + Number(inv.total || 0), 0);

  const prevMonthInvoices = statsRows.filter((inv) => {
    const d = new Date(inv.createdAt);
    return d >= startOfPrevMonth && d < startOfMonth;
  });
  const prevMonthTotal = prevMonthInvoices
    .filter((inv) => isIssuedLikeStatus(inv.status))
    .reduce((sum, inv) => sum + Number(inv.total || 0), 0);
  const prevMonthIssuedTotal = prevMonthInvoices
    .filter((inv) => isIssuedLikeStatus(inv.status))
    .reduce((sum, inv) => sum + Number(inv.total || 0), 0);

  const currentMonthIssuedTotal = thisMonthInvoices
    .filter((inv) => isIssuedLikeStatus(inv.status))
    .reduce((sum, inv) => sum + Number(inv.total || 0), 0);

  const totalTrend = calcTrend(currentMonthIssuedTotal, prevMonthIssuedTotal);
  const thisMonthTotalTrend = calcTrend(thisMonthTotal, prevMonthTotal);
  const thisMonthCount = thisMonthInvoices.length;
  const prevMonthCount = prevMonthInvoices.length;
  const countTrend = calcTrend(thisMonthCount, prevMonthCount);

  const clientsThisMonth = clientsThisMonthRes.count;
  const clientsPrevMonth = clientsPrevMonthRes.count;
  const clientTrend = calcTrend(clientsThisMonth || 0, clientsPrevMonth || 0);

  const overdueCount = overdueInvoices.length;
  const overdueTotal = overdueInvoices.reduce((sum, inv) => sum + Number(inv.total || 0), 0);

  return {
    statsRows,
    recentInvoicesData,
    recentCreditNotes,
    recentDebitNotes,
    creditNoteCount: creditNoteCountRes.count,
    debitNoteCount: debitNoteCountRes.count,
    clientsThisMonth,
    clientsPrevMonth,
    auditLogs,
    noteInvoiceMap,
    mergedClientsMap,
    mergedCompaniesMap,
    auditInvoicesMap,
    invoiceCounts,
    counts,
    totalIssued,
    thisMonthTotal,
    currentMonthIssuedTotal,
    prevMonthIssuedTotal,
    thisMonthTotalTrend,
    totalTrend,
    countTrend,
    thisMonthInvoicesLen: thisMonthInvoices.length,
    overdueCount,
    overdueTotal,
    topOverdue,
    today,
    clientTrend,
  };
});

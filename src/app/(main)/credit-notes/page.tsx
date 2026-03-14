import Link from "next/link";
import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { 
  FileText, 
  ArrowUpRight, 
  Receipt,
  Calendar,
  Building,
  Users,
  Plus
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { APP_NAME } from "@/config/constants";
import { createAdminClient } from "@/lib/supabase/server";
import { resolveSessionUser } from "@/lib/session-user";
import { format } from "date-fns";
import { bg } from "date-fns/locale";
import { CardStatsMetric } from "@/components/ui/CardStatsMetric";

export const metadata: Metadata = {
  title: `Сторно документи | ${APP_NAME}`,
  description: "Преглед на сторно документи",
};

interface CreditNote {
  id: string;
  creditNoteNumber: string;
  issueDate: string;
  reason: string | null;
  subtotal: number;
  taxAmount: number;
  total: number;
  currency: string;
  invoiceId: string;
  invoice?: {
    invoiceNumber: string;
  };
  client?: {
    id: string;
    name: string;
  };
  company?: {
    id: string;
    name: string;
  };
}

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
  
  // Fetch credit notes
  const { data: creditNotesData, error } = await supabase
    .from("CreditNote")
    .select(`
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
    `)
    .eq("userId", sessionUser.id)
    .order("issueDate", { ascending: false });

  if (error) {
    console.error("Error fetching credit notes:", error);
  }

  // Fetch related invoices, clients, and companies
  const creditNotes: CreditNote[] = [];
  
  if (creditNotesData && creditNotesData.length > 0) {
    // Filter out null values before querying
    const invoiceIds = [...new Set(creditNotesData.map(cn => cn.invoiceId).filter((id): id is string => id !== null))];
    const clientIds = [...new Set(creditNotesData.map(cn => cn.clientId).filter((id): id is string => id !== null))];
    const companyIds = [...new Set(creditNotesData.map(cn => cn.companyId).filter((id): id is string => id !== null))];

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

    const invoicesMap = new Map((invoicesResult.data || []).map(i => [i.id, i]));
    const clientsMap = new Map((clientsResult.data || []).map(c => [c.id, c]));
    const companiesMap = new Map((companiesResult.data || []).map(c => [c.id, c]));

    for (const cn of creditNotesData) {
      creditNotes.push({
        ...cn,
        invoice: cn.invoiceId ? invoicesMap.get(cn.invoiceId) : undefined,
        client: clientsMap.get(cn.clientId),
        company: companiesMap.get(cn.companyId),
      });
    }
  }

  // Calculate stats
  const totalCreditNotes = creditNotes.length;
  const totalAmount = creditNotes.reduce((sum, cn) => sum + Number(cn.total), 0);
  const thisMonthStart = new Date();
  thisMonthStart.setDate(1);
  thisMonthStart.setHours(0, 0, 0, 0);
  const thisMonthCreditNotes = creditNotes.filter(cn => new Date(cn.issueDate) >= thisMonthStart);
  const thisMonthAmount = thisMonthCreditNotes.reduce((sum, cn) => sum + Number(cn.total), 0);

  return (
    <div className="app-page-shell">
      {/* Header */}
      <div className="page-header">
        <div className="min-w-0">
          <h1 className="page-title">Кредитни известия</h1>
          <p className="card-description mt-1">
            Преглед на издадени кредитни известия за отменени фактури
          </p>
        </div>
        <Button asChild className="btn-responsive">
          <Link href="/credit-notes/new" className="flex items-center">
            <Plus className="mr-2 h-4 w-4" />
            Ново кредитно известие
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <CardStatsMetric
          title="Общо известия"
          value={totalCreditNotes}
          icon={Receipt}
          gradient="from-blue-500 to-indigo-600"
        />
        <CardStatsMetric
          title="Обща стойност"
          value={totalAmount}
          valueSuffix="€"
          icon={FileText}
          gradient="from-red-500 to-rose-600"
        />
        <CardStatsMetric
          title="Този месец"
          value={thisMonthCreditNotes.length}
          icon={Calendar}
          gradient="from-amber-500 to-orange-600"
        />
        <CardStatsMetric
          title="Стойност този месец"
          value={thisMonthAmount}
          valueSuffix="€"
          icon={Receipt}
          gradient="from-violet-500 to-purple-600"
        />
      </div>

      {/* Credit Notes List */}
      {creditNotes.length === 0 ? (
        <Card className="border-0 shadow-lg">
          <CardContent className="py-16">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Receipt className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-1">Няма кредитни известия</h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-sm">
                Кредитните известия се използват за възстановяване на пари при връщане на продукт
              </p>
              <Button asChild>
                <Link href="/credit-notes/new" className="flex items-center">
                  <Plus className="mr-2 h-4 w-4" />
                  Създай кредитно известие
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Списък със сторно документи</CardTitle>
            <CardDescription>
              Общо {totalCreditNotes} {totalCreditNotes === 1 ? 'документ' : 'документа'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {creditNotes.map((creditNote) => (
                <Link
                  key={creditNote.id}
                  href={`/credit-notes/${creditNote.id}`}
                  className="group flex flex-col gap-4 rounded-2xl border border-border/50 bg-muted/30 p-4 transition-all duration-200 hover:bg-muted/50 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 flex-1 items-start gap-4">
                    <div className="h-11 w-11 rounded-lg shrink-0 flex items-center justify-center bg-red-500/10 text-red-600 border border-red-500/20">
                      <Receipt className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="mb-0.5 flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-sm truncate">{creditNote.creditNoteNumber}</p>
                        {creditNote.invoiceId && (
                          <Badge variant="outline" className="text-xs">
                            За: {creditNote.invoice?.invoiceNumber || 'N/A'}
                          </Badge>
                        )}
                        {!creditNote.invoiceId && (
                          <Badge variant="outline" className="text-xs text-muted-foreground">
                            Самостоятелно
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {creditNote.client?.name || 'Неизвестен клиент'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Building className="h-3 w-3" />
                          {creditNote.company?.name || 'Неизвестна компания'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center justify-between gap-4 sm:justify-end">
                    <div className="text-left sm:text-right">
                      <p className="font-bold text-sm text-red-600">-{Number(creditNote.total).toFixed(2)} {creditNote.currency}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(creditNote.issueDate), 'd MMM yyyy', { locale: bg })}
                      </p>
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

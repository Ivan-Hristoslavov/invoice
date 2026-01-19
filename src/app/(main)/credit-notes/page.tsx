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
  Users
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { APP_NAME } from "@/config/constants";
import { createAdminClient } from "@/lib/supabase/server";
import { format } from "date-fns";
import { bg } from "date-fns/locale";
import { CardStatsMetric } from "@/components/ui/CardStatsMetric";

export const metadata: Metadata = {
  title: `Кредитни известия | ${APP_NAME}`,
  description: "Преглед на кредитни известия",
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
  
  if (!session) {
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
    .eq("userId", session.user.id)
    .order("issueDate", { ascending: false });

  if (error) {
    console.error("Error fetching credit notes:", error);
  }

  // Fetch related invoices, clients, and companies
  const creditNotes: CreditNote[] = [];
  
  if (creditNotesData && creditNotesData.length > 0) {
    const invoiceIds = [...new Set(creditNotesData.map(cn => cn.invoiceId))];
    const clientIds = [...new Set(creditNotesData.map(cn => cn.clientId))];
    const companyIds = [...new Set(creditNotesData.map(cn => cn.companyId))];

    const [invoicesResult, clientsResult, companiesResult] = await Promise.all([
      supabase.from("Invoice").select("id, invoiceNumber").in("id", invoiceIds),
      supabase.from("Client").select("id, name").in("id", clientIds),
      supabase.from("Company").select("id, name").in("id", companyIds),
    ]);

    const invoicesMap = new Map((invoicesResult.data || []).map(i => [i.id, i]));
    const clientsMap = new Map((clientsResult.data || []).map(c => [c.id, c]));
    const companiesMap = new Map((companiesResult.data || []).map(c => [c.id, c]));

    for (const cn of creditNotesData) {
      creditNotes.push({
        ...cn,
        invoice: invoicesMap.get(cn.invoiceId),
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Кредитни известия</h1>
          <p className="text-muted-foreground mt-1">
            Преглед на издадени кредитни известия за отменени фактури
          </p>
        </div>
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
                Кредитните известия се създават автоматично при отмяна на издадена фактура
              </p>
              <Button asChild variant="outline">
                <Link href="/invoices">
                  <FileText className="mr-2 h-4 w-4" />
                  Към фактурите
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Списък с кредитни известия</CardTitle>
            <CardDescription>
              Общо {totalCreditNotes} {totalCreditNotes === 1 ? 'известие' : 'известия'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {creditNotes.map((creditNote) => (
                <Link
                  key={creditNote.id}
                  href={`/credit-notes/${creditNote.id}`}
                  className="flex items-center justify-between p-4 rounded-xl bg-muted/30 hover:bg-muted/50 border border-border/50 transition-all duration-200 group"
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="h-11 w-11 rounded-lg flex items-center justify-center flex-shrink-0 bg-red-500/10 text-red-600 border border-red-500/20">
                      <Receipt className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="font-semibold text-sm truncate">{creditNote.creditNoteNumber}</p>
                        <Badge variant="outline" className="text-xs">
                          За: {creditNote.invoice?.invoiceNumber || 'N/A'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
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
                  <div className="flex items-center gap-4 flex-shrink-0">
                    <div className="text-right">
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

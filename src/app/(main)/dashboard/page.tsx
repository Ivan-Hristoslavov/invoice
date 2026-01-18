import Link from "next/link";
import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { 
  FileText, 
  Users, 
  Building, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight,
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  MoreHorizontal,
  Sparkles,
  Euro,
  Calendar
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Button as RadixButton } from "@radix-ui/themes";
import { APP_NAME } from "@/config/constants";
import { createAdminClient } from "@/lib/supabase/server";
import { format } from "date-fns";
import { bg } from "date-fns/locale";

type InvoiceStatus = "DRAFT" | "ISSUED" | "CANCELLED";

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
  status: InvoiceStatus;
  client: {
    id: string;
    name: string;
  };
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    redirect("/signin");
  }
  
  const supabase = createAdminClient();
  
  // Get recent invoices
  const { data: recentInvoicesData } = await supabase
    .from("Invoice")
    .select("id, invoiceNumber, issueDate, dueDate, total, status, clientId")
    .eq("userId", session.user.id)
    .order("issueDate", { ascending: false })
    .limit(5);
  
  // Get client data for the invoices
  const clientIds = [...new Set((recentInvoicesData || []).map((inv: any) => inv.clientId))];
  const { data: clientsData } = await supabase
    .from("Client")
    .select("id, name")
    .in("id", clientIds.length > 0 ? clientIds : ['']);
  
  const clientsMap = new Map((clientsData || []).map((c: any) => [c.id, c]));
  
  const recentInvoices: InvoiceWithClient[] = (recentInvoicesData || []).map((inv: any) => {
    const client = clientsMap.get(inv.clientId);
    return {
      id: inv.id,
      invoiceNumber: inv.invoiceNumber,
      issueDate: new Date(inv.issueDate),
      dueDate: new Date(inv.dueDate),
      total: Number(inv.total),
      status: inv.status as InvoiceStatus,
      client: {
        id: client?.id || inv.clientId,
        name: client?.name || 'Неизвестен клиент'
      }
    };
  });
  
  // Get all invoices for stats
  const { data: allInvoices } = await supabase
    .from("Invoice")
    .select("id, status, total, createdAt")
    .eq("userId", session.user.id);
  
  // Calculate invoice counts
  const invoiceCounts = (allInvoices || []).reduce((acc: any, invoice: any) => {
    const status = invoice.status as InvoiceStatus;
    if (!acc[status]) {
      acc[status] = 0;
    }
    acc[status]++;
    return acc;
  }, {});
  
  const counts = {
    total: allInvoices?.length || 0,
    issued: invoiceCounts.ISSUED || 0,
    draft: invoiceCounts.DRAFT || 0,
    cancelled: invoiceCounts.CANCELLED || 0,
  };
  
  // Get total from issued invoices
  const issuedInvoices = (allInvoices || []).filter((inv: any) => inv.status === 'ISSUED');
  const totalIssued = issuedInvoices.reduce((sum: number, inv: any) => sum + Number(inv.total || 0), 0);
  
  // This month's invoices
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  
  const thisMonthInvoices = (allInvoices || []).filter(
    (inv: any) => new Date(inv.createdAt) >= startOfMonth
  );
  const thisMonthTotal = thisMonthInvoices
    .filter((inv: any) => inv.status === 'ISSUED')
    .reduce((sum: number, inv: any) => sum + Number(inv.total || 0), 0);
  
  // Get client and company counts
  const { count: clientCount } = await supabase
    .from("Client")
    .select("*", { count: "exact", head: true })
    .eq("userId", session.user.id);
  
  const { count: companyCount } = await supabase
    .from("Company")
    .select("*", { count: "exact", head: true })
    .eq("userId", session.user.id);

  const stats = [
    {
      title: "Обща стойност",
      value: totalIssued.toFixed(2),
      currency: "€",
      description: "От издадени фактури",
      icon: Euro,
      trend: "+12.5%",
      trendUp: true,
      gradient: "from-emerald-500 to-teal-600",
      bgGradient: "from-emerald-500/10 via-emerald-500/5 to-transparent",
      iconBg: "bg-emerald-500/20"
    },
    {
      title: "Този месец",
      value: thisMonthTotal.toFixed(2),
      currency: "€",
      description: `${thisMonthInvoices.length} ${thisMonthInvoices.length === 1 ? 'фактура' : 'фактури'}`,
      icon: Calendar,
      trend: "+8.2%",
      trendUp: true,
      gradient: "from-blue-500 to-indigo-600",
      bgGradient: "from-blue-500/10 via-blue-500/5 to-transparent",
      iconBg: "bg-blue-500/20"
    },
    {
      title: "Фактури",
      value: counts.total.toString(),
      currency: "",
      description: `${counts.issued} издадени, ${counts.draft} чернови`,
      icon: FileText,
      gradient: "from-violet-500 to-purple-600",
      bgGradient: "from-violet-500/10 via-violet-500/5 to-transparent",
      iconBg: "bg-violet-500/20"
    },
    {
      title: "Клиенти",
      value: (clientCount || 0).toString(),
      currency: "",
      description: "Активни клиенти",
      icon: Users,
      gradient: "from-amber-500 to-orange-600",
      bgGradient: "from-amber-500/10 via-amber-500/5 to-transparent",
      iconBg: "bg-amber-500/20"
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Табло</h1>
          <p className="text-muted-foreground mt-1.5">
            Добре дошли, {session.user.name || 'потребител'}! Ето преглед на вашата дейност.
          </p>
        </div>
        <RadixButton 
          asChild 
          size="3" 
          variant="solid" 
          color="green"
          className="shadow-lg hover:shadow-xl transition-shadow"
        >
          <Link href="/invoices/new">
            <Plus className="mr-2 h-5 w-5" />
            Нова фактура
          </Link>
        </RadixButton>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card 
            key={stat.title} 
            className="relative overflow-hidden border border-border/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group"
          >
            {/* Animated background gradient */}
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.bgGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
            
            <CardContent className="relative p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-muted-foreground mb-3">{stat.title}</p>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl font-bold tracking-tight">{stat.value}</span>
                    {stat.currency && (
                      <span className="text-xl font-semibold text-muted-foreground">{stat.currency}</span>
                    )}
                  </div>
                </div>
                <div className={`p-2.5 rounded-xl ${stat.iconBg} flex-shrink-0`}>
                  <div className={`p-2 rounded-lg bg-gradient-to-br ${stat.gradient} shadow-md`}>
                    <stat.icon className="h-5 w-5 text-white" />
                  </div>
                </div>
              </div>
              
              <p className="text-xs text-muted-foreground mb-3">{stat.description}</p>
              
              {stat.trend && (
                <div className="flex items-center gap-1.5 pt-3 border-t border-border/50">
                  {stat.trendUp ? (
                    <ArrowUpRight className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4 text-red-600 flex-shrink-0" />
                  )}
                  <span className={`text-sm font-semibold ${stat.trendUp ? 'text-emerald-600' : 'text-red-600'}`}>
                    {stat.trend}
                  </span>
                  <span className="text-xs text-muted-foreground ml-0.5">спрямо миналия месец</span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions & Recent Invoices */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Quick Actions */}
        <Card className="lg:col-span-1 border border-border/50 shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold">Бързи действия</CardTitle>
            <CardDescription className="text-sm">Често използвани операции</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link 
              href="/invoices/new"
              className="flex items-center w-full p-3.5 rounded-xl hover:bg-muted/50 transition-colors group"
            >
              <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mr-3 shadow-md shadow-blue-500/20 group-hover:shadow-lg group-hover:shadow-blue-500/30 transition-shadow">
                <Plus className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-medium text-sm">Нова фактура</p>
                <p className="text-xs text-muted-foreground">Създайте фактура</p>
              </div>
            </Link>
            <Link 
              href="/clients/new"
              className="flex items-center w-full p-3.5 rounded-xl hover:bg-muted/50 transition-colors group"
            >
              <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center mr-3 shadow-md shadow-amber-500/20 group-hover:shadow-lg group-hover:shadow-amber-500/30 transition-shadow">
                <Users className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-medium text-sm">Нов клиент</p>
                <p className="text-xs text-muted-foreground">Добавете клиент</p>
              </div>
            </Link>
            <Link 
              href="/companies/new"
              className="flex items-center w-full p-3.5 rounded-xl hover:bg-muted/50 transition-colors group"
            >
              <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mr-3 shadow-md shadow-emerald-500/20 group-hover:shadow-lg group-hover:shadow-emerald-500/30 transition-shadow">
                <Building className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-medium text-sm">Нова компания</p>
                <p className="text-xs text-muted-foreground">Добавете фирма</p>
              </div>
            </Link>
            <Link 
              href="/products/new"
              className="flex items-center w-full p-3.5 rounded-xl hover:bg-muted/50 transition-colors group"
            >
              <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-slate-500 to-slate-600 flex items-center justify-center mr-3 shadow-md shadow-slate-500/20 group-hover:shadow-lg group-hover:shadow-slate-500/30 transition-shadow">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-medium text-sm">Нов продукт</p>
                <p className="text-xs text-muted-foreground">Добавете услуга</p>
              </div>
            </Link>
          </CardContent>
        </Card>

        {/* Recent Invoices */}
        <Card className="lg:col-span-2 border border-border/50 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div>
              <CardTitle className="text-lg font-semibold">Последни фактури</CardTitle>
              <CardDescription className="text-sm">Най-новите фактури в системата</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild className="text-xs">
              <Link href="/invoices" className="flex items-center gap-1.5">
                Всички
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentInvoices.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="h-14 w-14 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                  <FileText className="h-7 w-7 text-muted-foreground" />
                </div>
                <p className="text-base font-semibold mb-1">Няма фактури</p>
                <p className="text-sm text-muted-foreground mb-6 max-w-xs">
                  Създайте първата си фактура, за да започнете да управлявате финансите си
                </p>
                <Button size="sm" asChild className="shadow-md">
                  <Link href="/invoices/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Нова фактура
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {recentInvoices.map((invoice) => (
                  <Link
                    key={invoice.id}
                    href={`/invoices/${invoice.id}`}
                    className="flex items-center justify-between p-4 rounded-xl bg-muted/30 hover:bg-muted/50 border border-border/50 transition-all duration-200 group"
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className={`h-11 w-11 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        invoice.status === 'ISSUED' 
                          ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                          : invoice.status === 'DRAFT'
                          ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                          : 'bg-red-500/10 text-red-600 border border-red-500/20'
                      }`}>
                        {invoice.status === 'ISSUED' ? (
                          <CheckCircle className="h-5 w-5" />
                        ) : invoice.status === 'DRAFT' ? (
                          <Clock className="h-5 w-5" />
                        ) : (
                          <XCircle className="h-5 w-5" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm mb-0.5 truncate">{invoice.invoiceNumber}</p>
                        <p className="text-xs text-muted-foreground truncate">{invoice.client.name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 flex-shrink-0">
                      <div className="text-right">
                        <p className="font-bold text-sm">{invoice.total.toFixed(2)} €</p>
                        <p className="text-xs text-muted-foreground">
                          {format(invoice.issueDate, 'd MMM yyyy', { locale: bg })}
                        </p>
                      </div>
                      <div className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                        invoice.status === 'ISSUED' 
                          ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                          : invoice.status === 'DRAFT'
                          ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                          : 'bg-red-500/10 text-red-600 border border-red-500/20'
                      }`}>
                        {invoice.status === 'ISSUED' ? 'Издадена' : invoice.status === 'DRAFT' ? 'Чернова' : 'Отказана'}
                      </div>
                      <Eye className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

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
  Sparkles
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
      value: `${totalIssued.toFixed(2)} лв`,
      description: "От издадени фактури",
      icon: TrendingUp,
      trend: "+12.5%",
      trendUp: true,
      gradient: "from-emerald-500 to-teal-600",
      bgGradient: "from-emerald-500/10 to-teal-600/10"
    },
    {
      title: "Този месец",
      value: `${thisMonthTotal.toFixed(2)} лв`,
      description: `${thisMonthInvoices.length} фактури`,
      icon: Sparkles,
      trend: "+8.2%",
      trendUp: true,
      gradient: "from-sky-500 to-blue-600",
      bgGradient: "from-sky-500/10 to-blue-600/10"
    },
    {
      title: "Фактури",
      value: counts.total.toString(),
      description: `${counts.issued} издадени, ${counts.draft} чернови`,
      icon: FileText,
      gradient: "from-blue-500 to-indigo-600",
      bgGradient: "from-blue-500/10 to-indigo-600/10"
    },
    {
      title: "Клиенти",
      value: (clientCount || 0).toString(),
      description: "Активни клиенти",
      icon: Users,
      gradient: "from-amber-500 to-orange-600",
      bgGradient: "from-amber-500/10 to-orange-600/10"
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Табло</h1>
          <p className="text-muted-foreground mt-1">
            Добре дошли, {session.user.name || 'потребител'}! Ето преглед на вашата дейност.
          </p>
        </div>
        <RadixButton 
          asChild 
          size="3" 
          variant="solid" 
          color="green"
          className="shadow-lg"
        >
          <Link href="/invoices/new">
            <Plus className="mr-2 h-5 w-5" />
            Нова фактура
          </Link>
        </RadixButton>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card key={stat.title} className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
            {/* Background Gradient */}
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.bgGradient} opacity-50 group-hover:opacity-70 transition-opacity`} />
            
            <CardContent className="relative p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <p className="text-3xl font-bold tracking-tight">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.description}</p>
                </div>
                <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.gradient} shadow-lg`}>
                  <stat.icon className="h-5 w-5 text-white" />
                </div>
              </div>
              
              {stat.trend && (
                <div className="flex items-center gap-1 mt-4">
                  {stat.trendUp ? (
                    <ArrowUpRight className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4 text-red-500" />
                  )}
                  <span className={`text-sm font-medium ${stat.trendUp ? 'text-emerald-500' : 'text-red-500'}`}>
                    {stat.trend}
                  </span>
                  <span className="text-xs text-muted-foreground ml-1">спрямо миналия месец</span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions & Recent Invoices */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Quick Actions */}
        <Card className="lg:col-span-1 border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg">Бързи действия</CardTitle>
            <CardDescription>Често използвани операции</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link 
              href="/invoices/new"
              className="flex items-center w-full p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group"
            >
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mr-4 shadow-lg shadow-blue-500/20">
                <Plus className="h-5 w-5 text-white" />
              </div>
              <div className="text-left">
                <p className="font-medium text-sm">Нова фактура</p>
                <p className="text-xs text-muted-foreground">Създайте фактура</p>
              </div>
            </Link>
            <Link 
              href="/clients/new"
              className="flex items-center w-full p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group"
            >
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center mr-4 shadow-lg shadow-amber-500/20">
                <Users className="h-5 w-5 text-white" />
              </div>
              <div className="text-left">
                <p className="font-medium text-sm">Нов клиент</p>
                <p className="text-xs text-muted-foreground">Добавете клиент</p>
              </div>
            </Link>
            <Link 
              href="/companies/new"
              className="flex items-center w-full p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group"
            >
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mr-4 shadow-lg shadow-emerald-500/20">
                <Building className="h-5 w-5 text-white" />
              </div>
              <div className="text-left">
                <p className="font-medium text-sm">Нова компания</p>
                <p className="text-xs text-muted-foreground">Добавете фирма</p>
              </div>
            </Link>
            <Link 
              href="/products/new"
              className="flex items-center w-full p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group"
            >
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-slate-500 to-slate-600 flex items-center justify-center mr-4 shadow-lg shadow-slate-500/20">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <div className="text-left">
                <p className="font-medium text-sm">Нов продукт</p>
                <p className="text-xs text-muted-foreground">Добавете услуга</p>
              </div>
            </Link>
          </CardContent>
        </Card>

        {/* Recent Invoices */}
        <Card className="lg:col-span-2 border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Последни фактури</CardTitle>
              <CardDescription>Най-новите фактури в системата</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/invoices">
                Всички
                <ArrowUpRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentInvoices.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
                  <FileText className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium mb-1">Няма фактури</p>
                <p className="text-xs text-muted-foreground mb-4">
                  Създайте първата си фактура
                </p>
                <Button size="sm" asChild>
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
                    className="flex items-center justify-between p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors group"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                        invoice.status === 'ISSUED' 
                          ? 'bg-emerald-500/10 text-emerald-600'
                          : invoice.status === 'DRAFT'
                          ? 'bg-amber-500/10 text-amber-600'
                          : 'bg-red-500/10 text-red-600'
                      }`}>
                        {invoice.status === 'ISSUED' ? (
                          <CheckCircle className="h-5 w-5" />
                        ) : invoice.status === 'DRAFT' ? (
                          <Clock className="h-5 w-5" />
                        ) : (
                          <XCircle className="h-5 w-5" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{invoice.invoiceNumber}</p>
                        <p className="text-xs text-muted-foreground">{invoice.client.name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-semibold text-sm">{invoice.total.toFixed(2)} лв</p>
                        <p className="text-xs text-muted-foreground">
                          {format(invoice.issueDate, 'd MMM yyyy', { locale: bg })}
                        </p>
                      </div>
                      <div className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        invoice.status === 'ISSUED' 
                          ? 'bg-emerald-500/10 text-emerald-600'
                          : invoice.status === 'DRAFT'
                          ? 'bg-amber-500/10 text-amber-600'
                          : 'bg-red-500/10 text-red-600'
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

      {/* Status Overview */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-500/5 to-teal-600/5">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Издадени</p>
                <p className="text-3xl font-bold text-emerald-600">{counts.issued}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-500/5 to-orange-600/5">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Чернови</p>
                <p className="text-3xl font-bold text-amber-600">{counts.draft}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-amber-500/10 flex items-center justify-center">
                <Clock className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-lg bg-gradient-to-br from-red-500/5 to-red-600/5">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Отказани</p>
                <p className="text-3xl font-bold text-red-600">{counts.cancelled}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-red-500/10 flex items-center justify-center">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

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
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="page-header">
        <div className="flex-1 min-w-0">
          <h1 className="page-title">Табло</h1>
          <p className="card-description mt-1">
            Добре дошли, {session.user.name || 'потребител'}!
          </p>
        </div>
        <RadixButton 
          asChild 
          size="2" 
          variant="solid" 
          color="green"
          className="shadow-lg hover:shadow-xl transition-shadow btn-responsive"
        >
          <Link href="/invoices/new">
            <Plus className="mr-1.5 h-4 w-4" />
            <span className="hidden sm:inline">Нова фактура</span>
            <span className="sm:hidden">Нова</span>
          </Link>
        </RadixButton>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card 
            key={stat.title} 
            className="relative overflow-hidden border border-border/50 shadow-md hover:shadow-lg transition-all duration-300 group"
          >
            {/* Animated background gradient */}
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.bgGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
            
            <CardContent className="relative p-3 sm:p-4">
              <div className="flex items-start justify-between mb-2 sm:mb-3">
                <div className="flex-1 min-w-0">
                  <p className="tiny-text font-medium text-muted-foreground mb-1.5 sm:mb-2">{stat.title}</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-lg sm:text-2xl font-bold tracking-tight">{stat.value}</span>
                    {stat.currency && (
                      <span className="text-sm sm:text-lg font-semibold text-muted-foreground">{stat.currency}</span>
                    )}
                  </div>
                </div>
                <div className={`p-1.5 sm:p-2 rounded-lg ${stat.iconBg} flex-shrink-0`}>
                  <div className={`p-1.5 sm:p-2 rounded-md bg-gradient-to-br ${stat.gradient} shadow-sm`}>
                    <stat.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
                  </div>
                </div>
              </div>
              
              <p className="tiny-text text-muted-foreground mb-2 hidden sm:block">{stat.description}</p>
              
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
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
        {/* Quick Actions */}
        <Card className="lg:col-span-1 border border-border/50 shadow-md">
          <CardHeader className="pb-3 px-3 sm:px-6 pt-3 sm:pt-6">
            <CardTitle className="card-title">Бързи действия</CardTitle>
            <CardDescription className="card-description">Често използвани операции</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1.5 px-3 sm:px-6 pb-3 sm:pb-6">
            <Link 
              href="/invoices/new"
              className="flex items-center w-full p-2.5 sm:p-3 rounded-lg sm:rounded-xl hover:bg-muted/50 transition-colors group"
            >
              <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mr-2.5 sm:mr-3 shadow-sm">
                <Plus className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className="small-text font-medium truncate">Нова фактура</p>
                <p className="tiny-text text-muted-foreground hidden sm:block">Създайте фактура</p>
              </div>
            </Link>
            <Link 
              href="/clients/new"
              className="flex items-center w-full p-2.5 sm:p-3 rounded-lg sm:rounded-xl hover:bg-muted/50 transition-colors group"
            >
              <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center mr-2.5 sm:mr-3 shadow-sm">
                <Users className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className="small-text font-medium truncate">Нов клиент</p>
                <p className="tiny-text text-muted-foreground hidden sm:block">Добавете клиент</p>
              </div>
            </Link>
            <Link 
              href="/companies/new"
              className="flex items-center w-full p-2.5 sm:p-3 rounded-lg sm:rounded-xl hover:bg-muted/50 transition-colors group"
            >
              <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mr-2.5 sm:mr-3 shadow-sm">
                <Building className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className="small-text font-medium truncate">Нова компания</p>
                <p className="tiny-text text-muted-foreground hidden sm:block">Добавете фирма</p>
              </div>
            </Link>
            <Link 
              href="/products/new"
              className="flex items-center w-full p-2.5 sm:p-3 rounded-lg sm:rounded-xl hover:bg-muted/50 transition-colors group"
            >
              <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-lg bg-gradient-to-br from-slate-500 to-slate-600 flex items-center justify-center mr-2.5 sm:mr-3 shadow-sm">
                <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className="small-text font-medium truncate">Нов продукт</p>
                <p className="tiny-text text-muted-foreground hidden sm:block">Добавете услуга</p>
              </div>
            </Link>
          </CardContent>
        </Card>

        {/* Recent Invoices */}
        <Card className="lg:col-span-2 border border-border/50 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-3 px-3 sm:px-6 pt-3 sm:pt-6">
            <div className="min-w-0 flex-1">
              <CardTitle className="card-title">Последни фактури</CardTitle>
              <CardDescription className="card-description">Най-новите фактури</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild className="tiny-text flex-shrink-0">
              <Link href="/invoices" className="flex items-center gap-1">
                <span className="hidden sm:inline">Всички</span>
                <ArrowUpRight className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
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

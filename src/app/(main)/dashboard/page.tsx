import Link from "next/link";
import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { FileText, Users, Package, CreditCard, Clock, DollarSign, ArrowUpRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { APP_NAME } from "@/config/constants";
import { prisma } from "@/lib/db";
import { format } from "date-fns";
import type { Prisma } from "@prisma/client";

type InvoiceStatus = "DRAFT" | "UNPAID" | "PAID" | "OVERDUE" | "CANCELLED";

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

type InvoiceCountResult = {
  status: InvoiceStatus;
  _count: {
    id: number;
  };
};

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    redirect("/signin");
  }
  
  // Get recent invoices
  const recentInvoices = await prisma.invoice.findMany({
    where: {
      userId: session.user.id
    },
    include: {
      client: true
    },
    orderBy: {
      issueDate: 'desc'
    },
    take: 5
  }) as InvoiceWithClient[];
  
  // Get invoice stats
  const invoiceCounts = await prisma.invoice.groupBy({
    by: ['status'],
    where: {
      userId: session.user.id
    },
    _count: {
      id: true
    }
  }) as InvoiceCountResult[];
  
  const counts = {
    total: invoiceCounts.reduce((acc: number, curr: InvoiceCountResult) => acc + curr._count.id, 0),
    paid: invoiceCounts.find((i: InvoiceCountResult) => i.status === 'PAID')?._count.id || 0,
    unpaid: invoiceCounts.find((i: InvoiceCountResult) => i.status === 'UNPAID')?._count.id || 0,
    overdue: invoiceCounts.find((i: InvoiceCountResult) => i.status === 'OVERDUE')?._count.id || 0
  };
  
  // Get total revenue from paid invoices
  const revenue = await prisma.invoice.aggregate({
    where: {
      userId: session.user.id,
      status: 'PAID'
    },
    _sum: {
      total: true
    }
  });
  
  const totalRevenue = Number(revenue._sum.total || 0);
  
  // Get client count
  const clientCount = await prisma.client.count({
    where: {
      userId: session.user.id
    }
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Табло</h1>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/invoices/new">Създаване на фактура</Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 mb-8 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Приходи</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{totalRevenue.toFixed(2)} лв.</div>
                <p className="text-xs text-muted-foreground">От платени фактури</p>
              </div>
              <div className="p-2 rounded-full bg-primary/10 text-primary">
                <DollarSign className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Фактури</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{counts.total}</div>
                <p className="text-xs text-muted-foreground">{counts.paid} платени, {counts.unpaid} неплатени, {counts.overdue} просрочени</p>
              </div>
              <div className="p-2 rounded-full bg-primary/10 text-primary">
                <FileText className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Клиенти</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{clientCount}</div>
                <p className="text-xs text-muted-foreground">Общо клиенти</p>
              </div>
              <div className="p-2 rounded-full bg-primary/10 text-primary">
                <Users className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Чакащи плащания</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{(counts.unpaid + counts.overdue) * 100} лв.</div>
                <p className="text-xs text-muted-foreground">В {counts.unpaid + counts.overdue} фактури</p>
              </div>
              <div className="p-2 rounded-full bg-primary/10 text-primary">
                <ArrowUpRight className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Invoices */}
      <Card className="shadow-md">
        <CardHeader className="pb-2">
          <CardTitle>Последни фактури</CardTitle>
          <CardDescription>Най-новите фактури за всички клиенти</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left pb-3 px-2">Фактура</th>
                  <th className="text-left pb-3 px-2">Клиент</th>
                  <th className="text-left pb-3 px-2">Дата</th>
                  <th className="text-left pb-3 px-2">Сума</th>
                  <th className="text-left pb-3 px-2">Статус</th>
                  <th className="text-right pb-3 px-2">Действия</th>
                </tr>
              </thead>
              <tbody>
                {recentInvoices.map((invoice: InvoiceWithClient) => (
                  <tr key={invoice.id} className="border-b hover:bg-muted/50">
                    <td className="py-3 px-2">{invoice.invoiceNumber}</td>
                    <td className="py-3 px-2">{invoice.client.name}</td>
                    <td className="py-3 px-2">{format(invoice.issueDate, 'dd.MM.yyyy')}</td>
                    <td className="py-3 px-2">{Number(invoice.total).toFixed(2)} лв.</td>
                    <td className="py-3 px-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusStyles(invoice.status)}`}>
                        {getStatusText(invoice.status)}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/invoices/${invoice.id}`}>Преглед</Link>
                      </Button>
                    </td>
                  </tr>
                ))}
                {recentInvoices.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-muted-foreground">
                      Не са намерени фактури. Създайте първата си фактура, за да започнете.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {recentInvoices.length > 0 && (
            <div className="flex justify-end mt-4">
              <Button variant="outline" size="sm" asChild>
                <Link href="/invoices">Преглед на всички фактури</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function getStatusStyles(status: string) {
  switch (status) {
    case "PAID":
      return "bg-green-100 text-green-800";
    case "UNPAID":
      return "bg-amber-100 text-amber-800";
    case "OVERDUE":
      return "bg-red-100 text-red-800";
    case "DRAFT":
      return "bg-slate-100 text-slate-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

function getStatusText(status: string) {
  switch (status) {
    case "PAID":
      return "Платена";
    case "UNPAID":
      return "Неплатена";
    case "OVERDUE":
      return "Просрочена";
    case "DRAFT":
      return "Чернова";
    default:
      return status;
  }
} 
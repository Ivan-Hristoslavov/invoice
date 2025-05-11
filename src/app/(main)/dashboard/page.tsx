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
import { Invoice, InvoiceStatus } from "@prisma/client";

export const metadata: Metadata = {
  title: `Dashboard | ${APP_NAME}`,
  description: "Manage your account and view your dashboard",
};

type InvoiceWithClient = Invoice & {
  client: {
    id: string;
    name: string;
  };
};

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
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/invoices/new">Create Invoice</Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 mb-8 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">${totalRevenue.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">From paid invoices</p>
              </div>
              <div className="p-2 rounded-full bg-primary/10 text-primary">
                <DollarSign className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{counts.total}</div>
                <p className="text-xs text-muted-foreground">{counts.paid} paid, {counts.unpaid} unpaid, {counts.overdue} overdue</p>
              </div>
              <div className="p-2 rounded-full bg-primary/10 text-primary">
                <FileText className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Clients</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{clientCount}</div>
                <p className="text-xs text-muted-foreground">Total clients</p>
              </div>
              <div className="p-2 rounded-full bg-primary/10 text-primary">
                <Users className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">${(counts.unpaid + counts.overdue) * 100}</div>
                <p className="text-xs text-muted-foreground">Across {counts.unpaid + counts.overdue} invoices</p>
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
          <CardTitle>Recent Invoices</CardTitle>
          <CardDescription>Latest invoices across all clients</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left pb-3 px-2">Invoice</th>
                  <th className="text-left pb-3 px-2">Client</th>
                  <th className="text-left pb-3 px-2">Date</th>
                  <th className="text-left pb-3 px-2">Amount</th>
                  <th className="text-left pb-3 px-2">Status</th>
                  <th className="text-right pb-3 px-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {recentInvoices.map((invoice: InvoiceWithClient) => (
                  <tr key={invoice.id} className="border-b hover:bg-muted/50">
                    <td className="py-3 px-2">{invoice.invoiceNumber}</td>
                    <td className="py-3 px-2">{invoice.client.name}</td>
                    <td className="py-3 px-2">{format(invoice.issueDate, 'MMM dd, yyyy')}</td>
                    <td className="py-3 px-2">${Number(invoice.total).toFixed(2)}</td>
                    <td className="py-3 px-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusStyles(invoice.status)}`}>
                        {invoice.status}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/invoices/${invoice.id}`}>View</Link>
                      </Button>
                    </td>
                  </tr>
                ))}
                {recentInvoices.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-muted-foreground">
                      No invoices found. Create your first invoice to get started.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {recentInvoices.length > 0 && (
            <div className="flex justify-end mt-4">
              <Button variant="outline" size="sm" asChild>
                <Link href="/invoices">View all invoices</Link>
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
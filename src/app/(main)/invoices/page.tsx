import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { FileText, Plus, Search, Upload, Download } from "lucide-react";
import { Input } from "@/components/ui/input";
import { prisma } from "@/lib/db";
import { format } from "date-fns";
import { checkPermission } from "@/lib/permissions";
import ExportDialogWrapper from "./ExportDialogWrapper";

export default async function InvoicesPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
          <p className="text-muted-foreground mb-6">Please sign in to access invoices</p>
          <Button asChild>
            <Link href="/signin">Sign In</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Check if user has permission to create invoices
  const canCreateInvoices = await checkPermission("invoice:create");

  // Fetch invoices from the database
  const invoices = await prisma.invoice.findMany({
    where: {
      userId: session.user.id
    },
    include: {
      client: true
    },
    orderBy: {
      issueDate: 'desc'
    }
  });

  // Fetch clients and companies for export dialog
  const clients = await prisma.client.findMany({
    where: {
      userId: session.user.id,
    },
    select: {
      id: true,
      name: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  const companies = await prisma.company.findMany({
    where: {
      userId: session.user.id,
    },
    select: {
      id: true,
      name: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
        <h1 className="text-3xl font-bold">Invoices</h1>
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search invoices..."
              className="w-full pl-8 sm:w-[300px]"
            />
          </div>
          {canCreateInvoices && (
            <>
              <Button variant="outline" asChild>
                <Link href="/invoices/import">
                  <Upload className="mr-2 h-4 w-4" />
                  Import
                </Link>
              </Button>
              <Button asChild>
                <Link href="/invoices/new">
                  <Plus className="mr-2 h-4 w-4" />
                  New Invoice
                </Link>
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Invoice Actions Card */}
        {canCreateInvoices && (
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-4">
                  <div className="bg-primary/10 p-3 rounded-full">
                    <Plus className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium">Create Invoice</h3>
                    <p className="text-sm text-muted-foreground">Create a new invoice manually</p>
                    <Button size="sm" className="mt-2" asChild>
                      <Link href="/invoices/new">New Invoice</Link>
                    </Button>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="bg-primary/10 p-3 rounded-full">
                    <Upload className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium">Import Invoices</h3>
                    <p className="text-sm text-muted-foreground">Import multiple invoices from CSV</p>
                    <Button size="sm" className="mt-2" asChild>
                      <Link href="/invoices/import">Import CSV</Link>
                    </Button>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="bg-primary/10 p-3 rounded-full">
                    <Download className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium">Export Invoices</h3>
                    <p className="text-sm text-muted-foreground">Export invoices to CSV or PDF</p>
                    <ExportDialogWrapper clients={clients} companies={companies} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>All Invoices</CardTitle>
            <CardDescription>
              Manage your invoices and track payments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="px-4 py-3 text-left font-medium">Invoice</th>
                    <th className="px-4 py-3 text-left font-medium">Client</th>
                    <th className="px-4 py-3 text-left font-medium">Issue Date</th>
                    <th className="px-4 py-3 text-left font-medium">Due Date</th>
                    <th className="px-4 py-3 text-left font-medium">Amount</th>
                    <th className="px-4 py-3 text-left font-medium">Status</th>
                    <th className="px-4 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((invoice) => (
                    <tr key={invoice.id} className="border-b hover:bg-muted/50">
                      <td className="px-4 py-3 text-xs sm:text-sm">{invoice.invoiceNumber}</td>
                      <td className="px-4 py-3 text-xs sm:text-sm">{invoice.client.name}</td>
                      <td className="px-4 py-3 text-xs sm:text-sm">{format(invoice.issueDate, 'MMM dd, yyyy')}</td>
                      <td className="px-4 py-3 text-xs sm:text-sm">{format(invoice.dueDate, 'MMM dd, yyyy')}</td>
                      <td className="px-4 py-3 text-xs sm:text-sm">${Number(invoice.total).toFixed(2)}</td>
                      <td className="px-4 py-3 text-xs sm:text-sm">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusStyles(invoice.status)}`}>
                          {invoice.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs sm:text-sm">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/invoices/${invoice.id}`}>
                              View
                            </Link>
                          </Button>
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/invoices/${invoice.id}/edit`}>
                              Edit
                            </Link>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {invoices.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-6 text-center text-muted-foreground">
                        No invoices found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
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
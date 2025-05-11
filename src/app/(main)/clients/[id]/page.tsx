import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ArrowLeft, Building, Mail, Phone, Globe, FileText, Edit, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/db";
import { format } from "date-fns";
import { Metadata } from "next";
import { APP_NAME } from "@/config/constants";

// Generate dynamic metadata
export async function generateMetadata(
  { params }: { params: { id: string } }
): Promise<Metadata> {
  const client = await getClient(params.id);
  
  if (!client) {
    return {
      title: `Client Not Found | ${APP_NAME}`,
    };
  }
  
  return {
    title: `${client.name} | ${APP_NAME}`,
    description: `View and manage ${client.name}'s profile and invoices`,
  };
}

// Helper function to get client data
async function getClient(id: string) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return null;
  }
  
  const client = await prisma.client.findUnique({
    where: {
      id,
      userId: session.user.id,
    }
  });
  
  return client;
}

export default async function ClientDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
          <p className="text-muted-foreground mb-6">Please sign in to access client details</p>
          <Button asChild>
            <Link href="/signin">Sign In</Link>
          </Button>
        </div>
      </div>
    );
  }
  
  const client = await getClient(params.id);
  
  if (!client) {
    notFound();
  }
  
  // Get client's invoices
  const invoices = await prisma.invoice.findMany({
    where: {
      clientId: client.id,
      userId: session.user.id,
    },
    orderBy: {
      issueDate: 'desc',
    },
    take: 5,
  });
  
  // Calculate stats
  const totalInvoices = invoices.length;
  const paidInvoices = invoices.filter(inv => inv.status === 'PAID').length;
  const totalAmount = invoices.reduce((sum, inv) => sum + Number(inv.total), 0);
  const paidAmount = invoices
    .filter(inv => inv.status === 'PAID')
    .reduce((sum, inv) => sum + Number(inv.total), 0);
  
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/clients">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Clients
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">{client.name}</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/clients/${client.id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/invoices/new?client=${client.id}`}>
              <FileText className="mr-2 h-4 w-4" />
              New Invoice
            </Link>
          </Button>
        </div>
      </div>
      
      <div className="grid gap-6 md:grid-cols-3">
        {/* Client Information */}
        <div className="space-y-6 md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Client Information</CardTitle>
              <CardDescription>Contact and business details</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Contact</p>
                  <div className="flex items-center gap-2">
                    {client.email && (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span>{client.email}</span>
                      </div>
                    )}
                  </div>
                  {client.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{client.phone}</span>
                    </div>
                  )}
                </div>
                
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Address</p>
                  {client.address && <p className="text-sm">{client.address}</p>}
                  {(client.city || client.state || client.zipCode) && (
                    <p className="text-sm">
                      {[client.city, client.state, client.zipCode].filter(Boolean).join(", ")}
                    </p>
                  )}
                  {client.country && (
                    <div className="flex items-center gap-2 text-sm">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <span>{client.country}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Business Information</p>
                  {client.vatNumber && (
                    <p className="text-sm">
                      <span className="text-muted-foreground">VAT:</span> {client.vatNumber}
                    </p>
                  )}
                  {client.taxIdNumber && (
                    <p className="text-sm">
                      <span className="text-muted-foreground">Tax ID:</span> {client.taxIdNumber}
                    </p>
                  )}
                </div>
                
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Preferences</p>
                  <p className="text-sm">
                    <span className="text-muted-foreground">Language:</span>{" "}
                    {client.locale === "en" ? "English" : 
                     client.locale === "bg" ? "Bulgarian" :
                     client.locale === "es" ? "Spanish" : 
                     client.locale === "fr" ? "French" : 
                     client.locale === "de" ? "German" : client.locale}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Recent Invoices */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Invoices</CardTitle>
              <CardDescription>The most recent invoices for this client</CardDescription>
            </CardHeader>
            <CardContent>
              {invoices.length === 0 ? (
                <div className="py-6 text-center">
                  <p className="text-muted-foreground">No invoices yet</p>
                  <Button size="sm" asChild className="mt-4">
                    <Link href={`/invoices/new?client=${client.id}`}>
                      <FileText className="mr-2 h-4 w-4" />
                      Create Invoice
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left pb-3 px-2">Invoice</th>
                        <th className="text-left pb-3 px-2">Date</th>
                        <th className="text-left pb-3 px-2">Amount</th>
                        <th className="text-left pb-3 px-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoices.map((invoice) => (
                        <tr key={invoice.id} className="border-b hover:bg-muted/50">
                          <td className="py-3 px-2">
                            <Link href={`/invoices/${invoice.id}`} className="text-primary hover:underline">
                              {invoice.invoiceNumber}
                            </Link>
                          </td>
                          <td className="py-3 px-2">{format(invoice.issueDate, "MMM dd, yyyy")}</td>
                          <td className="py-3 px-2">${Number(invoice.total).toFixed(2)}</td>
                          <td className="py-3 px-2">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusStyles(invoice.status)}`}>
                              {invoice.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {invoices.length > 0 && (
                <div className="flex justify-end mt-4">
                  <Button size="sm" variant="outline" asChild>
                    <Link href={`/invoices?client=${client.id}`}>View All</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Stats */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Client Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Total Invoices</p>
                <p className="text-3xl font-bold">{totalInvoices}</p>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Paid Invoices</p>
                <p className="text-3xl font-bold text-green-600">{paidInvoices}</p>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Total Billed</p>
                <p className="text-3xl font-bold">${totalAmount.toFixed(2)}</p>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Total Paid</p>
                <p className="text-3xl font-bold text-green-600">${paidAmount.toFixed(2)}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button className="w-full" asChild>
                <Link href={`/invoices/new?client=${client.id}`}>
                  <FileText className="mr-2 h-4 w-4" />
                  New Invoice
                </Link>
              </Button>
              <Button variant="outline" className="w-full" asChild>
                <Link href={`/clients/${client.id}/edit`}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Client
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
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
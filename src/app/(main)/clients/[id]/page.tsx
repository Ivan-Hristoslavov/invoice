import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ArrowLeft, Building, Mail, Phone, Globe, FileText, Edit, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createAdminClient } from "@/lib/supabase/server";
import { format } from "date-fns";
import { Metadata } from "next";
import { APP_NAME } from "@/config/constants";

// Define the invoice status type
type InvoiceStatus = 'DRAFT' | 'ISSUED' | 'PAID' | 'VOIDED' | 'CANCELLED';

// Define the invoice type
interface Invoice {
  id: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  status: InvoiceStatus;
  total: number;
  clientId: string;
  companyId: string;
  userId: string;
  subtotal: number;
  taxAmount: number;
  discount?: number;
  notes?: string;
  termsAndConditions?: string;
  currency: string;
  locale: string;
  createdAt: string;
  updatedAt: string;
}

// Generate dynamic metadata
export async function generateMetadata(props: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await props.params;
  const client = await getClient(id);
  
  if (!client) {
    return {
      title: `Клиентът не е намерен | ${APP_NAME}`,
    };
  }
  
  return {
    title: `${client.name} | ${APP_NAME}`,
    description: `Преглед и управление на профила и фактурите на ${client.name}`,
  };
}

// Helper function to get client data
async function getClient(id: string) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return null;
  }
  
  const supabase = createAdminClient();
  const { data: client, error } = await supabase
    .from("Client")
    .select("*")
    .eq("id", id)
    .eq("userId", session.user.id)
    .single();
  
  if (error || !client) {
    return null;
  }
  
  return client;
}

export default async function ClientDetailPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Достъпът е отказан</h2>
          <p className="text-muted-foreground mb-6">Моля, влезте в системата, за да имате достъп до детайлите на клиента</p>
          <Button asChild>
            <Link href="/signin">Вход</Link>
          </Button>
        </div>
      </div>
    );
  }
  
  const client = await getClient(params.id);
  
  if (!client) {
    notFound();
  }
  
  const supabase = createAdminClient();
  
  // Get client's invoices
  const { data: invoices } = await supabase
    .from("Invoice")
    .select("*")
    .eq("clientId", client.id)
    .eq("userId", session.user.id)
    .order("issueDate", { ascending: false })
    .limit(5);
  
  const invoiceList = (invoices || []) as Invoice[];
  
  // Calculate stats
  const totalInvoices = invoiceList.length;
  const issuedInvoices = invoiceList.filter((inv) => inv.status === 'ISSUED').length;
  const totalAmount = invoiceList.reduce((sum, inv) => sum + Number(inv.total), 0);
  const issuedAmount = invoiceList
    .filter((inv) => inv.status === 'ISSUED')
    .reduce((sum, inv) => sum + Number(inv.total), 0);
  
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/clients" className="flex items-center whitespace-nowrap">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Назад към клиентите
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">{client.name}</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild className="h-9 px-3.5 whitespace-nowrap">
            <Link href={`/clients/${client.id}/edit`} className="flex items-center whitespace-nowrap">
              <Edit className="mr-2 h-4 w-4" />
              Редактиране
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild className="h-9 px-3.5 whitespace-nowrap">
            <Link href={`/invoices/new?client=${client.id}`} className="flex items-center whitespace-nowrap">
              <FileText className="mr-2 h-4 w-4" />
              Нова фактура
            </Link>
          </Button>
        </div>
      </div>
      
      <div className="grid gap-6 md:grid-cols-3">
        {/* Client Information */}
        <div className="space-y-6 md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Информация за клиента</CardTitle>
              <CardDescription>Контакти и бизнес детайли</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Контакт</p>
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
                  <p className="text-sm font-medium text-muted-foreground">Адрес</p>
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
                  <p className="text-sm font-medium text-muted-foreground">Бизнес информация</p>
                  {client.vatNumber && (
                    <p className="text-sm">
                      <span className="text-muted-foreground">ДДС номер:</span> {client.vatNumber}
                    </p>
                  )}
                  {client.taxIdNumber && (
                    <p className="text-sm">
                      <span className="text-muted-foreground">Данъчен номер:</span> {client.taxIdNumber}
                    </p>
                  )}
                </div>
                
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Предпочитания</p>
                  <p className="text-sm">
                    <span className="text-muted-foreground">Език:</span>{" "}
                    {client.locale === "en" ? "Английски" : 
                     client.locale === "bg" ? "Български" :
                     client.locale === "es" ? "Испански" : 
                     client.locale === "fr" ? "Френски" : 
                     client.locale === "de" ? "Немски" : client.locale}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Recent Invoices */}
          <Card>
            <CardHeader>
              <CardTitle>Последни фактури</CardTitle>
              <CardDescription>Най-новите фактури за този клиент</CardDescription>
            </CardHeader>
            <CardContent>
              {invoiceList.length === 0 ? (
                <div className="py-6 text-center">
                  <p className="text-muted-foreground">Все още няма фактури</p>
                  <Button size="sm" asChild className="mt-4">
                    <Link href={`/invoices/new?client=${client.id}`} className="flex items-center whitespace-nowrap">
                      <FileText className="mr-2 h-4 w-4" />
                      Създаване на фактура
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border/50">
                        <th className="text-left pb-3 px-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">Фактура</th>
                        <th className="text-left pb-3 px-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">Дата</th>
                        <th className="text-left pb-3 px-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">Сума</th>
                        <th className="text-left pb-3 px-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">Статус</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoiceList.map((invoice) => (
                        <tr key={invoice.id} className="border-b hover:bg-muted/50">
                          <td className="py-3 px-2">
                            <Link href={`/invoices/${invoice.id}`} className="text-primary hover:underline">
                              {invoice.invoiceNumber}
                            </Link>
                          </td>
                          <td className="py-3 px-2">{format(new Date(invoice.issueDate), "dd.MM.yyyy")}</td>
                          <td className="py-3 px-2">{Number(invoice.total).toFixed(2)} €</td>
                          <td className="py-3 px-2">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusStyles(invoice.status)}`}>
                              {getStatusText(invoice.status)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {invoiceList.length > 0 && (
                <div className="flex justify-end mt-4">
                  <Button size="sm" variant="outline" asChild>
                    <Link href={`/invoices?client=${client.id}`} className="flex items-center whitespace-nowrap">Преглед на всички</Link>
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
              <CardTitle>Обобщение на клиента</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Общо фактури</p>
                <p className="text-3xl font-bold">{totalInvoices}</p>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Издадени фактури</p>
                <p className="text-3xl font-bold text-emerald-600">{issuedInvoices}</p>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Общо сума</p>
                <p className="text-3xl font-bold">{totalAmount.toFixed(2)} €</p>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Издадена стойност</p>
                <p className="text-3xl font-bold text-emerald-600">{issuedAmount.toFixed(2)} €</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Действия</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button className="w-full h-11 px-4 text-sm whitespace-nowrap" asChild>
                <Link href={`/invoices/new?client=${client.id}`} className="flex items-center whitespace-nowrap">
                  <FileText className="mr-2 h-4 w-4" />
                  Нова фактура
                </Link>
              </Button>
              <Button variant="outline" className="w-full h-11 px-4 text-sm whitespace-nowrap" asChild>
                <Link href={`/clients/${client.id}/edit`} className="flex items-center whitespace-nowrap">
                  <Edit className="mr-2 h-4 w-4" />
                  Редактиране
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function getStatusStyles(status: InvoiceStatus) {
  switch (status) {
    case "ISSUED":
    case "PAID":
      return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400";
    case "DRAFT":
      return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400";
    case "VOIDED":
      return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400";
    case "CANCELLED":
      return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400";
  }
}

function getStatusText(status: InvoiceStatus) {
  switch (status) {
    case "ISSUED":
    case "PAID":
      return "Издадена";
    case "DRAFT":
      return "Чернова";
    case "VOIDED":
      return "Анулирана";
    case "CANCELLED":
      return "Отказана";
    default:
      return status;
  }
}

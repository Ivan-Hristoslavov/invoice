import Link from "next/link";
import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { 
  ArrowLeft,
  Download,
  Printer,
  Receipt,
  FileText,
  Calendar,
  Building,
  Users,
  Info
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { APP_NAME } from "@/config/constants";
import { createAdminClient } from "@/lib/supabase/server";
import { format } from "date-fns";
import { bg } from "date-fns/locale";

export const metadata: Metadata = {
  title: `Дебитно известие | ${APP_NAME}`,
  description: "Детайли за дебитно известие",
};

interface DebitNoteItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  subtotal: number;
  taxAmount: number;
  total: number;
}

export default async function DebitNoteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect("/signin");
  }

  const supabase = createAdminClient();
  
  // Fetch debit note with items
  const { data: debitNote, error } = await supabase
    .from("DebitNote")
    .select(`
      *,
      items:DebitNoteItem(*)
    `)
    .eq("id", id)
    .eq("userId", session.user.id)
    .single();

  if (error || !debitNote) {
    notFound();
  }

  // Fetch related data with all fields
  const [invoiceResult, clientResult, companyResult] = await Promise.all([
    debitNote.invoiceId
      ? supabase.from("Invoice").select("id, invoiceNumber, issueDate").eq("id", debitNote.invoiceId).eq("userId", session.user.id).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    debitNote.clientId
      ? supabase
          .from("Client")
          .select("id, name, email, phone, address, city, country, bulstatNumber, vatNumber, vatRegistrationNumber, mol")
          .eq("id", debitNote.clientId)
          .eq("userId", session.user.id)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    debitNote.companyId
      ? supabase
          .from("Company")
          .select("id, name, email, phone, address, city, country, bulstatNumber, vatRegistrationNumber, mol")
          .eq("id", debitNote.companyId)
          .eq("userId", session.user.id)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);

  const invoice = invoiceResult.data;
  const client = clientResult.data;
  const company = companyResult.data;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('bg-BG', {
      style: 'currency',
      currency: debitNote.currency || 'EUR',
    }).format(amount);
  };

  return (
    <div className="max-w-[1400px] mx-auto px-4">
      {/* Header */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/debit-notes" className="flex items-center whitespace-nowrap">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Назад
            </Link>
          </Button>
        </div>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-bold">
              Дебитно известие #{debitNote.debitNoteNumber}
            </h1>
            <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
              <Receipt className="h-3 w-3 mr-1" />
              Издадено
            </Badge>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/api/debit-notes/${id}/export-pdf`} target="_blank" className="flex items-center whitespace-nowrap">
                <Printer className="w-4 h-4 mr-1.5" />
                Принт
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/api/debit-notes/${id}/export-pdf`} target="_blank" className="flex items-center whitespace-nowrap">
                <Download className="w-4 h-4 mr-1.5" />
                PDF
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          {/* Main Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Info className="h-5 w-5" />
                Информация
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Reference Invoice */}
              {invoice && (
                <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                    Дебитно известие към фактура:
                  </p>
                  <Link 
                    href={`/invoices/${invoice.id}`}
                    className="text-sm text-amber-600 hover:underline flex items-center gap-1 mt-1"
                  >
                    <FileText className="h-4 w-4" />
                    {invoice.invoiceNumber} от {format(new Date(invoice.issueDate), 'd MMM yyyy', { locale: bg })}
                  </Link>
                </div>
              )}

              {/* Reason */}
              {debitNote.reason && (
                <div>
                  <h3 className="font-medium mb-2">Причина за издаване</h3>
                  <p className="text-muted-foreground">{debitNote.reason}</p>
                </div>
              )}

              <div className="grid gap-6 md:grid-cols-2">
                {/* Company Info */}
                <div>
                  <h3 className="font-medium mb-3 flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    Издател
                  </h3>
                  {company ? (
                    <div className="space-y-1 text-sm">
                      {company.name && <p className="font-medium">Фирма: {company.name}</p>}
                      {company.bulstatNumber && <p>ЕИК: {company.bulstatNumber}</p>}
                      {company.vatRegistrationNumber && <p>ДДС №: {company.vatRegistrationNumber}</p>}
                      {company.mol && <p>МОЛ: {company.mol}</p>}
                      {company.address && <p>Адрес: {company.address}</p>}
                      {company.city && <p>Град: {company.city}{company.country ? `, ${company.country}` : ''}</p>}
                      {company.phone && <p>Тел.: {company.phone}</p>}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">Няма информация</p>
                  )}
                </div>

                {/* Client Info */}
                <div>
                  <h3 className="font-medium mb-3 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Получател
                  </h3>
                  {client ? (
                    <div className="space-y-1 text-sm">
                      {client.name && <p className="font-medium">Фирма: {client.name}</p>}
                      {client.bulstatNumber && <p>ЕИК: {client.bulstatNumber}</p>}
                      {(client.vatRegistrationNumber || client.vatNumber) && (
                        <p>ДДС №: {client.vatRegistrationNumber || client.vatNumber}</p>
                      )}
                      {client.mol && <p>МОЛ: {client.mol}</p>}
                      {client.address && <p>Адрес: {client.address}</p>}
                      {client.city && <p>Град: {client.city}{client.country ? `, ${client.country}` : ''}</p>}
                      {client.phone && <p>Тел.: {client.phone}</p>}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">Няма информация</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Items */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Артикули</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-2 font-medium">Описание</th>
                      <th className="text-right py-3 px-2 font-medium">К-во</th>
                      <th className="text-right py-3 px-2 font-medium">Ед. цена</th>
                      <th className="text-right py-3 px-2 font-medium">ДДС %</th>
                      <th className="text-right py-3 px-2 font-medium">Общо</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(debitNote.items || []).map((item: DebitNoteItem) => (
                      <tr key={item.id} className="border-b last:border-0">
                        <td className="py-3 px-2">{item.description}</td>
                        <td className="text-right py-3 px-2">{Number(item.quantity)}</td>
                        <td className="text-right py-3 px-2">{formatCurrency(Number(item.unitPrice))}</td>
                        <td className="text-right py-3 px-2">{Number(item.taxRate)}%</td>
                        <td className="text-right py-3 px-2 font-medium">{formatCurrency(Number(item.total))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Summary Card */}
          <Card className="bg-emerald-500/5 border-emerald-500/20">
            <CardHeader>
              <CardTitle className="text-lg text-emerald-600">Сума</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Сума без ДДС</span>
                <span>{formatCurrency(Number(debitNote.subtotal))}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">ДДС</span>
                <span>{formatCurrency(Number(debitNote.taxAmount))}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>Общо</span>
                <span className="text-emerald-600">+{formatCurrency(Number(debitNote.total))}</span>
              </div>
            </CardContent>
          </Card>

          {/* Details Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Детайли
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Дата на издаване</span>
                <span>{format(new Date(debitNote.issueDate), 'd MMM yyyy', { locale: bg })}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Валута</span>
                <span>{debitNote.currency || 'EUR'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Създадено</span>
                <span>{format(new Date(debitNote.createdAt), 'd MMM yyyy, HH:mm', { locale: bg })}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

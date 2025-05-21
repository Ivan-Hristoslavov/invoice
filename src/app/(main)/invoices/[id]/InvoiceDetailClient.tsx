"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  ArrowLeft,
  Download,
  Send,
  Copy,
  CreditCard,
  Clock,
  AlertTriangle,
  CheckCircle,
  Paperclip,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";
import DocumentsTab from "@/components/invoice/DocumentsTab";
import { getDocuments } from "@/lib/services/document-service";
import { exportInvoiceAsPdf } from "@/lib/invoice-export";
import { createInvoicePaymentLink } from "@/lib/stripe";

type InvoiceItem = {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  subtotal: number;
  taxAmount: number;
  total: number;
};

type Payment = {
  id: string;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  reference?: string;
  notes?: string;
  createdAt: string;
};

type Document = {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  createdAt: string;
};

type Invoice = {
  id: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  status: string;
  subtotal: number;
  taxAmount: number;
  discount?: number;
  total: number;
  amountDue: number;
  totalPaid: number;
  notes?: string;
  termsAndConditions?: string;
  currency: string;
  client: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    country?: string;
  };
  company: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
  };
  items: InvoiceItem[];
  payments: Payment[];
};

interface InvoiceDetailClientProps {
  initialInvoice: Invoice;
}

export default function InvoiceDetailClient({ initialInvoice }: InvoiceDetailClientProps) {
  const router = useRouter();
  const [invoice] = useState<Invoice>(initialInvoice);
  const [activeTab, setActiveTab] = useState("details");
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  useEffect(() => {
    return () => {
      setIsSendingEmail(false);
    };
  }, []);

  const handleExportPdf = async () => {
    try {
      await exportInvoiceAsPdf(invoice.id);
    } catch (error) {
      console.error("Error exporting PDF:", error);
      toast.error("Грешка при експортиране на PDF");
    }
  };

  const handleSendInvoiceOnly = async () => {
    try {
      setIsSendingEmail(true);
      
      await fetch(`/api/invoices/${invoice.id}/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'invoice_only'
        }),
      });
      
      toast.success("Фактурата е изпратена успешно", {
        description: `Фактурата е изпратена на ${invoice.client.email}`,
      });
    } catch (error) {
      console.error('Error sending invoice:', error);
      toast.error("Грешка при изпращане на фактурата");
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleSendInvoiceWithPayment = async () => {
    try {
      setIsSendingEmail(true);
      const paymentLink = await createInvoicePaymentLink(
        invoice.id,
        Number(invoice.total),
        invoice.currency,
        invoice.client.email || ''
      );
      
      await fetch(`/api/invoices/${invoice.id}/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'invoice_with_payment',
          paymentLink,
        }),
      });
      
      toast.success("Фактурата е изпратена успешно", {
        description: `Фактурата с информация за плащане е изпратена на ${invoice.client.email}`,
      });
    } catch (error) {
      console.error('Error sending invoice with payment:', error);
      toast.error("Грешка при изпращане на фактурата");
    } finally {
      setIsSendingEmail(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PAID":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "UNPAID":
        return <Clock className="h-4 w-4 text-amber-500" />;
      case "OVERDUE":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case "DRAFT":
        return <AlertTriangle className="h-4 w-4 text-slate-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PAID":
        return "bg-green-50 text-green-700 border-green-200";
      case "UNPAID":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "OVERDUE":
        return "bg-red-50 text-red-700 border-red-200";
      case "DRAFT":
        return "bg-slate-50 text-slate-700 border-slate-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "PAID":
        return "Платена";
      case "UNPAID":
        return "Неплатена";
      case "OVERDUE":
        return "Просрочена";
      case "DRAFT":
        return "Чернова";
      case "CANCELLED":
        return "Отказана";
      default:
        return status;
    }
  };

  const renderClientCommunication = () => {
    if (!invoice.client.email) return null;
    
    return (
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-xl">
            <Send className="w-6 h-6" />
            Комуникация с клиента
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <Button 
              variant="outline" 
              className="w-full justify-start text-left h-auto py-3"
              onClick={handleSendInvoiceOnly}
              disabled={isSendingEmail}
            >
              <div className="flex items-center gap-4">
                <Send className="w-5 h-5 text-gray-600 flex-shrink-0" />
                <span className="font-medium">
                  {isSendingEmail ? "Изпращане..." : "Изпрати фактура"}
                </span>
              </div>
            </Button>
            
            {(invoice.status === "UNPAID" || invoice.status === "OVERDUE") && (
              <Button
                variant="default"
                className="w-full justify-start text-left h-auto py-3 bg-primary hover:bg-primary/90"
                onClick={handleSendInvoiceWithPayment}
                disabled={isSendingEmail}
              >
                <div className="flex items-center gap-4">
                  <CreditCard className="w-5 h-5 flex-shrink-0" />
                  <span className="font-medium">
                    {isSendingEmail ? "Изпращане..." : "Изпрати с опции за плащане"}
                  </span>
                </div>
              </Button>
            )}
            
            {invoice.status === "PAID" && (
              <Button 
                variant="outline"
                className="w-full justify-start text-left h-auto py-3"
              >
                <div className="flex items-center gap-4">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span className="font-medium">Изпрати разписка</span>
                </div>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="max-w-[1400px] mx-auto px-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/invoices">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Назад към фактурите
            </Link>
          </Button>
          <h1 className="text-2xl sm:text-3xl font-bold">
            Фактура #{invoice.invoiceNumber}
          </h1>
          <div
            className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${getStatusColor(
              invoice.status
            )}`}
          >
            <span className="flex items-center gap-2">
              {getStatusIcon(invoice.status)}
              {getStatusText(invoice.status)}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outline" size="lg" onClick={handleExportPdf}>
            <Download className="w-5 h-5 mr-2" />
            Изтегли PDF
          </Button>
          {invoice.status !== "PAID" && (
            <Button variant="outline" size="lg" asChild>
              <Link href={`/invoices/${invoice.id}/edit`}>
                Редактирай
              </Link>
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        <div className="md:col-span-2 space-y-8">
          <Card className="overflow-hidden">
            <CardHeader className="pb-0">
              <CardTitle className="text-xl">Информация за фактурата</CardTitle>
            </CardHeader>
            <Tabs
              defaultValue="details"
              onValueChange={setActiveTab}
              className="w-full"
            >
              <div className="px-6 pt-4">
                <TabsList className="grid w-full grid-cols-4 mb-2">
                  <TabsTrigger value="details" className="text-base">Детайли</TabsTrigger>
                  <TabsTrigger value="items" className="text-base">Артикули</TabsTrigger>
                  <TabsTrigger value="payments" className="text-base">Плащания</TabsTrigger>
                  <TabsTrigger value="documents" className="text-base">
                    <span className="flex items-center">
                      <Paperclip className="mr-2 h-4 w-4" />
                      Документи
                    </span>
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="details" className="p-6 pt-4">
                <div className="grid gap-8 md:grid-cols-2">
                  <div>
                    <h3 className="font-medium mb-4 text-base">Информация за компанията</h3>
                    <div className="space-y-3 text-base">
                      <p>{invoice.company.name}</p>
                      {invoice.company.email && <p>{invoice.company.email}</p>}
                      {invoice.company.phone && <p>{invoice.company.phone}</p>}
                    </div>
                  </div>
                  <div>
                    <h3 className="font-medium mb-4 text-base">Информация за клиента</h3>
                    <div className="space-y-3 text-base">
                      <p>{invoice.client.name}</p>
                      {invoice.client.email && <p>{invoice.client.email}</p>}
                      {invoice.client.phone && <p>{invoice.client.phone}</p>}
                      {invoice.client.address && (
                        <p>
                          {invoice.client.address}
                          {invoice.client.city && `, ${invoice.client.city}`}
                          {invoice.client.country && `, ${invoice.client.country}`}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid gap-8 md:grid-cols-2 mt-8">
                  <div>
                    <h3 className="font-medium mb-4 text-base">Детайли на фактурата</h3>
                    <div className="space-y-3 text-base">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Номер на фактура</span>
                        <span>{invoice.invoiceNumber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Дата на издаване</span>
                        <span>{format(new Date(invoice.issueDate), "dd.MM.yyyy")}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Дата на плащане</span>
                        <span>{format(new Date(invoice.dueDate), "dd.MM.yyyy")}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Валута</span>
                        <span>{invoice.currency}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="items" className="px-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="px-6 py-3 text-left font-medium">
                          Описание
                        </th>
                        <th className="px-6 py-3 text-right font-medium">
                          Количество
                        </th>
                        <th className="px-6 py-3 text-right font-medium">
                          Единична цена
                        </th>
                        <th className="px-6 py-3 text-right font-medium">
                          Данъчна ставка
                        </th>
                        <th className="px-6 py-3 text-right font-medium">
                          Сума
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoice.items.map((item) => (
                        <tr key={item.id} className="border-b">
                          <td className="px-6 py-3">{item.description}</td>
                          <td className="px-6 py-3 text-right">
                            {Number(item.quantity).toFixed(2)}
                          </td>
                          <td className="px-6 py-3 text-right">
                            {formatCurrency(
                              Number(item.unitPrice),
                              invoice.currency
                            )}
                          </td>
                          <td className="px-6 py-3 text-right">
                            {Number(item.taxRate)}%
                          </td>
                          <td className="px-6 py-3 text-right">
                            {formatCurrency(
                              Number(item.total),
                              invoice.currency
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-b">
                        <td
                          colSpan={4}
                          className="px-6 py-3 text-right font-medium"
                        >
                          Междинна сума
                        </td>
                        <td className="px-6 py-3 text-right">
                          {formatCurrency(
                            Number(invoice.subtotal),
                            invoice.currency
                          )}
                        </td>
                      </tr>
                      <tr className="border-b">
                        <td
                          colSpan={4}
                          className="px-6 py-3 text-right font-medium"
                        >
                          Данък
                        </td>
                        <td className="px-6 py-3 text-right">
                          {formatCurrency(
                            Number(invoice.taxAmount),
                            invoice.currency
                          )}
                        </td>
                      </tr>
                      {invoice.discount && (
                        <tr className="border-b">
                          <td
                            colSpan={4}
                            className="px-6 py-3 text-right font-medium"
                          >
                            Отстъпка
                          </td>
                          <td className="px-6 py-3 text-right">
                            {formatCurrency(
                              Number(invoice.discount),
                              invoice.currency
                            )}
                          </td>
                        </tr>
                      )}
                      <tr>
                        <td
                          colSpan={4}
                          className="px-6 py-3 text-right font-medium"
                        >
                          Общо
                        </td>
                        <td className="px-6 py-3 text-right font-bold">
                          {formatCurrency(
                            Number(invoice.total),
                            invoice.currency
                          )}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </TabsContent>

              <TabsContent value="payments" className="p-6 pt-2">
                {invoice.payments.length > 0 ? (
                  <div className="space-y-6">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="py-3 text-left font-medium">Дата</th>
                          <th className="py-3 text-left font-medium">Сума</th>
                          <th className="py-3 text-left font-medium">Метод</th>
                          <th className="py-3 text-left font-medium">
                            Референция
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {invoice.payments.map((payment) => (
                          <tr key={payment.id} className="border-b">
                            <td className="py-3">
                              {format(
                                new Date(payment.paymentDate),
                                "dd.MM.yyyy"
                              )}
                            </td>
                            <td className="py-3">
                              {formatCurrency(
                                Number(payment.amount),
                                invoice.currency
                              )}
                            </td>
                            <td className="py-3">
                              {payment.paymentMethod.replace(/_/g, " ")}
                            </td>
                            <td className="py-3">{payment.reference || "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td
                            colSpan={1}
                            className="py-3 text-right font-medium"
                          >
                            Общо платено
                          </td>
                          <td className="py-3 font-medium">
                            {formatCurrency(
                              Number(invoice.totalPaid),
                              invoice.currency
                            )}
                          </td>
                          <td colSpan={2}></td>
                        </tr>
                      </tfoot>
                    </table>

                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/payments/new?invoice=${invoice.id}`}>
                        <CreditCard className="w-4 h-4 mr-2" />
                        Запиши ново плащане
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <h3 className="font-medium mb-2">Няма записани плащания</h3>
                    <p className="text-muted-foreground text-sm mb-4">
                      Все още няма записани плащания за тази фактура.
                    </p>
                    <Button asChild>
                      <Link href={`/payments/new?invoice=${invoice.id}`}>
                        <CreditCard className="w-4 h-4 mr-2" />
                        Запиши плащане
                      </Link>
                    </Button>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="documents" className="p-6 pt-2">
                <DocumentsTab invoiceId={invoice.id} documents={documents} />
              </TabsContent>
            </Tabs>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Действия</CardTitle>
            </CardHeader>
            <CardContent className="space-x-3">
              <Button 
                variant="outline" 
                size="sm" 
                disabled={invoice.status === "PAID"}
                asChild={invoice.status !== "PAID"}
              >
                {invoice.status !== "PAID" ? (
                  <Link href={`/invoices/${invoice.id}/edit`}>Редактиране на фактура</Link>
                ) : (
                  <span>Редактиране на фактура</span>
                )}
              </Button>
              <Button variant="outline" size="sm">
                Маркирай като платена
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={invoice.status === "PAID"}
              >
                Изпрати напомняне
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Обобщение на плащането</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center pb-2">
                  <span className="text-muted-foreground">Междинна сума</span>
                  <span>
                    {formatCurrency(Number(invoice.subtotal), invoice.currency)}
                  </span>
                </div>
                <div className="flex justify-between items-center pb-2">
                  <span className="text-muted-foreground">Данък</span>
                  <span>
                    {formatCurrency(
                      Number(invoice.taxAmount),
                      invoice.currency
                    )}
                  </span>
                </div>
                {invoice.discount && (
                  <div className="flex justify-between items-center pb-2">
                    <span className="text-muted-foreground">Отстъпка</span>
                    <span>
                      -
                      {formatCurrency(
                        Number(invoice.discount),
                        invoice.currency
                      )}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-muted-foreground">Общо</span>
                  <span className="font-bold">
                    {formatCurrency(Number(invoice.total), invoice.currency)}
                  </span>
                </div>
                <div className="flex justify-between items-center pb-2">
                  <span className="text-muted-foreground">Платена сума</span>
                  <span>
                    {formatCurrency(
                      invoice.status === "PAID" 
                        ? (Number(invoice.total) || 0) 
                        : (Number(invoice.totalPaid) || 0),
                      invoice.currency
                    )}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="font-medium">Дължима сума</span>
                  <span className="font-bold text-lg">
                    {formatCurrency(
                      (invoice.status === "UNPAID" || invoice.status === "OVERDUE" || invoice.status === "DRAFT") 
                        ? (Number(invoice.total) || 0)
                        : (Number(invoice.amountDue) || 0),
                      invoice.currency
                    )}
                  </span>
                </div>
              </div>

              {(invoice.status === "UNPAID" || invoice.status === "OVERDUE") &&
                invoice.amountDue > 0 && (
                  <div className="mt-6">
                    <Button className="w-full" asChild>
                      <Link href={`/payments/new?invoice=${invoice.id}`}>
                        <CreditCard className="w-4 h-4 mr-2" />
                        Запиши плащане
                      </Link>
                    </Button>
                  </div>
                )}
            </CardContent>
          </Card>

          {renderClientCommunication()}
        </div>
      </div>
    </div>
  );
} 
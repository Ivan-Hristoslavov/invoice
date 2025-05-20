"use client";

import { useState } from "react";
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
  const [paymentLink, setPaymentLink] = useState("");
  const [showPaymentLinkInput, setShowPaymentLinkInput] = useState(false);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false);

  const handleGeneratePaymentLink = () => {
    const baseUrl = window.location.origin;
    const paymentUrl = `${baseUrl}/pay/${invoice.id}?token=${Math.random()
      .toString(36)
      .substring(2, 15)}`;

    setPaymentLink(paymentUrl);
    setShowPaymentLinkInput(true);

    toast.success("Връзката за плащане е създадена", {
      description: "Връзката е готова за споделяне с клиента.",
    });
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(paymentLink);
    toast.success("Връзката е копирана в клипборда");
  };

  const handleSendPaymentLink = () => {
    toast.success("Връзката за плащане е изпратена", {
      description: `Връзката за плащане е изпратена до ${
        invoice.client.email || "клиента"
      }.`,
    });
  };

  const handleExportPdf = async () => {
    try {
      await exportInvoiceAsPdf(invoice.id);
    } catch (error) {
      console.error("Error exporting PDF:", error);
      toast.error("Грешка при експортиране на PDF");
    }
  };

  const handleStripePayment = async () => {
    try {
      const paymentUrl = await createInvoicePaymentLink(
        invoice.id,
        invoice.amountDue,
        invoice.currency,
        invoice.client.email
      );
      
      // Open payment URL in new window
      window.open(paymentUrl, "_blank");
      
      toast.success("Линк за плащане е генериран", {
        description: "Пренасочване към Stripe за сигурно плащане.",
      });
    } catch (error) {
      console.error("Error creating payment link:", error);
      toast.error("Грешка при създаване на линк за плащане");
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

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <div className="flex items-center gap-2">
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
            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
              invoice.status
            )}`}
          >
            <span className="flex items-center gap-1.5">
              {getStatusIcon(invoice.status)}
              {getStatusText(invoice.status)}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {invoice.status !== "PAID" && (
            <Button onClick={handleStripePayment} className="bg-[#635BFF] hover:bg-[#4B44F3] text-white">
              <CreditCard className="w-4 h-4 mr-2" />
              Плати с карта
            </Button>
          )}
          <Button variant="outline" onClick={handleExportPdf}>
            <Download className="w-4 h-4 mr-2" />
            Изтегли PDF
          </Button>
          {invoice.status !== "PAID" && invoice.status !== "DRAFT" && (
            <Button variant="outline" onClick={handleGeneratePaymentLink}>
              <Send className="w-4 h-4 mr-2" />
              Изпрати за плащане
            </Button>
          )}
          {invoice.status !== "PAID" && (
            <Button variant="outline" asChild>
              <Link href={`/invoices/${invoice.id}/edit`}>
                Редактирай
              </Link>
            </Button>
          )}
        </div>
      </div>

      {showPaymentLinkInput && (
        <Card className="mb-6 border border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <div className="grow">
                <h3 className="text-sm font-medium text-blue-700 mb-1">
                  Връзка за плащане
                </h3>
                <div className="flex items-center gap-2">
                  <Input
                    value={paymentLink}
                    readOnly
                    className="bg-white border-blue-200 focus-visible:ring-blue-500"
                  />
                  <Button variant="outline" size="sm" onClick={handleCopyLink}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              {invoice.client.email && (
                <Button onClick={handleSendPaymentLink}>
                  <Send className="w-4 h-4 mr-2" />
                  Изпрати към клиента
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader className="pb-0">
              <CardTitle>Информация за фактурата</CardTitle>
            </CardHeader>
            <Tabs
              defaultValue="details"
              onValueChange={setActiveTab}
              className="w-full"
            >
              <div className="px-6">
                <TabsList className="grid w-full grid-cols-4 mb-2">
                  <TabsTrigger value="details">Детайли</TabsTrigger>
                  <TabsTrigger value="items">Артикули</TabsTrigger>
                  <TabsTrigger value="payments">Плащания</TabsTrigger>
                  <TabsTrigger value="documents">
                    <span className="flex items-center">
                      <Paperclip className="mr-2 h-4 w-4" />
                      Документи
                    </span>
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="details" className="p-6 pt-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-3">
                      Информация за компанията
                    </h3>
                    <p className="font-medium">{invoice.company.name}</p>
                    {invoice.company.email && (
                      <p className="text-sm">{invoice.company.email}</p>
                    )}
                    {invoice.company.phone && (
                      <p className="text-sm">{invoice.company.phone}</p>
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-3">
                      Информация за клиента
                    </h3>
                    <p className="font-medium">{invoice.client.name}</p>
                    {invoice.client.email && (
                      <p className="text-sm">{invoice.client.email}</p>
                    )}
                    {invoice.client.phone && (
                      <p className="text-sm">{invoice.client.phone}</p>
                    )}
                    {invoice.client.address && (
                      <p className="text-sm mt-1">
                        {invoice.client.address}
                        {invoice.client.city && `, ${invoice.client.city}`}
                        {invoice.client.country &&
                          `, ${invoice.client.country}`}
                      </p>
                    )}
                  </div>
                </div>

                <Separator className="my-6" />

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Номер на фактура
                    </h3>
                    <p>{invoice.invoiceNumber}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Дата на издаване
                    </h3>
                    <p>{format(new Date(invoice.issueDate), "dd.MM.yyyy")}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Дата на плащане
                    </h3>
                    <p>{format(new Date(invoice.dueDate), "dd.MM.yyyy")}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Валута
                    </h3>
                    <p>{invoice.currency}</p>
                  </div>
                </div>

                {(invoice.notes || invoice.termsAndConditions) && (
                  <>
                    <Separator className="my-6" />

                    {invoice.notes && (
                      <div className="mb-4">
                        <h3 className="text-sm font-medium text-muted-foreground mb-2">
                          Бележки
                        </h3>
                        <p className="text-sm whitespace-pre-line">
                          {invoice.notes}
                        </p>
                      </div>
                    )}

                    {invoice.termsAndConditions && (
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-2">
                          Общи условия
                        </h3>
                        <p className="text-sm whitespace-pre-line">
                          {invoice.termsAndConditions}
                        </p>
                      </div>
                    )}
                  </>
                )}
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

          {invoice.client.email && (
            <Card>
              <CardHeader>
                <CardTitle>Комуникация с клиента</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button variant="outline" className="w-full justify-start">
                  <Send className="w-4 h-4 mr-2" />
                  Изпрати фактура
                </Button>
                {(invoice.status === "UNPAID" ||
                  invoice.status === "OVERDUE") && (
                  <Button variant="outline" className="w-full justify-start">
                    <Send className="w-4 h-4 mr-2" />
                    Изпрати напомняне за плащане
                  </Button>
                )}
                {invoice.status === "PAID" && (
                  <Button variant="outline" className="w-full justify-start">
                    <Send className="w-4 h-4 mr-2" />
                    Изпрати разписка
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
} 
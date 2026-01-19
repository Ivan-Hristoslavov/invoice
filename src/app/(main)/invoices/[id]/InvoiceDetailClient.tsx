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
  Printer,
  FileCheck,
  Edit,
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
import { StatusChangeModal } from "@/components/invoice/StatusChangeModal";
import { useSubscriptionLimit } from "@/hooks/useSubscriptionLimit";
import { Lock, Crown } from "lucide-react";
import Link from "next/link";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
// Payment link functionality removed - invoices are for issuance only

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

// Payment type removed - invoices are for issuance only

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
  // Payment fields removed - invoices are for issuance only
  notes?: string;
  termsAndConditions?: string;
  currency: string;
  paymentMethod?: string;
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
  creditNote?: {
    id: string;
    creditNoteNumber: string;
    issueDate: string;
    reason?: string;
  };
};

interface InvoiceDetailClientProps {
  initialInvoice: Invoice;
}

export default function InvoiceDetailClient({ initialInvoice }: InvoiceDetailClientProps) {
  const router = useRouter();
  const [invoice, setInvoice] = useState<Invoice>(initialInvoice);
  const [activeTab, setActiveTab] = useState("details");
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [isChangingStatus, setIsChangingStatus] = useState(false);
  const [showIssueModal, setShowIssueModal] = useState(false);
  
  // Subscription limit check for email sending
  const { canUseFeature, isLoadingUsage } = useSubscriptionLimit();
  const canSendEmail = canUseFeature('emailSending');

  useEffect(() => {
    return () => {
      setIsSendingEmail(false);
      setIsChangingStatus(false);
    };
  }, []);

  // Issue invoice (change status from DRAFT to ISSUED)
  const handleIssueInvoice = async () => {
    setIsChangingStatus(true);
    try {
      const response = await fetch(`/api/invoices/${invoice.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ISSUED" }),
      });
      
      if (response.ok) {
        const updatedInvoice = await response.json();
        setInvoice({ ...invoice, status: updatedInvoice.status });
        toast.success("Фактурата е издадена успешно", {
          description: "Фактурата вече е със статус 'Издадена'"
        });
        router.refresh();
      } else {
        const error = await response.json();
        toast.error(error.error || "Грешка при издаване на фактурата");
      }
    } catch (error) {
      console.error("Error issuing invoice:", error);
      toast.error("Грешка при издаване на фактурата");
    } finally {
      setIsChangingStatus(false);
    }
  };

  const handleExportPdf = async () => {
    try {
      await exportInvoiceAsPdf(invoice.id);
    } catch (error) {
      console.error("Error exporting PDF:", error);
      toast.error("Грешка при експортиране на PDF");
    }
  };

  const handlePrintInvoice = async () => {
    try {
      // Fetch PDF and open in new window for printing
      const response = await fetch(`/api/invoices/export-pdf?invoiceId=${invoice.id}`);
      
      if (!response.ok) {
        throw new Error('Грешка при генерирането на PDF');
      }
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      // Open PDF in new window
      const printWindow = window.open(url, '_blank');
      
      if (printWindow) {
        printWindow.onload = () => {
          // Wait a bit for PDF to load, then trigger print
          setTimeout(() => {
            printWindow.print();
          }, 500);
        };
      } else {
        // Fallback: download if popup blocked
        const link = document.createElement('a');
        link.href = url;
        link.download = `Faktura-${invoice.invoiceNumber}.pdf`;
        link.click();
        toast.info("Поп-ъп прозорецът беше блокиран. PDF файлът беше изтеглен.");
      }
      
      // Clean up URL after a delay
      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 1000);
    } catch (error) {
      console.error("Error printing invoice:", error);
      toast.error("Грешка при принтирането на фактурата");
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

  const handleCancelInvoice = async () => {
    const reason = prompt("Моля, въведете причина за отмяна на фактурата:");
    if (!reason || reason.trim() === "") {
      toast.error("Причината за отмяна е задължителна");
      return;
    }
    
    try {
      setIsSendingEmail(true);
      const response = await fetch(`/api/invoices/${invoice.id}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reason.trim() }),
      });
      
      if (response.ok) {
        const data = await response.json();
        toast.success("Фактурата е отменена", {
          description: "Кредитното известие е създадено успешно",
        });
        router.refresh();
        router.push(`/invoices/${invoice.id}`);
      } else {
        const error = await response.json();
        toast.error(error.error || "Грешка при отмяна на фактурата");
      }
    } catch (error) {
      console.error('Error cancelling invoice:', error);
      toast.error("Грешка при отмяна на фактурата");
    } finally {
      setIsSendingEmail(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "DRAFT":
        return <AlertTriangle className="h-4 w-4 text-slate-500" />;
      case "ISSUED":
      case "PAID": // PAID in DB = ISSUED in app
        return <CheckCircle className="h-4 w-4 text-emerald-500" />;
      case "CANCELLED":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ISSUED":
      case "PAID": // PAID in DB = ISSUED in app
        return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800";
      case "DRAFT":
        return "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-700";
      case "CANCELLED":
        return "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-700";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "DRAFT":
        return "Чернова";
      case "ISSUED":
      case "PAID": // PAID in DB = ISSUED in app
        return "Издадена";
      case "CANCELLED":
        return "Отказана";
      default:
        return status;
    }
  };

  const getPaymentMethodText = (paymentMethod?: string) => {
    if (!paymentMethod) return "Не е посочен";
    switch (paymentMethod) {
      case "BANK_TRANSFER":
        return "Банков превод";
      case "CASH":
        return "В брой";
      case "CREDIT_CARD":
        return "Кредитна/дебитна карта";
      case "WIRE_TRANSFER":
        return "Нареждане за превод";
      case "OTHER":
        return "Друго";
      default:
        return paymentMethod;
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
            {canSendEmail ? (
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
            ) : (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link href="/settings/subscription" className="w-full">
                      <Button 
                        variant="outline" 
                        className="w-full justify-start text-left h-auto py-3 border-dashed border-amber-300 dark:border-amber-700"
                        disabled
                      >
                        <div className="flex items-center gap-4 w-full">
                          <Lock className="w-5 h-5 text-amber-500 flex-shrink-0" />
                          <span className="font-medium flex-1">Изпрати фактура</span>
                          <span className="text-xs px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300">
                            PRO
                          </span>
                        </div>
                      </Button>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-sm mb-1">Изпращането на фактури по имейл е налично само в PRO и BUSINESS плановете.</p>
                    <span className="text-xs text-primary">Надградете сега →</span>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            
            {invoice.status === "ISSUED" && (
              <Button
                variant="destructive"
                className="w-full justify-start text-left h-auto py-3"
                onClick={handleCancelInvoice}
                disabled={isSendingEmail}
              >
                <div className="flex items-center gap-4">
                  <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                  <span className="font-medium">
                    {isSendingEmail ? "Отмяна..." : "Отмени фактура"}
                  </span>
                </div>
              </Button>
            )}
            
            {invoice.creditNote && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm font-medium text-blue-900">
                  Кредитно известие: {invoice.creditNote.creditNoteNumber}
                </p>
                {invoice.creditNote.reason && (
                  <p className="text-xs text-blue-700 mt-1">
                    Причина: {invoice.creditNote.reason}
                  </p>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="max-w-[1400px] mx-auto px-4">
      {/* Header */}
      <div className="flex flex-col gap-4 mb-6">
        {/* Top row: Back button */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/invoices">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Назад
            </Link>
          </Button>
        </div>
        
        {/* Main row: Title, Status, Actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-bold">
              Фактура #{invoice.invoiceNumber}
            </h1>
            <div
              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(
                invoice.status
              )}`}
            >
              <span className="flex items-center gap-1.5">
                {getStatusIcon(invoice.status)}
                {getStatusText(invoice.status)}
              </span>
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Draft actions */}
            {invoice.status === "DRAFT" && (
              <>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/invoices/${invoice.id}/edit`}>
                    <Edit className="w-4 h-4 mr-1.5" />
                    Редактирай
                  </Link>
                </Button>
                <Button 
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={() => setShowIssueModal(true)}
                  disabled={isChangingStatus}
                >
                  <FileCheck className="w-4 h-4 mr-1.5" />
                  {isChangingStatus ? "..." : "Издай"}
                </Button>
              </>
            )}
            
          {/* Issued actions */}
          {(invoice.status === "ISSUED" || invoice.status === "PAID") && (
            <Button 
              variant="destructive" 
              size="sm"
              onClick={handleCancelInvoice}
              disabled={isSendingEmail}
            >
              <AlertTriangle className="w-4 h-4 mr-1.5" />
              Отмени
            </Button>
          )}
            
          {/* Common actions */}
          <Button variant="outline" size="sm" onClick={handlePrintInvoice}>
            <Printer className="w-4 h-4 mr-1.5" />
            Принт
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportPdf} title="Изтегли оригинал">
            <Download className="w-4 h-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => exportInvoiceAsPdf(invoice.id, true)}
            title="Изтегли копие"
            className="text-muted-foreground"
          >
            <Copy className="w-4 h-4" />
          </Button>
        </div>
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
                  {/* Payments tab removed - invoices are for issuance only */}
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
                      {invoice.paymentMethod && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Начин на плащане</span>
                          <span>{getPaymentMethodText(invoice.paymentMethod)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="items" className="px-0">
                <div className="space-y-4 px-6 pb-6 md:hidden">
                  {invoice.items.map((item) => (
                    <div key={item.id} className="rounded-xl border bg-card p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium">{item.description}</p>
                          <p className="text-xs text-muted-foreground">
                            Количество: {Number.isInteger(Number(item.quantity)) ? Number(item.quantity) : Number(item.quantity).toFixed(2)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Ед. цена: {formatCurrency(Number(item.unitPrice), invoice.currency)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            ДДС: {Number(item.taxRate)}%
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold">
                            {formatCurrency(Number(item.total), invoice.currency)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="hidden md:block overflow-x-auto">
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
                            {Number.isInteger(Number(item.quantity)) ? Number(item.quantity) : Number(item.quantity).toFixed(2)}
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

              {/* Payments tab removed - invoices are for issuance only */}

              <TabsContent value="documents" className="p-6 pt-2">
                <DocumentsTab invoiceId={invoice.id} documents={documents} />
              </TabsContent>
            </Tabs>
          </Card>

          {/* Issue Invoice Modal */}
          <StatusChangeModal
            isOpen={showIssueModal}
            onClose={() => setShowIssueModal(false)}
            onConfirm={handleIssueInvoice}
            invoiceNumber={invoice.invoiceNumber}
            currentStatus={invoice.status}
            newStatus="ISSUED"
          />
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Обобщение</CardTitle>
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
                {/* Payment summary removed - invoices are for issuance only */}
              </div>
              
              {invoice.creditNote && (
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm font-medium text-blue-900 mb-1">
                    Кредитно известие: {invoice.creditNote.creditNoteNumber}
                  </p>
                  {invoice.creditNote.reason && (
                    <p className="text-xs text-blue-700">
                      Причина: {invoice.creditNote.reason}
                    </p>
                  )}
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
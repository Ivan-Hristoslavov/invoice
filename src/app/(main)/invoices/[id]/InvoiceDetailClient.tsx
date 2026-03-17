"use client";

import { useState, useEffect, useCallback } from "react";
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
  History,
  User,
  FileText,
  XCircle,
  Mail,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";
import DocumentsTab from "@/components/invoice/DocumentsTab";
import { getDocuments } from "@/lib/services/document-service";
import { exportInvoiceAsPdf, printInvoicePdf } from "@/lib/invoice-export";
import { StatusChangeModal } from "@/components/invoice/StatusChangeModal";
import { CancelInvoiceModal } from "@/components/invoice/CancelInvoiceModal";
import { useSubscriptionLimit } from "@/hooks/useSubscriptionLimit";
import { Lock, Crown } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { normalizeInvoiceStatus } from "@/lib/invoice-status";
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
  createdByName?: string | null;
}

export default function InvoiceDetailClient({ initialInvoice, createdByName }: InvoiceDetailClientProps) {
  const router = useRouter();
  const [invoice, setInvoice] = useState<Invoice>(initialInvoice);
  const [activeTab, setActiveTab] = useState("details");
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [isChangingStatus, setIsChangingStatus] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [isLoadingAuditLogs, setIsLoadingAuditLogs] = useState(false);
  
  // Subscription limit check for email sending
  const { canUseFeature, isLoadingUsage } = useSubscriptionLimit();
  const canSendEmail = canUseFeature('emailSending');

  useEffect(() => {
    return () => {
      setIsSendingEmail(false);
      setIsChangingStatus(false);
    };
  }, []);

  const fetchAuditLogs = useCallback(async () => {
    setIsLoadingAuditLogs(true);
    try {
      const response = await fetch(`/api/audit-logs?invoiceId=${invoice.id}`);
      if (response.ok) {
        const data = await response.json();
        setAuditLogs(data.logs || []);
      }
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    } finally {
      setIsLoadingAuditLogs(false);
    }
  }, [invoice.id]);

  // Fetch audit logs when History tab is selected
  useEffect(() => {
    if (activeTab === 'history' && auditLogs.length === 0 && !isLoadingAuditLogs) {
      fetchAuditLogs();
    }
  }, [activeTab, auditLogs.length, fetchAuditLogs, isLoadingAuditLogs]);

  useEffect(() => {
    if (activeTab !== "documents" || documents.length > 0 || isLoadingDocuments) return;

    const fetchDocuments = async () => {
      setIsLoadingDocuments(true);
      try {
        const docs = await getDocuments(invoice.id);
        setDocuments(docs);
      } catch (error) {
        toast.error("Грешка при зареждане на документите");
      } finally {
        setIsLoadingDocuments(false);
      }
    };

    void fetchDocuments();
  }, [activeTab, documents.length, invoice.id, isLoadingDocuments]);

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
      printInvoicePdf(invoice.id);
      toast.info("PDF файлът беше отворен в нов раздел. Използвайте Print от PDF прегледа.");
    } catch (error) {
      console.error("Error printing invoice:", error);
      toast.error("Грешка при принтирането на фактурата");
    }
  };

  const handleSendInvoiceOnly = async () => {
    try {
      setIsSendingEmail(true);
      
      const response = await fetch(`/api/invoices/${invoice.id}/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'invoice_only'
        }),
      });

      if (!response.ok) {
        const errorPayload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(errorPayload?.error || "Грешка при изпращане на фактурата");
      }
      
      toast.success("Фактурата е изпратена успешно", {
        description: `Фактурата е изпратена на ${invoice.client.email}`,
      });
    } catch (error) {
      console.error('Error sending invoice:', error);
      toast.error(
        error instanceof Error ? error.message : "Грешка при изпращане на фактурата"
      );
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleCancelInvoice = async (reason: string) => {
    try {
      setIsSendingEmail(true);
      const response = await fetch(`/api/invoices/${invoice.id}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reason.trim() }),
      });
      
      if (response.ok) {
        await response.json();
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

  const handleDuplicateInvoice = async () => {
    setIsDuplicating(true);
    try {
      const response = await fetch(`/api/invoices/${invoice.id}/duplicate`, { method: "POST" });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Грешка при дублиране");
      }
      const data = await response.json();
      toast.success("Фактурата е дублирана успешно", {
        description: `Нова чернова ${data.invoiceNumber} е създадена`,
      });
      router.push(`/invoices/${data.id}`);
    } catch (error: any) {
      toast.error(error.message || "Грешка при дублиране на фактурата");
    } finally {
      setIsDuplicating(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (normalizeInvoiceStatus(status)) {
      case "DRAFT":
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case "ISSUED":
        return <CheckCircle className="h-4 w-4 text-emerald-500" />;
      case "VOIDED":
        return <XCircle className="h-4 w-4 text-purple-500" />;
      case "CANCELLED":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (normalizeInvoiceStatus(status)) {
      case "DRAFT":
        return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800";
      case "ISSUED":
        return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800";
      case "VOIDED":
        return "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/30 dark:text-purple-400 dark:border-purple-800";
      case "CANCELLED":
        return "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-700";
    }
  };

  const getStatusText = (status: string) => {
    switch (normalizeInvoiceStatus(status)) {
      case "DRAFT":
        return "Чернова";
      case "ISSUED":
        return "Издадена";
      case "VOIDED":
        return "Анулирана";
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
      <Card>
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <Send className="w-4 h-4" />
            Комуникация с клиента
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 pt-0">
          <div className="grid gap-2">
            {canSendEmail ? (
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start text-left h-8"
                onClick={handleSendInvoiceOnly}
                disabled={isSendingEmail}
              >
                <Send className="w-3.5 h-3.5 mr-2 shrink-0 text-gray-600" />
                <span className="text-xs font-medium">
                  {isSendingEmail ? "Изпращане..." : "Изпрати фактура"}
                </span>
              </Button>
            ) : (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="w-full">
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="w-full justify-start border-dashed border-amber-300 h-8 text-left dark:border-amber-700"
                      >
                        <Link href="/settings/subscription" aria-label="Изпращане по имейл с план Про">
                          <Lock className="w-3.5 h-3.5 mr-2 shrink-0 text-amber-500" />
                          <span className="text-xs font-medium flex-1">Изпрати фактура</span>
                          <span className="text-xs px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300">
                            PRO
                          </span>
                        </Link>
                      </Button>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-sm mb-1">Изпращайте фактури по имейл и получавайте по-бързи плащания — в плановете Про и Бизнес.</p>
                    <span className="text-xs text-primary">Изпращане по имейл с Про →</span>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            
            {invoice.status === "ISSUED" && (
              <Button
                variant="destructive"
                size="sm"
                className="w-full justify-start text-left h-8"
                onClick={() => setShowCancelModal(true)}
                disabled={isSendingEmail}
              >
                <AlertTriangle className="w-3.5 h-3.5 mr-2 shrink-0" />
                <span className="text-xs font-medium">
                  {isSendingEmail ? "Отмяна..." : "Отмени фактура"}
                </span>
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
    <div className="app-page-shell">
      {/* Header */}
      <div className="app-page-header">
        {/* Top row: Back button */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" asChild className="back-btn rounded-full px-3">
            <Link href="/invoices" className="flex items-center whitespace-nowrap">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Назад
            </Link>
          </Button>
        </div>
        
        {/* Main row: Title, Status, Actions */}
        <div className="page-header">
          <div className="flex min-w-0 flex-wrap items-center gap-2.5">
            <h1 className="text-lg font-bold tracking-tight sm:text-xl">
              Фактура #{invoice.invoiceNumber}
            </h1>
            <div
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                invoice.status
              )}`}
            >
              <span className="flex items-center gap-1">
                {getStatusIcon(invoice.status)}
                {getStatusText(invoice.status)}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="w-full sm:w-auto">
            <div className="flex flex-wrap items-center gap-1.5">
            {/* Draft actions */}
            {invoice.status === "DRAFT" && (
              <>
                <Button variant="outline" size="sm" asChild className="h-8 rounded-lg text-xs sm:flex-none">
                  <Link href={`/invoices/${invoice.id}/edit`} className="flex items-center whitespace-nowrap">
                    <Edit className="w-3.5 h-3.5 mr-1" />
                    Редактирай
                  </Link>
                </Button>
                <Button
                  size="sm"
                  className="h-8 rounded-lg border-0 text-xs text-white gradient-primary hover:opacity-90 sm:flex-none"
                  onClick={() => setShowIssueModal(true)}
                  disabled={isChangingStatus}
                >
                  <FileCheck className="w-3.5 h-3.5 mr-1" />
                  {isChangingStatus ? "..." : "Издай"}
                </Button>
              </>
            )}

          {/* Issued actions */}
          {invoice.status === "ISSUED" && (
            <Button
              variant="destructive"
              size="sm"
              className="h-8 rounded-lg text-xs sm:flex-none"
              onClick={() => setShowCancelModal(true)}
              disabled={isSendingEmail}
            >
              <AlertTriangle className="w-3.5 h-3.5 mr-1" />
              Отмени
            </Button>
          )}

          {/* Common actions */}
          <Button
            variant="outline"
            size="sm"
            className="h-8 rounded-lg text-xs"
            onClick={handleDuplicateInvoice}
            disabled={isDuplicating}
          >
            <Copy className="w-3.5 h-3.5 mr-1" />
            {isDuplicating ? "..." : "Дублирай"}
          </Button>
          <Button variant="outline" size="sm" className="h-8 rounded-lg text-xs" onClick={handlePrintInvoice}>
            <Printer className="w-3.5 h-3.5 mr-1" />
            Принт
          </Button>
          <Button variant="outline" size="sm" className="h-8 rounded-lg text-xs" onClick={handleExportPdf} title="Изтегли оригинал">
            <Download className="w-3.5 h-3.5 mr-1" />
            PDF
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => exportInvoiceAsPdf(invoice.id, true)}
            title="Изтегли копие"
            className="h-8 rounded-lg text-xs text-muted-foreground"
          >
            <Copy className="w-3.5 h-3.5 mr-1" />
            Копие
          </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-3 md:gap-8">
        <div className="space-y-5 md:col-span-2 md:space-y-8">
          <Card className="overflow-hidden">
            <CardHeader className="pb-0 px-4 pt-4">
              <CardTitle className="text-sm font-semibold">Информация за фактурата</CardTitle>
            </CardHeader>
            <Tabs
              defaultValue="details"
              onValueChange={setActiveTab}
              className="w-full"
            >
              <div className="px-3 pb-1 pt-3 sm:px-4">
                <TabsList className="mb-1 flex gap-0.5 rounded-lg border border-border/40 bg-muted/40 p-0.5 h-auto">
                  <TabsTrigger value="details" className="min-h-8 rounded-md px-3 text-xs font-medium text-muted-foreground data-selected:bg-background data-selected:text-foreground data-selected:shadow-sm">Детайли</TabsTrigger>
                  <TabsTrigger value="items" className="min-h-8 rounded-md px-3 text-xs font-medium text-muted-foreground data-selected:bg-background data-selected:text-foreground data-selected:shadow-sm">Артикули</TabsTrigger>
                  <TabsTrigger value="documents" className="min-h-8 rounded-md px-3 text-xs font-medium text-muted-foreground data-selected:bg-background data-selected:text-foreground data-selected:shadow-sm">
                    <span className="flex items-center gap-1">
                      <Paperclip className="h-3 w-3" />
                      Документи
                    </span>
                  </TabsTrigger>
                  <TabsTrigger value="history" className="min-h-8 rounded-md px-3 text-xs font-medium text-muted-foreground data-selected:bg-background data-selected:text-foreground data-selected:shadow-sm">
                    <span className="flex items-center gap-1">
                      <History className="h-3 w-3" />
                      История
                    </span>
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="details" className="p-3 pt-3 sm:p-5 sm:pt-4">
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-xl border border-border/60 bg-muted/15 p-3">
                    <h3 className="font-medium mb-2 text-sm">Информация за компанията</h3>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <p className="font-medium text-foreground">{invoice.company.name}</p>
                      {invoice.company.email && <p>{invoice.company.email}</p>}
                      {invoice.company.phone && <p>{invoice.company.phone}</p>}
                    </div>
                  </div>
                  <div className="rounded-xl border border-border/60 bg-muted/15 p-3">
                    <h3 className="font-medium mb-2 text-sm">Информация за клиента</h3>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <p className="font-medium text-foreground">{invoice.client.name}</p>
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

                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <div className="rounded-xl border border-border/60 bg-muted/15 p-3">
                    <h3 className="font-medium mb-2 text-sm">Детайли на фактурата</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-muted-foreground">Дата на издаване</span>
                        <span>{format(new Date(invoice.issueDate), "dd.MM.yyyy")}</span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-muted-foreground">Дата на плащане</span>
                        <span>{format(new Date(invoice.dueDate), "dd.MM.yyyy")}</span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-muted-foreground">Валута</span>
                        <span>{invoice.currency}</span>
                      </div>
                      {invoice.paymentMethod && (
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-muted-foreground">Начин на плащане</span>
                          <span>{getPaymentMethodText(invoice.paymentMethod)}</span>
                        </div>
                      )}
                      {createdByName && (
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-muted-foreground">Създадена от</span>
                          <span>{createdByName}</span>
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

              <TabsContent value="documents" className="p-4 pt-2 sm:p-6 sm:pt-2">
                <DocumentsTab invoiceId={invoice.id} documents={documents} />
              </TabsContent>

              <TabsContent value="history" className="p-4 pt-2 sm:p-6 sm:pt-2">
                {isLoadingAuditLogs ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
                  </div>
                ) : auditLogs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <History className="h-12 w-12 text-muted-foreground/30 mb-4" />
                    <p className="text-muted-foreground">Няма записана история за тази фактура</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {auditLogs.map((log, index) => (
                      <div 
                        key={log.id} 
                        className="flex gap-4 pb-4 border-b last:border-0"
                      >
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${
                          log.action === 'CREATE' ? 'bg-emerald-500/10 text-emerald-600' :
                          log.action === 'ISSUE' || log.action === 'UPDATE' ? 'bg-blue-500/10 text-blue-600' :
                          log.action === 'SEND' ? 'bg-violet-500/10 text-violet-600' :
                          log.action === 'CANCEL' ? 'bg-red-500/10 text-red-600' :
                          log.action === 'EXPORT' ? 'bg-amber-500/10 text-amber-600' :
                          'bg-muted text-muted-foreground'
                        }`}>
                          {log.action === 'CREATE' && <FileText className="h-5 w-5" />}
                          {log.action === 'ISSUE' && <CheckCircle className="h-5 w-5" />}
                          {log.action === 'UPDATE' && <Edit className="h-5 w-5" />}
                          {log.action === 'SEND' && <Mail className="h-5 w-5" />}
                          {log.action === 'CANCEL' && <XCircle className="h-5 w-5" />}
                          {log.action === 'EXPORT' && <Download className="h-5 w-5" />}
                          {!['CREATE', 'ISSUE', 'UPDATE', 'SEND', 'CANCEL', 'EXPORT'].includes(log.action) && (
                            <History className="h-5 w-5" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm">
                              {log.action === 'CREATE' && 'Фактурата е създадена'}
                              {log.action === 'ISSUE' && 'Фактурата е издадена'}
                              {log.action === 'UPDATE' && 'Фактурата е обновена'}
                              {log.action === 'SEND' && 'Фактурата е изпратена'}
                              {log.action === 'CANCEL' && 'Фактурата е отменена'}
                              {log.action === 'EXPORT' && 'Фактурата е експортирана'}
                              {!['CREATE', 'ISSUE', 'UPDATE', 'SEND', 'CANCEL', 'EXPORT'].includes(log.action) && log.action}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {format(new Date(log.createdAt), "d MMM yyyy, HH:mm")}
                            </span>
                            {log.ipAddress && (
                              <span>IP: {log.ipAddress}</span>
                            )}
                          </div>
                          {log.changes && (() => {
                            const changes = typeof log.changes === 'string' ? log.changes : log.changes;
                            if (typeof changes === 'object' && changes !== null) {
                              const entries = Object.entries(changes as Record<string, unknown>).filter(([, v]) => v !== null && v !== undefined);
                              if (entries.length === 0) return null;
                              const labels: Record<string, string> = {
                                previousStatus: 'Предишен статус',
                                newStatus: 'Нов статус',
                                persistedStatus: 'Запазен статус',
                                duplicatedFrom: 'Дублирано от',
                                sentTo: 'Изпратено до',
                                format: 'Формат',
                                fields: 'Промени',
                              };
                              const statusLabels: Record<string, string> = {
                                DRAFT: 'Чернова', ISSUED: 'Издадена', UNPAID: 'Неплатена',
                                PAID: 'Платена', CANCELLED: 'Отменена', VOIDED: 'Анулирана',
                              };
                              return (
                                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                                  {entries.map(([key, val]) => (
                                    <span key={key}>
                                      <span className="font-medium text-foreground/70">{labels[key] ?? key}:</span>{' '}
                                      {statusLabels[String(val)] ?? String(val)}
                                    </span>
                                  ))}
                                </div>
                              );
                            }
                            return (
                              <p className="mt-2 text-xs text-muted-foreground">{String(changes)}</p>
                            );
                          })()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
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

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm font-semibold">Обобщение</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 pt-0">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Междинна сума</span>
                  <span>{formatCurrency(Number(invoice.subtotal), invoice.currency)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Данък</span>
                  <span>{formatCurrency(Number(invoice.taxAmount), invoice.currency)}</span>
                </div>
                {invoice.discount && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Отстъпка</span>
                    <span>-{formatCurrency(Number(invoice.discount), invoice.currency)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center border-t pt-2">
                  <span className="font-medium">Общо</span>
                  <span className="font-bold text-base">
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
      <CancelInvoiceModal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirm={handleCancelInvoice}
        invoiceNumber={invoice.invoiceNumber}
      />
    </div>
  );
} 
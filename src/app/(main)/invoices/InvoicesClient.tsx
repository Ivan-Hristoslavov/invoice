"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { CardStatsMetric } from "@/components/ui/CardStatsMetric";
import { 
  FileText, 
  Plus, 
  Search, 
  Upload, 
  Download, 
  Eye, 
  Edit,
  Filter,
  CheckCircle,
  Clock,
  XCircle,
  ArrowUpDown,
  MoreHorizontal,
  FileCheck,
  Printer,
  Trash2,
  Ban,
  Copy
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/ui/pagination";
import { format } from "date-fns";
import { bg } from "date-fns/locale";
import ExportDialogWrapper from "./ExportDialogWrapper";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { StatusChangeModal } from "@/components/invoice/StatusChangeModal";
import { DeleteInvoiceModal } from "@/components/invoice/DeleteInvoiceModal";
import { VoidInvoiceModal } from "@/components/invoice/VoidInvoiceModal";
import { CancelInvoiceModal } from "@/components/invoice/CancelInvoiceModal";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useSubscriptionLimit } from "@/hooks/useSubscriptionLimit";
import { ProFeatureLock, UsageCounter, LockedButton } from "@/components/ui/pro-feature-lock";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table } from "@heroui/react";
import { Crown, AlertTriangle } from "lucide-react";

interface Invoice {
  id: string;
  invoiceNumber: string;
  issueDate: Date | string;
  dueDate: Date | string;
  total: number;
  status: string;
  userId: string;
  client: {
    id: string;
    name: string;
    userId: string;
  };
}

interface InvoicesClientProps {
  initialInvoices: Invoice[];
  clients: Array<{ id: string; name: string }>;
  companies: Array<{ id: string; name: string }>;
  canCreateInvoices: boolean;
  currentUserId: string;
}

export default function InvoicesClient({
  initialInvoices,
  clients,
  companies,
  canCreateInvoices,
  currentUserId,
}: InvoicesClientProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [invoices, setInvoices] = useState(initialInvoices);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<"date" | "amount" | "number">("date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const ITEMS_PER_PAGE = 15;
  
  // Subscription limit hook
  const { 
    plan, 
    isFree, 
    getInvoiceUsage, 
    canCreateInvoice,
    isLoadingUsage,
    refreshUsage
  } = useSubscriptionLimit();
  
  const invoiceUsage = getInvoiceUsage();
  
  // Modal state for status change
  const [statusModal, setStatusModal] = useState<{
    isOpen: boolean;
    invoice: Invoice | null;
    newStatus: string;
  }>({ isOpen: false, invoice: null, newStatus: "" });

  // Modal state for delete
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    invoice: Invoice | null;
  }>({ isOpen: false, invoice: null });

  // Modal state for void (annul)
  const [voidModal, setVoidModal] = useState<{
    isOpen: boolean;
    invoice: Invoice | null;
  }>({ isOpen: false, invoice: null });

  // Modal state for cancel (issued invoices)
  const [cancelModal, setCancelModal] = useState<{
    isOpen: boolean;
    invoice: Invoice | null;
  }>({ isOpen: false, invoice: null });

  // Handle delete invoice
  const handleDeleteInvoice = async () => {
    if (!deleteModal.invoice) return;
    
    const invoiceId = deleteModal.invoice.id;
    const invoiceNumber = deleteModal.invoice.invoiceNumber;
    
    try {
      const response = await fetch(`/api/invoices/${invoiceId}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Грешка при изтриване на фактурата");
      }
      
      // Remove invoice from local state
      setInvoices(prev => prev.filter(inv => inv.id !== invoiceId));
      toast.success("Фактурата беше изтрита успешно");
      
      // Refresh usage limits after deletion
      refreshUsage();
      
      // Refresh the page to update the list
      router.refresh();
    } catch (error: any) {
      console.error("Error deleting invoice:", error);
      toast.error(error.message || "Грешка при изтриване на фактурата");
      throw error; // Re-throw to let modal handle loading state
    }
  };

  const openDeleteModal = (invoice: Invoice) => {
    setDeleteModal({ isOpen: true, invoice });
  };

  const closeDeleteModal = () => {
    setDeleteModal({ isOpen: false, invoice: null });
  };

  // Handle status change
  const handleStatusChange = async () => {
    if (!statusModal.invoice) return;
    
    try {
      const response = await fetch(`/api/invoices/${statusModal.invoice.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: statusModal.newStatus }),
      });
      
      if (response.ok) {
        // Update local state
        setInvoices(prev => 
          prev.map(inv => 
            inv.id === statusModal.invoice?.id 
              ? { ...inv, status: statusModal.newStatus }
              : inv
          )
        );
        toast.success(
          statusModal.newStatus === "ISSUED" 
            ? "Фактурата е издадена успешно" 
            : "Статусът е променен успешно"
        );
        router.refresh();
      } else {
        const error = await response.json();
        toast.error(error.error || "Грешка при промяна на статуса");
      }
    } catch (error) {
      console.error("Error changing status:", error);
      toast.error("Грешка при промяна на статуса");
    }
  };

  const openStatusModal = (invoice: Invoice, newStatus: string) => {
    setStatusModal({ isOpen: true, invoice, newStatus });
  };

  const closeStatusModal = () => {
    setStatusModal({ isOpen: false, invoice: null, newStatus: "" });
  };

  // Open cancel modal
  const openCancelModal = (invoice: Invoice) => {
    setCancelModal({ isOpen: true, invoice });
  };

  // Handle cancel invoice (create credit note) - for ISSUED invoices
  const handleCancelInvoice = async (reason: string) => {
    if (!cancelModal.invoice) return;
    
    const invoice = cancelModal.invoice;
    
    try {
      const response = await fetch(`/api/invoices/${invoice.id}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      
      if (response.ok) {
        const data = await response.json();
        // Update local state
        setInvoices(prev => 
          prev.map(inv => 
            inv.id === invoice.id 
              ? { ...inv, status: "CANCELLED" }
              : inv
          )
        );
        toast.success("Фактурата е отменена", {
          description: `Сторно документ ${data.creditNote?.creditNoteNumber} е създаден успешно`,
        });
        router.refresh();
      } else {
        const error = await response.json();
        toast.error(error.error || "Грешка при отмяна на фактурата");
      }
    } catch (error) {
      console.error('Error cancelling invoice:', error);
      toast.error("Грешка при отмяна на фактурата");
    }
  };

  // Open void modal
  const openVoidModal = (invoice: Invoice) => {
    setVoidModal({ isOpen: true, invoice });
  };

  // Handle void invoice - for DRAFT invoices (marks as VOIDED but keeps in database)
  const handleVoidInvoice = async (reason: string) => {
    if (!voidModal.invoice) return;
    
    const invoice = voidModal.invoice;
    
    try {
      const response = await fetch(`/api/invoices/${invoice.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "VOIDED", reason }),
      });
      
      if (response.ok) {
        // Update local state
        setInvoices(prev => 
          prev.map(inv => 
            inv.id === invoice.id 
              ? { ...inv, status: "VOIDED" }
              : inv
          )
        );
        toast.success("Черновата е анулирана", {
          description: "Фактурата е маркирана като анулирана",
        });
        router.refresh();
      } else {
        const error = await response.json();
        toast.error(error.error || "Грешка при анулиране на черновата");
      }
    } catch (error) {
      console.error('Error voiding invoice:', error);
      toast.error("Грешка при анулиране на черновата");
    }
  };

  // Filter invoices based on search and status
  const filteredInvoices = useMemo(() => {
    let filtered = invoices;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (invoice) =>
          invoice.invoiceNumber.toLowerCase().includes(query) ||
          invoice.client.name.toLowerCase().includes(query) ||
          format(new Date(invoice.issueDate), "dd.MM.yyyy").includes(query)
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((invoice) => invoice.status === statusFilter);
    }

    filtered.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "date":
          cmp = new Date(a.issueDate).getTime() - new Date(b.issueDate).getTime();
          break;
        case "amount":
          cmp = Number(a.total) - Number(b.total);
          break;
        case "number":
          cmp = a.invoiceNumber.localeCompare(b.invoiceNumber, undefined, { numeric: true });
          break;
      }
      return sortDirection === "asc" ? cmp : -cmp;
    });

    return filtered;
  }, [invoices, searchQuery, statusFilter, sortField, sortDirection]);

  const paginatedInvoices = useMemo(() => {
    return filteredInvoices.slice(
      (currentPage - 1) * ITEMS_PER_PAGE,
      currentPage * ITEMS_PER_PAGE
    );
  }, [filteredInvoices, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, sortField, sortDirection]);

  // Stats
  const stats = useMemo(() => {
    const issued = invoices.filter(i => i.status === 'ISSUED' || i.status === 'PAID');
    const draft = invoices.filter(i => i.status === 'DRAFT');
    const voided = invoices.filter(i => i.status === 'VOIDED');
    const cancelled = invoices.filter(i => i.status === 'CANCELLED');
    const totalValue = issued.reduce((sum, i) => sum + Number(i.total), 0);
    
    return { issued: issued.length, draft: draft.length, voided: voided.length, cancelled: cancelled.length, totalValue };
  }, [invoices]);

  const statsCards = [
    {
      title: "Общо",
      value: invoices.length,
      icon: FileText,
      gradient: "from-blue-500 to-indigo-600",
    },
    {
      title: "Издадени",
      value: stats.issued,
      icon: CheckCircle,
      gradient: "from-emerald-500 to-teal-600",
      valueClassName: "text-emerald-600",
    },
    {
      title: "Чернови",
      value: stats.draft,
      icon: Clock,
      gradient: "from-amber-500 to-orange-600",
      valueClassName: "text-amber-600",
    },
    {
      title: "Стойност",
      value: formatPrice(stats.totalValue),
      valueSuffix: "€",
      icon: Download,
      gradient: "from-slate-500 to-slate-600",
    },
  ];

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "DRAFT":
        return {
          label: "Чернова",
          icon: Clock,
          className: "bg-amber-500/10 text-amber-600 border-amber-200 dark:border-amber-800"
        };
      case "ISSUED":
      case "PAID": // PAID in DB = ISSUED in app
        return {
          label: "Издадена",
          icon: CheckCircle,
          className: "bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:border-emerald-800"
        };
      case "VOIDED":
        return {
          label: "Анулирана",
          icon: XCircle,
          className: "bg-purple-500/10 text-purple-600 border-purple-200 dark:border-purple-800"
        };
      case "CANCELLED":
        return {
          label: "Отказана",
          icon: XCircle,
          className: "bg-red-500/10 text-red-600 border-red-200 dark:border-red-800"
        };
      default:
        return {
          label: status,
          icon: FileText,
          className: "bg-gray-500/10 text-gray-600 border-gray-200"
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Subscription Warning Banner for FREE plan */}
      {!isLoadingUsage && isFree && invoiceUsage.remaining <= 1 && invoiceUsage.remaining > 0 && (
        <Alert className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="flex items-center justify-between">
            <span className="text-amber-800 dark:text-amber-200">
              Остава ви само <strong>{invoiceUsage.remaining}</strong> фактура този месец. 
              Надградете за неограничени фактури.
            </span>
            <Link href="/settings/subscription">
              <Button size="sm" variant="outline" className="ml-4 border-amber-300 text-amber-700 hover:bg-amber-100">
                <Crown className="h-4 w-4 mr-2" />
                Надградете
              </Button>
            </Link>
          </AlertDescription>
        </Alert>
      )}
      
      {!isLoadingUsage && isFree && !canCreateInvoice && (
        <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/30">
          <XCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="flex items-center justify-between">
            <span className="text-red-800 dark:text-red-200">
              Достигнахте лимита от <strong>3 фактури</strong> за този месец. 
              Надградете до PRO за неограничени фактури.
            </span>
            <Link href="/settings/subscription">
              <Button size="sm" className="ml-4 bg-linear-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white">
                <Crown className="h-4 w-4 mr-2" />
                Надградете до PRO
              </Button>
            </Link>
          </AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">Фактури</h1>
            {isFree && !isLoadingUsage && (
              <UsageCounter 
                used={invoiceUsage.used} 
                limit={invoiceUsage.limit === Infinity ? 0 : invoiceUsage.limit}
                label="този месец"
              />
            )}
          </div>
          <p className="text-muted-foreground mt-1">
            Управлявайте и проследявайте вашите фактури
          </p>
        </div>
        <div className="flex items-center gap-3">
          {canCreateInvoices && (
            <Button variant="outline" asChild size="lg">
              <Link href="/invoices/import">
                <Upload className="mr-2 h-4 w-4" />
                Импорт
              </Link>
            </Button>
          )}
          {(isLoadingUsage || canCreateInvoice) ? (
            <Button 
              asChild 
              size="3" 
              variant="solid" 
              color="green"
              className="shadow-lg"
            >
              <Link href="/invoices/new" className="flex items-center whitespace-nowrap">
                <Plus className="mr-2 h-5 w-5" />
                Нова фактура
              </Link>
            </Button>
          ) : (
            <LockedButton requiredPlan="PRO">
              Нова фактура
            </LockedButton>
          )}
        </div>
      </div>
      
      {/* Fast Action Button - Floating */}
      {canCreateInvoices && !isLoadingUsage && canCreateInvoice && (
        <div className="fixed bottom-8 right-8 z-50">
          <Button
            asChild
            size="lg"
            className="h-14 w-14 rounded-full gradient-primary hover:opacity-90 text-white border-0 shadow-2xl transition-all hover:scale-110"
          >
            <Link href="/invoices/new">
              <Plus className="h-6 w-6" />
            </Link>
          </Button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {statsCards.map((stat) => (
          <CardStatsMetric
            key={stat.title}
            title={stat.title}
            value={stat.value}
            valueSuffix={stat.valueSuffix}
            valueClassName={stat.valueClassName}
            icon={stat.icon}
            gradient={stat.gradient}
          />
        ))}
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                type="search"
                placeholder="Търсене по номер, клиент или дата..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11 border-border"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px] h-11">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Филтър по статус" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Всички статуси</SelectItem>
                <SelectItem value="DRAFT">
                  <span className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-amber-500" />
                    Чернови
                  </span>
                </SelectItem>
                <SelectItem value="ISSUED">
                  <span className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                    Издадени
                  </span>
                </SelectItem>
                <SelectItem value="VOIDED">
                  <span className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-purple-500" />
                    Анулирани
                  </span>
                </SelectItem>
                <SelectItem value="CANCELLED">
                  <span className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-red-500" />
                    Отказани
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
            <Select value={`${sortField}-${sortDirection}`} onValueChange={(val) => {
              const [field, dir] = val.split("-");
              setSortField(field as any);
              setSortDirection(dir as any);
            }}>
              <SelectTrigger className="w-full sm:w-[200px] h-11">
                <ArrowUpDown className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Сортирай" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date-desc">Дата (нови първо)</SelectItem>
                <SelectItem value="date-asc">Дата (стари първо)</SelectItem>
                <SelectItem value="amount-desc">Сума (намаляваща)</SelectItem>
                <SelectItem value="amount-asc">Сума (нарастваща)</SelectItem>
                <SelectItem value="number-desc">Номер (намаляващ)</SelectItem>
                <SelectItem value="number-asc">Номер (нарастващ)</SelectItem>
              </SelectContent>
            </Select>
            {canCreateInvoices && (
              <ExportDialogWrapper clients={clients} companies={companies} />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Invoices List */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Списък с фактури</CardTitle>
              <CardDescription>
                {filteredInvoices.length} от {invoices.length} фактури
              </CardDescription>
            </div>
            {canCreateInvoices && (isLoadingUsage || canCreateInvoice) && (
              <Button 
                asChild 
                className="gradient-primary hover:opacity-90 text-white border-0 shadow-lg transition-all"
              >
                <Link href="/invoices/new" className="flex items-center whitespace-nowrap">
                  <Plus className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Нова фактура</span>
                  <span className="sm:hidden">Нова</span>
                </Link>
              </Button>
            )}
            {canCreateInvoices && !isLoadingUsage && !canCreateInvoice && (
              <LockedButton requiredPlan="PRO">
                <span className="hidden sm:inline">Нова фактура</span>
                <span className="sm:hidden">Нова</span>
              </LockedButton>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          {filteredInvoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-lg font-medium mb-1">
                {searchQuery || statusFilter !== "all" 
                  ? "Няма намерени фактури" 
                  : "Все още нямате фактури"}
              </p>
              <p className="text-sm text-muted-foreground mb-6 max-w-sm">
                {searchQuery || statusFilter !== "all"
                  ? "Опитайте да промените филтрите за търсене"
                  : "Създайте първата си фактура, за да започнете да управлявате финансите си"}
              </p>
              {canCreateInvoices && (isLoadingUsage || canCreateInvoice) && (
                <Button asChild>
                  <Link href="/invoices/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Създай фактура
                  </Link>
                </Button>
              )}
              {canCreateInvoices && !isLoadingUsage && !canCreateInvoice && (
                <LockedButton requiredPlan="PRO">
                  Създай фактура
                </LockedButton>
              )}
            </div>
          ) : (
            <>
              <div className="space-y-3 px-4 pb-4 md:hidden">
                {paginatedInvoices.map((invoice) => {
                  const statusConfig = getStatusConfig(invoice.status);
                  const StatusIcon = statusConfig.icon;
                  return (
                    <div key={invoice.id} className="rounded-xl border bg-card p-4 shadow-xs">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                            (invoice.status === 'ISSUED' || invoice.status === 'PAID')
                              ? 'bg-emerald-500/10'
                              : invoice.status === 'DRAFT'
                              ? 'bg-amber-500/10'
                              : 'bg-red-500/10'
                          }`}>
                            <StatusIcon className={`h-5 w-5 ${
                              (invoice.status === 'ISSUED' || invoice.status === 'PAID')
                                ? 'text-emerald-600'
                                : invoice.status === 'DRAFT'
                                ? 'text-amber-600'
                                : 'text-red-600'
                            }`} />
                          </div>
                          <div>
                            <p className="font-semibold text-sm">{invoice.invoiceNumber}</p>
                            <p className="text-xs text-muted-foreground">{invoice.client.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(invoice.issueDate), "d MMM yyyy", { locale: bg })}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold">{formatPrice(Number(invoice.total))} €</p>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border mt-2 ${statusConfig.className}`}>
                            <StatusIcon className="h-3 w-3" />
                            {statusConfig.label}
                          </span>
                        </div>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <Button size="sm" variant="outline" asChild>
                          <Link href={`/invoices/${invoice.id}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            Преглед
                          </Link>
                        </Button>
                        {invoice.userId === currentUserId && invoice.status === "DRAFT" && (
                          <Button size="sm" variant="outline" asChild>
                            <Link href={`/invoices/${invoice.id}/edit`}>
                              <Edit className="mr-2 h-4 w-4" />
                              Редакция
                            </Link>
                          </Button>
                        )}
                        {invoice.status === "DRAFT" && (
                          <Button
                            size="sm"
                            onClick={() => openStatusModal(invoice, "ISSUED")}
                            className="gradient-primary hover:opacity-90 text-white border-0"
                          >
                            <FileCheck className="mr-2 h-4 w-4" />
                            Издай
                          </Button>
                        )}
                        {invoice.userId === currentUserId && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => openDeleteModal(invoice)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Изтрий
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="hidden md:block">
                <Table variant="secondary" className="rounded-2xl border border-border/50 bg-transparent">
                  <Table.ScrollContainer className="max-h-[600px]">
                    <Table.Content aria-label="Списък с фактури" className="min-w-[980px]">
                      <Table.Header className="bg-muted/35">
                        <Table.Column isRowHeader className="px-6 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                          Фактура
                        </Table.Column>
                        <Table.Column className="px-6 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                          Клиент
                        </Table.Column>
                        <Table.Column className="px-6 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                          Дата
                        </Table.Column>
                        <Table.Column className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                          Сума
                        </Table.Column>
                        <Table.Column className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
                          Статус
                        </Table.Column>
                        <Table.Column className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
                          Действия
                        </Table.Column>
                      </Table.Header>
                      <Table.Body items={paginatedInvoices}>
                        {(invoice) => {
                          const statusConfig = getStatusConfig(invoice.status);
                          const StatusIcon = statusConfig.icon;

                          return (
                            <Table.Row key={invoice.id} id={invoice.id} className="group">
                              <Table.Cell className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                                    (invoice.status === "ISSUED" || invoice.status === "PAID")
                                      ? "bg-emerald-500/10"
                                      : invoice.status === "DRAFT"
                                        ? "bg-amber-500/10"
                                        : "bg-red-500/10"
                                  }`}>
                                    <StatusIcon className={`h-5 w-5 ${
                                      (invoice.status === "ISSUED" || invoice.status === "PAID")
                                        ? "text-emerald-600"
                                        : invoice.status === "DRAFT"
                                          ? "text-amber-600"
                                          : "text-red-600"
                                    }`} />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="truncate text-sm font-semibold">{invoice.invoiceNumber}</p>
                                    <p className="text-xs text-muted-foreground">
                                      № фактура
                                    </p>
                                  </div>
                                </div>
                              </Table.Cell>
                              <Table.Cell className="px-6 py-4">
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-medium">{invoice.client.name}</p>
                                </div>
                              </Table.Cell>
                              <Table.Cell className="px-6 py-4">
                                <p className="text-sm text-muted-foreground">
                                  {format(new Date(invoice.issueDate), "d MMMM yyyy", { locale: bg })}
                                </p>
                              </Table.Cell>
                              <Table.Cell className="px-6 py-4 text-right">
                                <p className="text-sm font-bold">
                                  {formatPrice(Number(invoice.total))} €
                                </p>
                              </Table.Cell>
                              <Table.Cell className="px-6 py-4">
                                <div className="flex justify-center">
                                  <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${statusConfig.className}`}>
                                    <StatusIcon className="h-3 w-3" />
                                    {statusConfig.label}
                                  </span>
                                </div>
                              </Table.Cell>
                              <Table.Cell className="px-6 py-4">
                                <div className="flex items-center justify-center">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger
                                      className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                      }}
                                    >
                                      <MoreHorizontal className="h-4 w-4" />
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      {invoice.userId === currentUserId && invoice.status === "DRAFT" && (
                                        <DropdownMenuItem asChild>
                                          <Link href={`/invoices/${invoice.id}/edit`} onClick={(e) => e.stopPropagation()}>
                                            <Edit className="mr-2 h-4 w-4" />
                                            Редактиране
                                          </Link>
                                        </DropdownMenuItem>
                                      )}
                                      {invoice.status === "DRAFT" && (
                                        <>
                                          <DropdownMenuItem
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              openStatusModal(invoice, "ISSUED");
                                            }}
                                            className="text-emerald-600 focus:text-emerald-600"
                                          >
                                            <FileCheck className="mr-2 h-4 w-4" />
                                            Издай фактура
                                          </DropdownMenuItem>
                                          {invoice.userId === currentUserId && (
                                            <DropdownMenuItem
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                openVoidModal(invoice);
                                              }}
                                              className="text-purple-600 focus:bg-purple-50 focus:text-purple-600"
                                            >
                                              <Ban className="mr-2 h-4 w-4" />
                                              Анулирай
                                            </DropdownMenuItem>
                                          )}
                                        </>
                                      )}
                                      {(invoice.status === "ISSUED" || invoice.status === "PAID") && invoice.userId === currentUserId && (
                                        <DropdownMenuItem
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            openCancelModal(invoice);
                                          }}
                                          className="text-red-600 focus:text-red-600"
                                        >
                                          <XCircle className="mr-2 h-4 w-4" />
                                          Отмени фактура
                                        </DropdownMenuItem>
                                      )}
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem asChild>
                                        <Link href={`/invoices/${invoice.id}`} onClick={(e) => e.stopPropagation()}>
                                          <Eye className="mr-2 h-4 w-4" />
                                          Преглед
                                        </Link>
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={async (e) => {
                                          e.stopPropagation();
                                          try {
                                            const response = await fetch(`/api/invoices/${invoice.id}/duplicate`, { method: "POST" });
                                            if (!response.ok) {
                                              const error = await response.json();
                                              throw new Error(error.error || "Грешка при дублиране");
                                            }
                                            const data = await response.json();
                                            toast.success("Фактурата е дублирана", {
                                              description: `Нова чернова ${data.invoiceNumber} е създадена`,
                                            });
                                            router.push(`/invoices/${data.id}`);
                                          } catch (error: any) {
                                            toast.error(error.message || "Грешка при дублиране на фактурата");
                                          }
                                        }}
                                      >
                                        <Copy className="mr-2 h-4 w-4" />
                                        Дублирай
                                      </DropdownMenuItem>
                                      {invoice.userId === currentUserId && (
                                        <DropdownMenuItem
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            openDeleteModal(invoice);
                                          }}
                                          className="text-red-600 focus:text-red-600"
                                        >
                                          <Trash2 className="mr-2 h-4 w-4" />
                                          Изтрий фактура
                                        </DropdownMenuItem>
                                      )}
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem
                                        onClick={async (e) => {
                                          e.stopPropagation();
                                          try {
                                            const response = await fetch(`/api/invoices/export-pdf?invoiceId=${invoice.id}`);

                                            if (!response.ok) {
                                              throw new Error("Грешка при генерирането на PDF");
                                            }

                                            const blob = await response.blob();
                                            const url = URL.createObjectURL(blob);
                                            const link = document.createElement("a");
                                            link.href = url;
                                            link.target = "_blank";
                                            link.style.display = "none";
                                            document.body.appendChild(link);
                                            link.click();
                                            document.body.removeChild(link);

                                            toast.info("PDF файлът беше отворен. Моля, използвайте бутона за принтиране в браузъра.");

                                            setTimeout(() => {
                                              URL.revokeObjectURL(url);
                                            }, 1000);
                                          } catch (error) {
                                            console.error("Error printing invoice:", error);
                                            toast.error("Грешка при принтирането на фактурата");
                                          }
                                        }}
                                      >
                                        <Printer className="mr-2 h-4 w-4" />
                                        Принтирай
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={async (e) => {
                                          e.stopPropagation();
                                          try {
                                            const { exportInvoiceAsPdf } = await import("@/lib/invoice-export");
                                            await exportInvoiceAsPdf(invoice.id);
                                          } catch (error) {
                                            console.error("Error exporting PDF:", error);
                                            toast.error("Грешка при експортиране на PDF");
                                          }
                                        }}
                                      >
                                        <Download className="mr-2 h-4 w-4" />
                                        Изтегли PDF
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </Table.Cell>
                            </Table.Row>
                          );
                        }}
                      </Table.Body>
                    </Table.Content>
                  </Table.ScrollContainer>
                </Table>
              </div>
              {filteredInvoices.length > ITEMS_PER_PAGE && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t">
                  <p className="text-sm text-muted-foreground order-2 sm:order-1">
                    Показване {((currentPage - 1) * ITEMS_PER_PAGE) + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, filteredInvoices.length)} от {filteredInvoices.length}
                  </p>
                  <Pagination
                    currentPage={currentPage}
                    totalPages={Math.ceil(filteredInvoices.length / ITEMS_PER_PAGE)}
                    onPageChange={setCurrentPage}
                    size="sm"
                    className="order-1 sm:order-2"
                  />
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Status Change Modal */}
      {statusModal.invoice && (
        <StatusChangeModal
          isOpen={statusModal.isOpen}
          onClose={closeStatusModal}
          onConfirm={handleStatusChange}
          invoiceNumber={statusModal.invoice.invoiceNumber}
          currentStatus={statusModal.invoice.status}
          newStatus={statusModal.newStatus}
        />
      )}

      {/* Delete Invoice Modal */}
      {deleteModal.invoice && (
        <DeleteInvoiceModal
          isOpen={deleteModal.isOpen}
          onClose={closeDeleteModal}
          onConfirm={handleDeleteInvoice}
          invoiceNumber={deleteModal.invoice.invoiceNumber}
        />
      )}

      {/* Void Invoice Modal */}
      {voidModal.invoice && (
        <VoidInvoiceModal
          isOpen={voidModal.isOpen}
          onClose={() => setVoidModal({ isOpen: false, invoice: null })}
          onConfirm={handleVoidInvoice}
          invoiceNumber={voidModal.invoice.invoiceNumber}
        />
      )}

      {/* Cancel Invoice Modal */}
      {cancelModal.invoice && (
        <CancelInvoiceModal
          isOpen={cancelModal.isOpen}
          onClose={() => setCancelModal({ isOpen: false, invoice: null })}
          onConfirm={handleCancelInvoice}
          invoiceNumber={cancelModal.invoice.invoiceNumber}
        />
      )}
    </div>
  );
}

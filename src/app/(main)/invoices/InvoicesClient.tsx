"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn, formatPrice } from "@/lib/utils";
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
  Copy,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
} from "lucide-react";
import { SearchField } from "@/components/ui/search-field";
import { Toolbar } from "@heroui/react";
import { ButtonGroup } from "@heroui/react";
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
  DropdownMenuItemIcon,
  DropdownMenuItemText,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/lib/toast";
import { StatusChangeModal } from "@/components/invoice/StatusChangeModal";
import { DeleteInvoiceModal } from "@/components/invoice/DeleteInvoiceModal";
import { VoidInvoiceModal } from "@/components/invoice/VoidInvoiceModal";
import { CancelInvoiceModal } from "@/components/invoice/CancelInvoiceModal";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useSubscriptionLimit } from "@/hooks/useSubscriptionLimit";
import { useAsyncLock } from "@/hooks/use-async-lock";
import { useAsyncAction } from "@/hooks/use-async-action";
import { ProFeatureLock, UsageCounter, LockedButton, LimitBanner } from "@/components/ui/pro-feature-lock";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { normalizeInvoiceStatus } from "@/lib/invoice-status";
import {
  canDeleteInvoice,
  canCreateDebitNoteFromInvoice,
  canCreateCreditNoteFromInvoice,
} from "@/lib/invoice-actions";
import { InvoiceWorkspaceSetup } from "@/components/invoice/InvoiceWorkspaceSetup";
import { AppSectionKicker } from "@/components/app/AppSectionKicker";

interface Invoice {
  id: string;
  invoiceNumber: string;
  issueDate: Date | string;
  dueDate: Date | string;
  total: number;
  status: string;
  userId: string;
  createdById?: string | null;
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
  createdByMap?: Record<string, { name: string | null; email?: string | null }>;
}

export default function InvoicesClient({
  initialInvoices,
  clients,
  companies,
  canCreateInvoices,
  currentUserId,
  createdByMap = {},
}: InvoicesClientProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [invoices, setInvoices] = useState(initialInvoices);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<"date" | "amount" | "number">("date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [showMobileFilters, setShowMobileFilters] = useState(false);
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
  const duplicateLock = useAsyncLock();
  const deleteAction = useAsyncAction();

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
    await deleteAction.execute(async () => {
      if (!deleteModal.invoice) return;

      const invoiceId = deleteModal.invoice.id;
      const response = await fetch(`/api/invoices/${invoiceId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Грешка при изтриване на фактурата");
      }

      setInvoices((prev) => prev.filter((inv) => inv.id !== invoiceId));
      toast.success("Фактурата беше изтрита успешно");
      refreshUsage();
      router.refresh();
      closeDeleteModal();
    });
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
        const errorData = await response.json();
        if (errorData.validationErrors?.length > 0) {
          toast.error(errorData.error, {
            description: errorData.validationErrors.join("; "),
          });
        } else {
          toast.error(errorData.error || "Грешка при промяна на статуса");
        }
        throw new Error(errorData.error);
      }
    } catch (error) {
      console.error("Error changing status:", error);
    }
  };

  const openStatusModal = (invoice: Invoice, newStatus: string) => {
    setStatusModal({ isOpen: true, invoice, newStatus });
  };

  const closeStatusModal = () => {
    setStatusModal({ isOpen: false, invoice: null, newStatus: "" });
  };

  // Handle duplicate invoice
  const handleDuplicate = async (invoiceId: string) => {
    await duplicateLock.run(async () => {
      try {
        const response = await fetch(`/api/invoices/${invoiceId}/duplicate`, { method: "POST" });
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
    });
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
      filtered = filtered.filter((invoice) => {
        if (statusFilter === "OVERDUE" || statusFilter === "PAID") {
          return getDisplayStatus(invoice) === statusFilter;
        }
        return normalizeInvoiceStatus(invoice.status) === statusFilter;
      });
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

  const activeFilterCount = (statusFilter !== "all" ? 1 : 0) + (sortField !== "date" || sortDirection !== "desc" ? 1 : 0);

  const getDisplayStatus = (invoice: Invoice) => {
    const normalized = normalizeInvoiceStatus(invoice.status);
    if (normalized !== "ISSUED") return normalized;
    const raw = invoice.status;
    if (raw === "PAID") return "PAID" as const;
    const dueDate = new Date(invoice.dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (dueDate < today) return "OVERDUE" as const;
    return "ISSUED" as const;
  };

  // Stats
  const stats = useMemo(() => {
    const issued = invoices.filter((invoice) => normalizeInvoiceStatus(invoice.status) === "ISSUED");
    const draft = invoices.filter((invoice) => normalizeInvoiceStatus(invoice.status) === "DRAFT");
    const overdue = invoices.filter((invoice) => getDisplayStatus(invoice) === "OVERDUE");
    const paid = invoices.filter((invoice) => getDisplayStatus(invoice) === "PAID");
    const totalValue = issued.reduce((sum, i) => sum + Number(i.total), 0);
    
    return { issued: issued.length, draft: draft.length, overdue: overdue.length, paid: paid.length, totalValue };
  }, [invoices]);

  const statsCards = [
    { title: "Общо", value: invoices.length, icon: FileText },
    {
      title: "Издадени",
      value: stats.issued,
      icon: CheckCircle,
      valueClassName: "text-emerald-600 dark:text-emerald-400",
    },
    ...(stats.overdue > 0
      ? [{
          title: "Просрочени",
          value: stats.overdue,
          icon: AlertTriangle,
          valueClassName: "text-orange-600 dark:text-orange-400",
        }]
      : [{
          title: "Чернови",
          value: stats.draft,
          icon: Clock,
          valueClassName: "text-amber-600 dark:text-amber-400",
        }]),
    {
      title: "Стойност",
      value: formatPrice(stats.totalValue),
      valueSuffix: "€",
      icon: Download,
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
        return {
          label: "Издадена",
          icon: CheckCircle,
          className: "bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:border-emerald-800"
        };
      case "PAID":
        return {
          label: "Платена",
          icon: CheckCircle,
          className: "bg-sky-500/10 text-sky-600 border-sky-200 dark:border-sky-800"
        };
      case "OVERDUE":
        return {
          label: "Просрочена",
          icon: AlertTriangle,
          className: "bg-orange-500/10 text-orange-600 border-orange-200 dark:border-orange-800"
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

  const hasCompanies = companies.length > 0;
  const hasClients = clients.length > 0;
  const hasInvoiceWorkspaceSetup = hasCompanies && hasClients;
  const shouldShowSetup = invoices.length === 0 && !hasInvoiceWorkspaceSetup;

  if (shouldShowSetup) {
    return (
      <div className="app-page-shell">
        <div className="page-header">
          <div className="min-w-0 flex-1 space-y-2">
            <AppSectionKicker icon={FileText}>Документи</AppSectionKicker>
            <h1 className="page-title">Фактури</h1>
            <p className="card-description">
              Подгответе акаунта си — след това ще имате пълен достъп до създаване, филтри и управление на фактури.
            </p>
          </div>
        </div>

        <InvoiceWorkspaceSetup
          hasCompanies={hasCompanies}
          hasClients={hasClients}
          title="Първо създайте основните записи"
          description="Най-добрият старт е първо да добавите компания и клиент. След това разделът Фактури ще покаже пълния интерфейс за създаване, филтриране и управление на документи."
        />
      </div>
    );
  }

  return (
    <div className="app-page-shell">
      {/* Subscription Warning Banner for FREE plan */}
      {!isLoadingUsage && isFree && invoiceUsage.remaining <= 1 && invoiceUsage.remaining > 0 && (
        <LimitBanner
          variant="warning"
          message={<>Остава ви <strong>{invoiceUsage.remaining} фактура</strong> този месец. С план Про създавате неограничено и изпращате по имейл.</>}
        />
      )}

      {!isLoadingUsage && isFree && !canCreateInvoice && (
        <LimitBanner
          variant="error"
          message={<>Издадохте <strong>3 фактури</strong> този месец — лимитът на безплатния план. С Про без ограничения.</>}
          linkText="Отключете неограничени →"
        />
      )}

      {/* Header */}
      <div className="page-header">
        <div className="min-w-0 flex-1 space-y-2">
          <AppSectionKicker icon={FileText}>Документи</AppSectionKicker>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="page-title">Фактури</h1>
            {isFree && !isLoadingUsage && (
              <UsageCounter 
                used={invoiceUsage.used} 
                limit={invoiceUsage.limit === Infinity ? 0 : invoiceUsage.limit}
                label="този месец"
              />
            )}
          </div>
          <p className="card-description">
            Създавайте фактури бързо, изглеждайте професионално и проследявайте какво ви дължат
          </p>
        </div>
        <Toolbar className="page-header-actions flex min-h-0 w-full flex-wrap items-center justify-end gap-2 bg-transparent p-0 shadow-none sm:w-auto">
          {canCreateInvoices && (
            <ButtonGroup size="md" className="hidden sm:inline-flex">
              <Button variant="outline" asChild size="lg">
                <Link href="/invoices/import">
                  <Upload className="mr-2 h-4 w-4" />
                  Импорт
                </Link>
              </Button>
            </ButtonGroup>
          )}
          {(isLoadingUsage || canCreateInvoice) ? (
            <Button 
              asChild 
              size="3" 
              variant="solid" 
              color="green"
              className="btn-responsive shadow-lg"
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
        </Toolbar>
      </div>
      
      {/* Fast Action Button - Floating */}
      {canCreateInvoices && !isLoadingUsage && canCreateInvoice && (
        <div className="fixed bottom-[calc(env(safe-area-inset-bottom)+0.75rem)] right-3 z-40 md:hidden">
          <Button
            asChild
            size="lg"
            className="h-12 w-12 rounded-full gradient-primary text-white border-0 shadow-xl transition-transform hover:scale-105 hover:ring-2 hover:ring-emerald-400/30 active:scale-95"
          >
            <Link href="/invoices/new">
              <Plus className="h-5 w-5" />
            </Link>
          </Button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="mx-auto grid max-w-3xl grid-cols-2 gap-2 sm:max-w-4xl sm:gap-2.5 lg:max-w-none lg:grid-cols-4">
        {statsCards.map((stat) => (
          <div key={stat.title}>
            <CardStatsMetric
              title={stat.title}
              value={stat.value}
              valueSuffix={stat.valueSuffix}
              valueClassName={stat.valueClassName}
              icon={stat.icon}
            />
          </div>
        ))}
      </div>

      {/* Filters */}
      <Card className="rounded-3xl border border-border/50 bg-card/90 shadow-sm">
        <CardContent className="p-3! sm:p-4!">
          <div className="space-y-3 md:hidden">
            <div className="min-w-0 rounded-2xl border border-border/60 bg-muted/20 p-2">
              <SearchField
                aria-label="Търсене по номер, клиент или дата"
                placeholder="Търсене по номер, клиент или дата..."
                value={searchQuery}
                onChange={setSearchQuery}
                className="**:data-[slot=search-field-group]:min-h-11 **:data-[slot=search-field-group]:rounded-full **:data-[slot=search-field-input]:text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="min-h-0! h-11 justify-center rounded-2xl text-sm"
                onClick={() => setShowMobileFilters((prev) => !prev)}
              >
                <Filter className="mr-1.5 h-3.5 w-3.5" />
                Филтри
                {activeFilterCount > 0 && (
                  <span className="ml-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
                    {activeFilterCount}
                  </span>
                )}
                {showMobileFilters
                  ? <ChevronUp className="ml-1.5 h-3 w-3 text-muted-foreground" />
                  : <ChevronDown className="ml-1.5 h-3 w-3 text-muted-foreground" />
                }
              </Button>
              <ExportDialogWrapper clients={clients} companies={companies} />
            </div>
            {showMobileFilters && (
              <div className="grid gap-2 rounded-2xl border border-border/60 bg-muted/15 p-2.5">
                <Select value={statusFilter} onValueChange={setStatusFilter} aria-label="Филтър по статус">
                  <SelectTrigger className="h-auto min-h-10 w-full rounded-xl px-3 py-2 text-sm">
                    <Filter className="mr-1.5 h-3.5 w-3.5" />
                    <SelectValue placeholder="Филтър по статус" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Всички статуси</SelectItem>
                    <SelectItem value="DRAFT">Чернови</SelectItem>
                    <SelectItem value="ISSUED">Издадени</SelectItem>
                    <SelectItem value="PAID">Платени</SelectItem>
                    <SelectItem value="OVERDUE">Просрочени</SelectItem>
                    <SelectItem value="VOIDED">Анулирани</SelectItem>
                    <SelectItem value="CANCELLED">Отказани</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={`${sortField}-${sortDirection}`} onValueChange={(val) => {
                  const [field, dir] = val.split("-");
                  setSortField(field as any);
                  setSortDirection(dir as any);
                }} aria-label="Сортиране на фактурите">
                  <SelectTrigger className="h-auto min-h-10 w-full rounded-xl px-3 py-2 text-sm">
                    <ArrowUpDown className="mr-1.5 h-3.5 w-3.5" />
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
              </div>
            )}
          </div>
          <div className="hidden md:grid md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,1fr)_auto] md:items-center md:gap-2">
            <div className="min-w-0 rounded-2xl border border-border/60 bg-muted/20 p-2">
              <SearchField
                aria-label="Търсене по номер, клиент или дата"
                placeholder="Търсене по номер, клиент или дата..."
                value={searchQuery}
                onChange={setSearchQuery}
                className="**:data-[slot=search-field-group]:min-h-11 **:data-[slot=search-field-group]:rounded-full **:data-[slot=search-field-input]:text-sm"
              />
            </div>
            <div className="min-w-0">
              <Select value={statusFilter} onValueChange={setStatusFilter} aria-label="Филтър по статус">
                <SelectTrigger className="h-auto min-h-11 w-full rounded-2xl px-3 py-2 text-sm">
                  <Filter className="mr-1.5 h-3.5 w-3.5" />
                  <SelectValue placeholder="Филтър по статус" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Всички статуси</SelectItem>
                  <SelectItem value="DRAFT">Чернови</SelectItem>
                  <SelectItem value="ISSUED">Издадени</SelectItem>
                  <SelectItem value="PAID">Платени</SelectItem>
                  <SelectItem value="OVERDUE">Просрочени</SelectItem>
                  <SelectItem value="VOIDED">Анулирани</SelectItem>
                  <SelectItem value="CANCELLED">Отказани</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="min-w-0">
              <Select
                value={`${sortField}-${sortDirection}`}
                onValueChange={(val) => {
                const [field, dir] = val.split("-");
                setSortField(field as any);
                setSortDirection(dir as any);
                }}
                aria-label="Сортиране на фактурите"
              >
                <SelectTrigger className="h-auto min-h-11 w-full rounded-2xl px-3 py-2 text-sm">
                  <ArrowUpDown className="mr-1.5 h-3.5 w-3.5" />
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
            </div>
            <div className="flex w-full justify-end">
              <ExportDialogWrapper clients={clients} companies={companies} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invoices List */}
      <Card className="border border-border/40 shadow-sm">
        <CardHeader className="space-y-1 pb-3 sm:pb-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Badge variant="info" className="mb-2">
                Документи
              </Badge>
              <CardTitle>Списък с фактури</CardTitle>
              <CardDescription>
                {filteredInvoices.length} от {invoices.length} фактури
              </CardDescription>
            </div>
            <Toolbar className="flex min-h-0 w-full flex-col gap-2 bg-transparent p-0 shadow-none sm:w-auto sm:flex-row sm:justify-end">
              {canCreateInvoices && (isLoadingUsage || canCreateInvoice) && (
                <Button 
                  asChild 
                  className="h-11 w-full border-0 text-white shadow-lg transition-all gradient-primary hover:shadow-md hover:ring-2 hover:ring-emerald-400/25 sm:w-auto"
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
            </Toolbar>
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
              {searchQuery || statusFilter !== "all" ? (
                <Button
                  type="button"
                  variant="outline"
                  className="mb-3"
                  onClick={() => {
                    setSearchQuery("");
                    setStatusFilter("all");
                  }}
                >
                  Изчисти филтрите
                </Button>
              ) : null}
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
              <div className="space-y-2 px-2 pb-4 md:hidden sm:px-3">
                {paginatedInvoices.map((invoice) => {
                  const normalizedStatus = normalizeInvoiceStatus(invoice.status);
                  const displayStatus = getDisplayStatus(invoice);
                  const statusConfig = getStatusConfig(displayStatus);
                  const StatusIcon = statusConfig.icon;
                  return (
                    <div key={invoice.id} className="rounded-xl border border-border/40 bg-muted/20 px-3 py-2.5 sm:px-3.5 sm:py-3">
                      <div className="flex items-start justify-between gap-2.5">
                        <div className="flex min-w-0 items-start gap-2.5">
                          <div
                            className={cn(
                              "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                              normalizedStatus === "ISSUED"
                                ? "bg-emerald-500/10"
                                : normalizedStatus === "DRAFT"
                                  ? "bg-amber-500/10"
                                  : "bg-red-500/10"
                            )}
                          >
                            <StatusIcon
                              className={cn(
                                "h-4 w-4",
                                normalizedStatus === "ISSUED"
                                  ? "text-emerald-600"
                                  : normalizedStatus === "DRAFT"
                                    ? "text-amber-600"
                                    : "text-red-600"
                              )}
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-sm">
                              {invoice.client.name}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">
                              № {invoice.invoiceNumber}
                            </p>
                            {invoice.createdById && createdByMap[invoice.createdById] && (
                              <p className="truncate text-xs text-muted-foreground">
                                От: {createdByMap[invoice.createdById].name ?? "—"}
                              </p>
                            )}
                            <div className="mt-0.5 text-xs text-muted-foreground">
                              <p>
                                {format(new Date(invoice.issueDate), "d MMM yyyy", {
                                  locale: bg,
                                })}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="shrink-0 text-right space-y-1">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium",
                              statusConfig.className
                            )}
                          >
                            <StatusIcon className="h-3 w-3" />
                            {statusConfig.label}
                          </span>
                          <p className="text-sm font-bold tabular-nums text-foreground">
                            {formatPrice(Number(invoice.total))} €
                          </p>
                        </div>
                      </div>
                      <div className="mt-2 flex items-center gap-1 border-t border-border/30 pt-2">
                        <div className="hidden min-[320px]:flex min-w-0 flex-1 items-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            asChild
                            className="min-h-0! h-7 min-w-0 flex-1 justify-center rounded-lg bg-slate-100 px-1 py-1 text-slate-700 hover:bg-slate-200 dark:bg-slate-800/80 dark:text-slate-200 dark:hover:bg-slate-800"
                            title="Преглед"
                          >
                            <Link href={`/invoices/${invoice.id}`}>
                              <Eye className="h-3.5 w-3.5" />
                            </Link>
                          </Button>
                          {invoice.userId === currentUserId && normalizedStatus === "DRAFT" && (
                            <>
                              <Button
                                size="sm"
                                className="min-h-0! h-7 min-w-0 flex-1 justify-center rounded-lg border-0 bg-emerald-600 px-1 py-1 text-white hover:bg-emerald-700"
                                onClick={() => openStatusModal(invoice, "ISSUED")}
                                title="Издай"
                              >
                                <FileCheck className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                asChild
                                className="min-h-0! h-7 min-w-0 flex-1 justify-center rounded-lg bg-sky-500/15 px-1 py-1 text-sky-800 hover:bg-sky-500/25 dark:text-sky-200"
                                title="Редакция"
                              >
                                <Link href={`/invoices/${invoice.id}/edit`}>
                                  <Edit className="h-3.5 w-3.5" />
                                </Link>
                              </Button>
                            </>
                          )}
                          {invoice.userId === currentUserId &&
                            canCreateDebitNoteFromInvoice(invoice.status) && (
                              <Button
                                size="sm"
                                variant="ghost"
                                asChild
                                className="min-h-0! h-7 min-w-0 flex-1 justify-center rounded-lg bg-emerald-500/12 px-1 py-1 text-emerald-800 hover:bg-emerald-500/20 dark:text-emerald-200"
                                title="Дебитно известие"
                              >
                                <Link href={`/debit-notes/new?invoiceId=${invoice.id}`}>
                                  <TrendingUp className="h-3.5 w-3.5" />
                                </Link>
                              </Button>
                            )}
                          {invoice.userId === currentUserId &&
                            canCreateCreditNoteFromInvoice(invoice.status) && (
                              <Button
                                size="sm"
                                variant="ghost"
                                asChild
                                className="min-h-0! h-7 min-w-0 flex-1 justify-center rounded-lg bg-red-500/12 px-1 py-1 text-red-700 hover:bg-red-500/20 dark:text-red-300"
                                title="Кредитно известие"
                              >
                                <Link href={`/credit-notes/new?invoiceId=${invoice.id}`}>
                                  <TrendingDown className="h-3.5 w-3.5" />
                                </Link>
                              </Button>
                            )}
                          {normalizedStatus !== "DRAFT" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="min-h-0! h-7 min-w-0 flex-1 justify-center rounded-lg bg-violet-500/12 px-1 py-1 text-violet-800 hover:bg-violet-500/20 dark:text-violet-200"
                              onClick={() => void handleDuplicate(invoice.id)}
                              disabled={duplicateLock.isPending}
                              loading={duplicateLock.isPending}
                              title="Дублирай"
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            aria-label="Още действия"
                            className={cn(
                              "inline-flex h-7 min-h-0 flex-1 items-center justify-center gap-1 rounded-lg px-2 text-muted-foreground transition-colors",
                              "min-[320px]:h-8 min-[320px]:w-8 min-[320px]:flex-none min-[320px]:px-0",
                              "border border-border/50 bg-background/90 hover:bg-muted/70 hover:text-foreground"
                            )}
                          >
                            <Edit className="h-3 w-3 shrink-0 min-[320px]:hidden" aria-hidden />
                            <span className="text-[10px] font-medium min-[320px]:sr-only">Действия</span>
                            <MoreHorizontal className="hidden h-3.5 w-3.5 shrink-0 min-[320px]:block" aria-hidden />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuItem asChild>
                              <Link href={`/invoices/${invoice.id}`}>
                                <DropdownMenuItemIcon>
                                  <Eye />
                                </DropdownMenuItemIcon>
                                <DropdownMenuItemText>Преглед</DropdownMenuItemText>
                              </Link>
                            </DropdownMenuItem>
                            {invoice.userId === currentUserId && normalizedStatus === "DRAFT" && (
                              <DropdownMenuItem asChild className="min-[320px]:hidden">
                                <Link href={`/invoices/${invoice.id}/edit`}>
                                  <DropdownMenuItemIcon>
                                    <Edit />
                                  </DropdownMenuItemIcon>
                                  <DropdownMenuItemText>Редактиране</DropdownMenuItemText>
                                </Link>
                              </DropdownMenuItem>
                            )}
                            {normalizedStatus === "DRAFT" && (
                              <>
                                <DropdownMenuItem
                                  onClick={() => openStatusModal(invoice, "ISSUED")}
                                  className="text-emerald-600 focus:text-emerald-600"
                                >
                                  <DropdownMenuItemIcon>
                                    <FileCheck />
                                  </DropdownMenuItemIcon>
                                  <DropdownMenuItemText>Издай фактура</DropdownMenuItemText>
                                </DropdownMenuItem>
                                {invoice.userId === currentUserId && (
                                  <DropdownMenuItem
                                    onClick={() => openVoidModal(invoice)}
                                    className="text-purple-600 focus:text-purple-600 dark:focus:bg-purple-500/15"
                                  >
                                    <DropdownMenuItemIcon>
                                      <Ban />
                                    </DropdownMenuItemIcon>
                                    <DropdownMenuItemText>Анулирай</DropdownMenuItemText>
                                  </DropdownMenuItem>
                                )}
                              </>
                            )}
                            {normalizedStatus === "ISSUED" && invoice.userId === currentUserId && (
                              <DropdownMenuItem
                                onClick={() => openCancelModal(invoice)}
                                className="text-red-600 focus:text-red-600"
                              >
                                <DropdownMenuItemIcon>
                                  <XCircle />
                                </DropdownMenuItemIcon>
                                <DropdownMenuItemText>Отмени фактура</DropdownMenuItemText>
                              </DropdownMenuItem>
                            )}
                            {invoice.userId === currentUserId &&
                              canCreateDebitNoteFromInvoice(invoice.status) && (
                                <DropdownMenuItem asChild>
                                  <Link href={`/debit-notes/new?invoiceId=${invoice.id}`}>
                                    <DropdownMenuItemIcon>
                                      <TrendingUp />
                                    </DropdownMenuItemIcon>
                                    <DropdownMenuItemText>Дебитно известие</DropdownMenuItemText>
                                  </Link>
                                </DropdownMenuItem>
                              )}
                            {invoice.userId === currentUserId &&
                              canCreateCreditNoteFromInvoice(invoice.status) && (
                                <DropdownMenuItem asChild>
                                  <Link href={`/credit-notes/new?invoiceId=${invoice.id}`}>
                                    <DropdownMenuItemIcon>
                                      <TrendingDown />
                                    </DropdownMenuItemIcon>
                                    <DropdownMenuItemText>Кредитно известие</DropdownMenuItemText>
                                  </Link>
                                </DropdownMenuItem>
                              )}
                            <DropdownMenuItem
                              isDisabled={duplicateLock.isPending}
                              onClick={() => void handleDuplicate(invoice.id)}
                            >
                              <DropdownMenuItemIcon>
                                <Copy />
                              </DropdownMenuItemIcon>
                              <DropdownMenuItemText>Дублирай</DropdownMenuItemText>
                            </DropdownMenuItem>
                            {invoice.userId === currentUserId && canDeleteInvoice(invoice.status) && (
                              <DropdownMenuItem
                                onClick={() => openDeleteModal(invoice)}
                                className="text-red-600 focus:text-red-600"
                              >
                                <DropdownMenuItemIcon>
                                  <Trash2 />
                                </DropdownMenuItemIcon>
                                <DropdownMenuItemText>Изтрий фактура</DropdownMenuItemText>
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="hidden min-w-0 overflow-x-auto md:block">
                <Table
                  variant="secondary"
                  stickyHeader
                  contentAriaLabel="Списък с фактури"
                  contentClassName="min-w-[980px]"
                  scrollContainerClassName="overflow-x-auto overscroll-x-contain"
                  className="invoices-table-flat data-table-polished min-w-0 rounded-2xl border border-border/50 bg-transparent"
                >
                  <TableHeader className="bg-muted/35">
                    <TableHead isRowHeader className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Фактура
                    </TableHead>
                    <TableHead className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Клиент
                    </TableHead>
                    <TableHead className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Създадена от
                    </TableHead>
                    <TableHead className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Дата
                    </TableHead>
                    <TableHead className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Сума
                    </TableHead>
                    <TableHead className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Статус
                    </TableHead>
                    <TableHead className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Действия
                    </TableHead>
                  </TableHeader>
                  <TableBody items={paginatedInvoices}>
                    {(item) => {
                      const invoice = item as Invoice;
                      const normalizedStatus = normalizeInvoiceStatus(invoice.status);
                      const displayStatus = getDisplayStatus(invoice);
                      const statusConfig = getStatusConfig(displayStatus);
                      const StatusIcon = statusConfig.icon;

                      return (
                        <TableRow key={invoice.id} id={invoice.id} className="group">
                              <TableCell className="px-6 py-4">
                                <div className="flex items-center justify-center gap-3">
                                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                                    normalizedStatus === "ISSUED"
                                      ? "bg-emerald-500/10"
                                      : normalizedStatus === "DRAFT"
                                        ? "bg-amber-500/10"
                                        : "bg-red-500/10"
                                  }`}>
                                    <StatusIcon className={`h-5 w-5 ${
                                      normalizedStatus === "ISSUED"
                                        ? "text-emerald-600"
                                        : normalizedStatus === "DRAFT"
                                          ? "text-amber-600"
                                          : "text-red-600"
                                    }`} />
                                  </div>
                                  <div className="min-w-0 max-w-[12rem] text-center sm:max-w-[14rem]">
                                    <p className="truncate text-sm font-semibold">{invoice.invoiceNumber}</p>
                                    <p className="text-xs text-muted-foreground">
                                      № фактура
                                    </p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="px-6 py-4 text-center">
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-medium">{invoice.client.name}</p>
                                </div>
                              </TableCell>
                              <TableCell className="px-6 py-4 text-center">
                                <p className="truncate text-sm text-muted-foreground">
                                  {invoice.createdById && createdByMap[invoice.createdById]
                                    ? createdByMap[invoice.createdById].name ?? invoice.createdById
                                    : "—"}
                                </p>
                              </TableCell>
                              <TableCell className="px-6 py-4 text-center">
                                <p className="text-sm text-muted-foreground">
                                  {format(new Date(invoice.issueDate), "d MMMM yyyy", { locale: bg })}
                                </p>
                              </TableCell>
                              <TableCell className="px-6 py-4 text-right">
                                <p className="text-sm font-bold">
                                  {formatPrice(Number(invoice.total))} €
                                </p>
                              </TableCell>
                              <TableCell className="px-6 py-4">
                                <div className="flex justify-center">
                                  <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${statusConfig.className}`}>
                                    <StatusIcon className="h-3 w-3" />
                                    {statusConfig.label}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="px-6 py-4">
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
                                    <DropdownMenuContent align="end" className="min-w-56">
                                      {invoice.userId === currentUserId && normalizedStatus === "DRAFT" && (
                                        <DropdownMenuItem asChild>
                                          <Link href={`/invoices/${invoice.id}/edit`} onClick={(e) => e.stopPropagation()}>
                                            <DropdownMenuItemIcon>
                                              <Edit />
                                            </DropdownMenuItemIcon>
                                            <DropdownMenuItemText>Редактиране</DropdownMenuItemText>
                                          </Link>
                                        </DropdownMenuItem>
                                      )}
                                      {normalizedStatus === "DRAFT" && (
                                        <>
                                          <DropdownMenuItem
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              openStatusModal(invoice, "ISSUED");
                                            }}
                                            className="text-emerald-600 focus:text-emerald-600"
                                          >
                                            <DropdownMenuItemIcon>
                                              <FileCheck />
                                            </DropdownMenuItemIcon>
                                            <DropdownMenuItemText>Издай фактура</DropdownMenuItemText>
                                          </DropdownMenuItem>
                                          {invoice.userId === currentUserId && (
                                            <DropdownMenuItem
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                openVoidModal(invoice);
                                              }}
                                              className="text-purple-600 focus:text-purple-600 dark:focus:bg-purple-500/15"
                                            >
                                              <DropdownMenuItemIcon>
                                                <Ban />
                                              </DropdownMenuItemIcon>
                                              <DropdownMenuItemText>Анулирай</DropdownMenuItemText>
                                            </DropdownMenuItem>
                                          )}
                                        </>
                                      )}
                                      {normalizedStatus === "ISSUED" && invoice.userId === currentUserId && (
                                        <DropdownMenuItem
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            openCancelModal(invoice);
                                          }}
                                          className="text-red-600 focus:text-red-600"
                                        >
                                          <DropdownMenuItemIcon>
                                            <XCircle />
                                          </DropdownMenuItemIcon>
                                          <DropdownMenuItemText>Отмени фактура</DropdownMenuItemText>
                                        </DropdownMenuItem>
                                      )}
                                      {invoice.userId === currentUserId &&
                                        canCreateDebitNoteFromInvoice(invoice.status) && (
                                          <DropdownMenuItem asChild>
                                            <Link
                                              href={`/debit-notes/new?invoiceId=${invoice.id}`}
                                              onClick={(e) => e.stopPropagation()}
                                            >
                                              <DropdownMenuItemIcon>
                                                <TrendingUp />
                                              </DropdownMenuItemIcon>
                                              <DropdownMenuItemText>Дебитно известие</DropdownMenuItemText>
                                            </Link>
                                          </DropdownMenuItem>
                                        )}
                                      {invoice.userId === currentUserId &&
                                        canCreateCreditNoteFromInvoice(invoice.status) && (
                                          <DropdownMenuItem asChild>
                                            <Link
                                              href={`/credit-notes/new?invoiceId=${invoice.id}`}
                                              onClick={(e) => e.stopPropagation()}
                                            >
                                              <DropdownMenuItemIcon>
                                                <TrendingDown />
                                              </DropdownMenuItemIcon>
                                              <DropdownMenuItemText>Кредитно известие</DropdownMenuItemText>
                                            </Link>
                                          </DropdownMenuItem>
                                        )}
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem asChild>
                                        <Link href={`/invoices/${invoice.id}`} onClick={(e) => e.stopPropagation()}>
                                          <DropdownMenuItemIcon>
                                            <Eye />
                                          </DropdownMenuItemIcon>
                                          <DropdownMenuItemText>Преглед</DropdownMenuItemText>
                                        </Link>
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        isDisabled={duplicateLock.isPending}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          void handleDuplicate(invoice.id);
                                        }}
                                      >
                                        <DropdownMenuItemIcon>
                                          <Copy />
                                        </DropdownMenuItemIcon>
                                        <DropdownMenuItemText>Дублирай</DropdownMenuItemText>
                                      </DropdownMenuItem>
                                      {invoice.userId === currentUserId && canDeleteInvoice(invoice.status) && (
                                        <DropdownMenuItem
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            openDeleteModal(invoice);
                                          }}
                                          className="text-red-600 focus:text-red-600"
                                        >
                                          <DropdownMenuItemIcon>
                                            <Trash2 />
                                          </DropdownMenuItemIcon>
                                          <DropdownMenuItemText>Изтрий фактура</DropdownMenuItemText>
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
                                        <DropdownMenuItemIcon>
                                          <Printer />
                                        </DropdownMenuItemIcon>
                                        <DropdownMenuItemText>Принтирай</DropdownMenuItemText>
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
                                        <DropdownMenuItemIcon>
                                          <Download />
                                        </DropdownMenuItemIcon>
                                        <DropdownMenuItemText>Изтегли PDF</DropdownMenuItemText>
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        }}
                  </TableBody>
                </Table>
              </div>
              {filteredInvoices.length > ITEMS_PER_PAGE && (
                <div className="flex flex-col items-center gap-3 border-t px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-6 sm:py-4">
                  <p className="order-2 text-center text-xs text-muted-foreground sm:order-1 sm:text-left sm:text-sm">
                    Показване {((currentPage - 1) * ITEMS_PER_PAGE) + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, filteredInvoices.length)} от {filteredInvoices.length}
                  </p>
                  <div className="order-1 flex w-full justify-center overflow-x-auto pb-0.5 sm:order-2 sm:w-auto sm:justify-end sm:pb-0">
                    <Pagination
                      className="shrink-0"
                      currentPage={currentPage}
                      totalPages={Math.ceil(filteredInvoices.length / ITEMS_PER_PAGE)}
                      onPageChange={setCurrentPage}
                      size="sm"
                    />
                  </div>
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
          invoiceId={statusModal.invoice.id}
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
          isLoading={deleteAction.loading}
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

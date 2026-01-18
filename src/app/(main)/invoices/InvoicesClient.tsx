"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Button as RadixButton } from "@radix-ui/themes";
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
  Trash2
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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

    return filtered;
  }, [invoices, searchQuery, statusFilter]);

  // Stats
  const stats = useMemo(() => {
    const issued = invoices.filter(i => i.status === 'ISSUED' || i.status === 'PAID');
    const draft = invoices.filter(i => i.status === 'DRAFT');
    const cancelled = invoices.filter(i => i.status === 'CANCELLED');
    const totalValue = issued.reduce((sum, i) => sum + Number(i.total), 0);
    
    return { issued: issued.length, draft: draft.length, cancelled: cancelled.length, totalValue };
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
      case "ISSUED":
      case "PAID": // PAID in DB = ISSUED in app
        return {
          label: "Издадена",
          icon: CheckCircle,
          className: "bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:border-emerald-800"
        };
      case "DRAFT":
        return {
          label: "Чернова",
          icon: Clock,
          className: "bg-amber-500/10 text-amber-600 border-amber-200 dark:border-amber-800"
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">Фактури</h1>
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
          <RadixButton 
            asChild 
            size="3" 
            variant="solid" 
            color="green"
            className="shadow-lg"
          >
            <Link href="/invoices/new">
              <Plus className="mr-2 h-5 w-5" />
              Нова фактура
            </Link>
          </RadixButton>
        </div>
      </div>
      
      {/* Fast Action Button - Floating */}
      {canCreateInvoices && (
        <div className="fixed bottom-8 right-8 z-50">
          <Button
            asChild
            size="lg"
            className="h-14 w-14 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xl shadow-emerald-600/30 hover:shadow-emerald-600/40 transition-all hover:scale-110"
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
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
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
                <SelectItem value="CANCELLED">
                  <span className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-red-500" />
                    Отказани
                  </span>
                </SelectItem>
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
            {canCreateInvoices && (
              <Button 
                asChild 
                className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20 hover:shadow-emerald-600/30 transition-all"
              >
                <Link href="/invoices/new">
                  <Plus className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Нова фактура</span>
                  <span className="sm:hidden">Нова</span>
                </Link>
              </Button>
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
              {canCreateInvoices && (
                <Button asChild>
                  <Link href="/invoices/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Създай фактура
                  </Link>
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="space-y-3 px-4 pb-4 md:hidden">
                {filteredInvoices.map((invoice) => {
                  const statusConfig = getStatusConfig(invoice.status);
                  const StatusIcon = statusConfig.icon;
                  return (
                    <div key={invoice.id} className="rounded-xl border bg-card p-4 shadow-sm">
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
                          <Badge variant="outline" className={`${statusConfig.className} mt-2`}>
                            {statusConfig.label}
                          </Badge>
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
                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                          >
                            <FileCheck className="mr-2 h-4 w-4" />
                            Издай
                          </Button>
                        )}
                        {invoice.userId === currentUserId && invoice.status === "DRAFT" && (
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
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Фактура
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Клиент
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">
                      Дата
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Сума
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Статус
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      <span className="hidden md:inline">Действия</span>
                      <MoreHorizontal className="h-4 w-4 inline md:hidden" />
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  <AnimatePresence>
                    {filteredInvoices.map((invoice, index) => {
                      const statusConfig = getStatusConfig(invoice.status);
                      const StatusIcon = statusConfig.icon;
                      
                      return (
                        <motion.tr 
                          key={invoice.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.2, delay: index * 0.03 }}
                          className="hover:bg-muted/50 transition-colors group"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
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
                                <p className="text-xs text-muted-foreground md:hidden">
                                  {format(new Date(invoice.issueDate), "d MMM yyyy", { locale: bg })}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm font-medium">{invoice.client.name}</p>
                          </td>
                          <td className="px-6 py-4 hidden md:table-cell">
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(invoice.issueDate), "d MMMM yyyy", { locale: bg })}
                            </p>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <p className="text-sm font-bold">
                              {formatPrice(Number(invoice.total))} €
                            </p>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex justify-center">
                              <Badge variant="outline" className={`${statusConfig.className} px-3 py-1`}>
                                {statusConfig.label}
                              </Badge>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-center">
                              <DropdownMenu>
                                <DropdownMenuTrigger className="h-8 w-8 p-0 hover:bg-muted rounded-md flex items-center justify-center">
                                  <MoreHorizontal className="h-4 w-4" />
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem asChild>
                                    <Link href={`/invoices/${invoice.id}`}>
                                      <Eye className="mr-2 h-4 w-4" />
                                      Преглед
                                    </Link>
                                  </DropdownMenuItem>
                                  {invoice.userId === currentUserId && invoice.status === "DRAFT" && (
                                    <DropdownMenuItem asChild>
                                      <Link href={`/invoices/${invoice.id}/edit`}>
                                        <Edit className="mr-2 h-4 w-4" />
                                        Редактиране
                                      </Link>
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuSeparator />
                                  {invoice.status === "DRAFT" && (
                                    <>
                                      <DropdownMenuItem
                                        onClick={() => openStatusModal(invoice, "ISSUED")}
                                        className="text-emerald-600 focus:text-emerald-600"
                                      >
                                        <FileCheck className="mr-2 h-4 w-4" />
                                        Издай фактура
                                      </DropdownMenuItem>
                                      {invoice.userId === currentUserId && (
                                        <>
                                          <DropdownMenuSeparator />
                                          <DropdownMenuItem
                                            onClick={() => openDeleteModal(invoice)}
                                            className="text-red-600 focus:text-red-600"
                                          >
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            Изтрий фактура
                                          </DropdownMenuItem>
                                        </>
                                      )}
                                    </>
                                  )}
                                  <DropdownMenuItem
                                    onClick={async () => {
                                      try {
                                        // Fetch PDF and open in new tab for printing
                                        const response = await fetch(`/api/invoices/export-pdf?invoiceId=${invoice.id}`);
                                        
                                        if (!response.ok) {
                                          throw new Error('Грешка при генерирането на PDF');
                                        }
                                        
                                        const blob = await response.blob();
                                        const url = URL.createObjectURL(blob);
                                        
                                        // Create a link element and click it to open PDF in new tab
                                        const link = document.createElement('a');
                                        link.href = url;
                                        link.target = '_blank';
                                        link.style.display = 'none';
                                        document.body.appendChild(link);
                                        link.click();
                                        document.body.removeChild(link);
                                        
                                        // Show toast message
                                        toast.info("PDF файлът беше отворен. Моля, използвайте бутона за принтиране в браузъра.");
                                        
                                        // Clean up URL after a delay
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
                                    onClick={async () => {
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
                          </td>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                </tbody>
                </table>
              </div>
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
    </div>
  );
}

"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
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
  MoreHorizontal
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
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Filter invoices based on search and status
  const filteredInvoices = useMemo(() => {
    let filtered = initialInvoices;

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
  }, [initialInvoices, searchQuery, statusFilter]);

  // Stats
  const stats = useMemo(() => {
    const issued = initialInvoices.filter(i => i.status === 'ISSUED');
    const draft = initialInvoices.filter(i => i.status === 'DRAFT');
    const cancelled = initialInvoices.filter(i => i.status === 'CANCELLED');
    const totalValue = issued.reduce((sum, i) => sum + Number(i.total), 0);
    
    return { issued: issued.length, draft: draft.length, cancelled: cancelled.length, totalValue };
  }, [initialInvoices]);

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "ISSUED":
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
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Фактури</h1>
          <p className="text-muted-foreground mt-1">
            Управлявайте и проследявайте вашите фактури
          </p>
        </div>
        {canCreateInvoices && (
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <Link href="/invoices/import">
                <Upload className="mr-2 h-4 w-4" />
                Импорт
              </Link>
            </Button>
            <Button asChild className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20">
              <Link href="/invoices/new">
                <Plus className="mr-2 h-4 w-4" />
                Нова фактура
              </Link>
            </Button>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500/5 to-indigo-600/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Общо</p>
                <p className="text-2xl font-bold">{initialInvoices.length}</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                <FileText className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-500/5 to-teal-600/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Издадени</p>
                <p className="text-2xl font-bold text-emerald-600">{stats.issued}</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-500/5 to-orange-600/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Чернови</p>
                <p className="text-2xl font-bold text-amber-600">{stats.draft}</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                <Clock className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-lg bg-gradient-to-br from-slate-500/5 to-slate-600/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Стойност</p>
                <p className="text-2xl font-bold">{stats.totalValue.toFixed(0)} лв</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-slate-500 to-slate-600 flex items-center justify-center">
                <Download className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
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
                {filteredInvoices.length} от {initialInvoices.length} фактури
              </CardDescription>
            </div>
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
            <div className="overflow-x-auto">
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
                    <th className="px-6 py-4 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Действия
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
                                invoice.status === 'ISSUED' 
                                  ? 'bg-emerald-500/10'
                                  : invoice.status === 'DRAFT'
                                  ? 'bg-amber-500/10'
                                  : 'bg-red-500/10'
                              }`}>
                                <StatusIcon className={`h-5 w-5 ${
                                  invoice.status === 'ISSUED' 
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
                              {Number(invoice.total).toFixed(2)} лв
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
                            <div className="flex items-center justify-end gap-1">
                              <Button variant="ghost" size="sm" asChild className="opacity-0 group-hover:opacity-100 transition-opacity">
                                <Link href={`/invoices/${invoice.id}`}>
                                  <Eye className="h-4 w-4 mr-1" />
                                  Преглед
                                </Link>
                              </Button>
                              
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
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
                                  <DropdownMenuItem>
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}

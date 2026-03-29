"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { bg } from "date-fns/locale";
import { 
  History, 
  FileText, 
  CheckCircle, 
  Edit, 
  Mail, 
  XCircle, 
  Download,
  Clock,
  Filter,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  User,
  Building,
  Users,
  Package,
  CreditCard,
  Receipt,
  Shield
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  invoiceId: string | null;
  changes: any;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

const ACTION_LABELS: Record<string, string> = {
  CREATE: "Създаване",
  UPDATE: "Обновяване",
  DELETE: "Изтриване",
  ISSUE: "Издаване",
  SEND: "Изпращане",
  CANCEL: "Отмяна",
  EXPORT: "Експорт",
  EXPORT_DATA: "Експорт на данни",
  DELETE_ACCOUNT: "Изтриване на акаунт",
  LOGIN: "Вход",
  LOGOUT: "Изход",
};

const ENTITY_LABELS: Record<string, string> = {
  INVOICE: "Фактура",
  CLIENT: "Клиент",
  COMPANY: "Компания",
  PRODUCT: "Продукт",
  USER: "Потребител",
  CREDIT_NOTE: "Кредитно известие",
  SUBSCRIPTION: "Абонамент",
};

const getActionIcon = (action: string) => {
  switch (action) {
    case 'CREATE': return <FileText className="h-4 w-4" />;
    case 'UPDATE': return <Edit className="h-4 w-4" />;
    case 'DELETE': return <XCircle className="h-4 w-4" />;
    case 'ISSUE': return <CheckCircle className="h-4 w-4" />;
    case 'SEND': return <Mail className="h-4 w-4" />;
    case 'CANCEL': return <XCircle className="h-4 w-4" />;
    case 'EXPORT': return <Download className="h-4 w-4" />;
    case 'EXPORT_DATA': return <Download className="h-4 w-4" />;
    case 'DELETE_ACCOUNT': return <Shield className="h-4 w-4" />;
    default: return <History className="h-4 w-4" />;
  }
};

const getActionColor = (action: string) => {
  switch (action) {
    case 'CREATE': return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
    case 'UPDATE': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
    case 'DELETE': return 'bg-red-500/10 text-red-600 border-red-500/20';
    case 'ISSUE': return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
    case 'SEND': return 'bg-violet-500/10 text-violet-600 border-violet-500/20';
    case 'CANCEL': return 'bg-red-500/10 text-red-600 border-red-500/20';
    case 'EXPORT': return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
    case 'EXPORT_DATA': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
    case 'DELETE_ACCOUNT': return 'bg-red-500/10 text-red-600 border-red-500/20';
    default: return 'bg-muted text-muted-foreground';
  }
};

const getEntityIcon = (entityType: string) => {
  switch (entityType) {
    case 'INVOICE': return <FileText className="h-4 w-4" />;
    case 'CLIENT': return <Users className="h-4 w-4" />;
    case 'COMPANY': return <Building className="h-4 w-4" />;
    case 'PRODUCT': return <Package className="h-4 w-4" />;
    case 'USER': return <User className="h-4 w-4" />;
    case 'CREDIT_NOTE': return <Receipt className="h-4 w-4" />;
    case 'SUBSCRIPTION': return <CreditCard className="h-4 w-4" />;
    default: return <History className="h-4 w-4" />;
  }
};

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [entityTypeFilter, setEntityTypeFilter] = useState<string>("all");
  const limit = 20;

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
      });
      
      if (entityTypeFilter && entityTypeFilter !== "all") {
        params.append("entityType", entityTypeFilter);
      }

      const response = await fetch(`/api/audit-logs?${params}`);
      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs || []);
        setTotal(data.total || 0);
      }
    } catch (error) {
      console.error("Error fetching audit logs:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [offset, entityTypeFilter]);

  const totalPages = Math.ceil(total / limit);
  const currentPage = Math.floor(offset / limit) + 1;

  const handlePrevPage = () => {
    if (offset > 0) {
      setOffset(Math.max(0, offset - limit));
    }
  };

  const handleNextPage = () => {
    if (offset + limit < total) {
      setOffset(offset + limit);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <History className="h-8 w-8 text-primary" />
            История на действията
          </h1>
          <p className="text-muted-foreground mt-1">
            Преглед на всички действия в системата
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => fetchLogs()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Опресни
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Филтри:</span>
            </div>
            <Select value={entityTypeFilter} onValueChange={(value) => {
              setEntityTypeFilter(value);
              setOffset(0);
            }}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Тип обект" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Всички типове</SelectItem>
                <SelectItem value="INVOICE">Фактури</SelectItem>
                <SelectItem value="CLIENT">Клиенти</SelectItem>
                <SelectItem value="COMPANY">Компании</SelectItem>
                <SelectItem value="PRODUCT">Продукти</SelectItem>
                <SelectItem value="USER">Потребител</SelectItem>
                <SelectItem value="CREDIT_NOTE">Кредитни известия</SelectItem>
              </SelectContent>
            </Select>
            <div className="ml-auto text-sm text-muted-foreground">
              Общо: {total} записа
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logs List */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Журнал на действията</CardTitle>
          <CardDescription>
            Всички действия са записани за одит и проследяване
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex gap-4 items-start">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <History className="h-16 w-16 text-muted-foreground/30 mb-4" />
              <p className="text-lg font-medium">Няма записи</p>
              <p className="text-muted-foreground text-sm">
                Все още няма записани действия в системата
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {logs.map((log) => (
                <div 
                  key={log.id} 
                  className="flex gap-4 pb-4 border-b last:border-0 last:pb-0"
                >
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${getActionColor(log.action)}`}>
                    {getActionIcon(log.action)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-medium">
                        {ACTION_LABELS[log.action] || log.action}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {getEntityIcon(log.entityType)}
                        <span className="ml-1">{ENTITY_LABELS[log.entityType] || log.entityType}</span>
                      </Badge>
                      {log.invoiceId && (
                        <Link 
                          href={`/invoices/${log.invoiceId}`}
                          className="text-xs text-primary hover:underline"
                        >
                          Виж фактурата
                        </Link>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {format(new Date(log.createdAt), "d MMM yyyy, HH:mm", { locale: bg })}
                      </span>
                      {log.ipAddress && (
                        <span>IP: {log.ipAddress}</span>
                      )}
                    </div>
                    {log.changes && Object.keys(log.changes).length > 0 && (
                      <details className="mt-2">
                        <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                          Показване на детайли
                        </summary>
                        <div className="mt-2 text-xs bg-muted/50 rounded p-2 overflow-x-auto">
                          <pre className="whitespace-pre-wrap">
                            {JSON.stringify(log.changes, null, 2)}
                          </pre>
                        </div>
                      </details>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Страница {currentPage} от {totalPages}
          </p>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handlePrevPage}
              disabled={offset === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Предишна
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleNextPage}
              disabled={offset + limit >= total}
            >
              Следваща
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

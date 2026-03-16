"use client";

import { useState, useRef, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Info, ChevronDown, Loader2 } from 'lucide-react';
import { useSubscriptionHistory } from '@/hooks/useSubscriptionHistory';

interface SubscriptionHistoryProps {
  /** When set, refetch history (e.g. after returning from Stripe so payments appear) */
  refreshTrigger?: number;
}

export function SubscriptionHistory({ refreshTrigger }: SubscriptionHistoryProps = {}) {
  const [pageSize, setPageSize] = useState(10);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const {
    subscription,
    payments,
    pagination,
    isLoading,
    loadingMore,
    error,
    loadMore,
    refresh,
    changePageSize,
  } = useSubscriptionHistory(1, pageSize);
  
  // Refetch when parent signals (e.g. after payment success so webhook data appears)
  useEffect(() => {
    if (refreshTrigger != null) refresh();
  }, [refreshTrigger, refresh]);
  
  // Setup intersection observer for lazy loading
  useEffect(() => {
    if (!loadMoreRef.current || isLoading || !pagination.hasMore) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && !loadingMore) {
          loadMore();
        }
      },
      { threshold: 0.5 }
    );
    
    observer.observe(loadMoreRef.current);
    
    return () => {
      if (loadMoreRef.current) {
        observer.unobserve(loadMoreRef.current);
      }
    };
  }, [isLoading, loadingMore, pagination.hasMore, loadMore]);
  
  // Handle page size change
  const handlePageSizeChange = (value: string) => {
    const newSize = parseInt(value, 10);
    setPageSize(newSize);
    changePageSize(newSize);
  };
  
  if (isLoading) {
    return <SubscriptionHistorySkeleton />;
  }
  
  if (error) {
    return (
      <div className="flex flex-col gap-3 py-4">
        <div className="flex items-center gap-2 text-sm text-destructive">
          <Info className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
        <Button onClick={refresh} variant="outline" size="sm">
          Опитайте отново
        </Button>
      </div>
    );
  }

  if (!subscription) {
    return (
      <p className="text-sm text-muted-foreground py-4">
        Нямате активен платен абонамент. След като изберете план и платите, тук ще се показва история на плащанията и промените в статуса.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {payments.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <p className="text-sm text-muted-foreground">
            Все още няма записани плащания. Те се записват автоматично след успешно плащане чрез Stripe.
          </p>
          <Button onClick={refresh} variant="outline" size="sm">
            Обнови
          </Button>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2">
            <label htmlFor="history-page-size" className="shrink-0 text-sm text-muted-foreground whitespace-nowrap">
              На страница:
            </label>
            <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
              <SelectTrigger id="history-page-size" className="w-20 h-8 text-center font-medium tabular-nums">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <PaymentsTable payments={payments} />

          {pagination.hasMore && (
            <div ref={loadMoreRef} className="py-3 flex justify-center">
              {loadingMore ? (
                <span className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Зареждане...
                </span>
              ) : (
                <Button variant="ghost" size="sm" className="gap-1" onClick={loadMore}>
                  <ChevronDown className="h-4 w-4" />
                  Зареди още
                </Button>
              )}
            </div>
          )}

          <div className="flex flex-col gap-1 pt-1 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <span className="tabular-nums">Показани {payments.length} от {pagination.totalItems}</span>
            <span className="tabular-nums">Страница {pagination.page} от {Math.max(pagination.totalPages, 1)}</span>
          </div>
        </>
      )}
    </div>
  );
}

function PaymentsTable({ payments }: { payments: any[] }) {
  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('bg-BG', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  const formatMoney = (payment: any) =>
    new Intl.NumberFormat('bg-BG', { style: 'currency', currency: (payment.currency || 'EUR').toUpperCase() }).format(parseFloat(payment.amount));

  return (
    <Table
      aria-label="История на плащанията"
      className="rounded-2xl border border-border/60 bg-card/80 shadow-sm"
    >
      <TableHeader>
        <TableRow>
          <TableHead isRowHeader className="w-[200px]">Дата</TableHead>
          <TableHead>Сума</TableHead>
          <TableHead className="text-right">Статус</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {payments.map((payment) => (
          <TableRow key={payment.id}>
            <TableCell className="tabular-nums text-muted-foreground whitespace-nowrap text-sm">
              {formatDate(payment.createdAt)}
            </TableCell>
            <TableCell className="font-semibold tabular-nums text-sm">
              {formatMoney(payment)}
            </TableCell>
            <TableCell className="text-right">
              <PaymentStatusBadge status={payment.status} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function PaymentStatusBadge({ status }: { status: string }) {
  const statusTranslations: Record<string, string> = {
    'PAID': 'Платено',
    'FAILED': 'Неуспешно',
    'PENDING': 'В изчакване',
    'REFUNDED': 'Възстановено',
    'VOID': 'Анулирано'
  };

  let variant: 'default' | 'destructive' | 'outline-solid' | 'secondary' | null = null;
  
  switch (status) {
    case 'PAID':
      variant = 'default';
      break;
    case 'FAILED':
      variant = 'destructive';
      break;
    case 'PENDING':
      variant = 'secondary';
      break;
    case 'REFUNDED':
      variant = 'outline-solid';
      break;
    case 'VOID':
      variant = 'outline-solid';
      break;
    default:
      variant = 'outline-solid';
  }
  
  return (
    <Badge variant={variant ?? undefined}>
      {statusTranslations[status] || status.charAt(0) + status.slice(1).toLowerCase()}
    </Badge>
  );
}

function SubscriptionHistorySkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Skeleton className="h-9 w-20" />
      </div>
      <Skeleton className="h-10 w-full max-w-[280px]" />
      <div className="space-y-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
      <Skeleton className="h-4 w-48" />
    </div>
  );
} 
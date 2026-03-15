"use client";

import { useState, useRef, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { CreditCard, ReceiptText, Info, ChevronDown, Loader2 } from 'lucide-react';
import { useSubscriptionHistory } from '@/hooks/useSubscriptionHistory';

interface SubscriptionHistoryProps {
  /** When set, refetch history (e.g. after returning from Stripe so payments appear) */
  refreshTrigger?: number;
}

export function SubscriptionHistory({ refreshTrigger }: SubscriptionHistoryProps = {}) {
  const [activeTab, setActiveTab] = useState('payments');
  const [pageSize, setPageSize] = useState(10);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  
  const { 
    subscription, 
    payments, 
    statusHistory: history, 
    pagination, 
    isLoading, 
    loadingMore, 
    error, 
    loadMore, 
    refresh,
    changePageSize 
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

  const hasPayments = payments.length > 0;
  const hasStatusHistory = history.length > 0;

  if (!hasPayments && !hasStatusHistory) {
    return (
      <p className="text-sm text-muted-foreground py-4">
        Все още няма записани плащания или промени в статуса. Плащанията се записват автоматично след успешен разплащане; ако току-що сте платили, обновете страницата след няколко секунди.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <label htmlFor="history-page-size" className="shrink-0 text-sm text-muted-foreground whitespace-nowrap">
            Показани на страница:
          </label>
          <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
            <SelectTrigger id="history-page-size" className="w-20 h-9 text-center font-medium tabular-nums">
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
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <TabsList className="inline-flex min-w-max gap-1 rounded-xl border border-border/60 bg-muted/30 p-1">
            <TabsTrigger value="payments" className="flex min-h-9 items-center gap-2 whitespace-nowrap rounded-lg px-3 text-sm">
              <CreditCard className="h-4 w-4" />
              <span>Плащания</span>
              {hasPayments && <Badge variant="secondary" className="ml-1 text-xs">{payments.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="status" className="flex min-h-9 items-center gap-2 whitespace-nowrap rounded-lg px-3 text-sm">
              <ReceiptText className="h-4 w-4" />
              <span>История на статуса</span>
              {hasStatusHistory && <Badge variant="secondary" className="ml-1 text-xs">{history.length}</Badge>}
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="payments" className="mt-4 focus-visible:outline-none">
          {hasPayments ? (
            <PaymentsTable payments={payments} />
          ) : (
            <p className="text-sm text-muted-foreground py-6 text-center">
              Все още няма записани плащания. Те се записват автоматично след успешен разплащане; ако току-що сте платили, обновете страницата след няколко секунди.
            </p>
          )}
        </TabsContent>

        <TabsContent value="status" className="mt-4 focus-visible:outline-none">
          {hasStatusHistory ? (
            <StatusHistoryTable history={history} />
          ) : (
            <p className="text-sm text-muted-foreground py-6 text-center">
              Няма промени в статуса.
            </p>
          )}
        </TabsContent>
      </Tabs>

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

      <div className="flex flex-col gap-1 pt-2 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <span className="tabular-nums">
          Показани {activeTab === "payments" ? payments.length : history.length} от {pagination.totalItems} записа
        </span>
        <span className="tabular-nums">
          Страница {pagination.page} от {Math.max(pagination.totalPages, 1)}
        </span>
      </div>
    </div>
  );
}

function PaymentsTable({ payments }: { payments: any[] }) {
  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('bg-BG', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  const formatMoney = (payment: any) =>
    new Intl.NumberFormat('bg-BG', { style: 'currency', currency: payment.currency || 'EUR' }).format(parseFloat(payment.amount));

  return (
    <>
      <div className="hidden sm:block overflow-x-auto -mx-1">
        <Table>
          <TableHeader>
            <TableRow className="border-border/60 hover:bg-transparent">
              <TableHead className="w-[160px] font-medium">Дата</TableHead>
              <TableHead className="font-medium">Сума</TableHead>
              <TableHead className="text-right w-[100px] font-medium">Статус</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.map((payment) => (
              <TableRow key={payment.id} className="border-border/50">
                <TableCell className="text-muted-foreground tabular-nums whitespace-nowrap">{formatDate(payment.createdAt)}</TableCell>
                <TableCell className="font-medium tabular-nums">{formatMoney(payment)}</TableCell>
                <TableCell className="text-right">
                  <PaymentStatusBadge status={payment.status} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="sm:hidden space-y-3">
        {payments.map((payment) => (
          <div key={payment.id} className="rounded-lg border border-border/60 bg-card p-3 shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-semibold tabular-nums">{formatMoney(payment)}</p>
              <PaymentStatusBadge status={payment.status} />
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground tabular-nums">{formatDate(payment.createdAt)}</p>
          </div>
        ))}
      </div>
    </>
  );
}

const STATUS_EVENT_TRANSLATIONS: Record<string, string> = {
  'Stripe subscription created': 'Абонаментът е създаден',
  'Stripe subscription updated': 'Абонаментът е обновен',
  'Stripe subscription deleted': 'Абонаментът е прекратен',
  'SUBSCRIPTION_CREATED': 'Създаден абонамент',
  'SUBSCRIPTION_UPDATED': 'Обновен абонамент',
  'SUBSCRIPTION_CANCELED': 'Отменен абонамент',
  'SUBSCRIPTION_RENEWED': 'Подновен абонамент',
  'PAYMENT_FAILED': 'Неуспешно плащане',
  'PAYMENT_SUCCEEDED': 'Успешно плащане',
  'New subscription created with plan': 'Създаден нов абонамент',
  'Subscription updated to plan': 'Планът е обновен',
  'Subscription status changed to': 'Промяна на статус',
  'Subscription updated': 'Абонаментът е обновен',
  'Subscription canceled': 'Абонаментът е отменен',
  'Subscription payment succeeded': 'Плащането е успешно',
  'Платежът по абонамента е успешен': 'Плащането е успешно',
  'Платежът по абонамента е неуспешен': 'Неуспешно плащане',
  'Payment failed for subscription': 'Неуспешно плащане за абонамента',
};

function getStatusEventLabel(event: string): string {
  const exact = STATUS_EVENT_TRANSLATIONS[event];
  if (exact) return exact;
  for (const [key, value] of Object.entries(STATUS_EVENT_TRANSLATIONS)) {
    if (event.includes(key)) return value;
  }
  return event;
}

function StatusHistoryTable({ history }: { history: any[] }) {
  return (
    <>
      <div className="hidden sm:block overflow-x-auto -mx-1">
        <Table>
          <TableHeader>
            <TableRow className="border-border/60 hover:bg-transparent">
              <TableHead className="w-[140px] font-medium">Дата</TableHead>
              <TableHead className="font-medium">Събитие</TableHead>
              <TableHead className="text-right w-[100px] font-medium">Статус</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {history.map((item) => (
              <TableRow key={item.id} className="border-border/50">
                <TableCell className="text-muted-foreground tabular-nums whitespace-nowrap">
                  {new Date(item.createdAt).toLocaleDateString('bg-BG', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </TableCell>
                <TableCell className="font-medium">
                  {getStatusEventLabel(item.event)}
                </TableCell>
                <TableCell className="text-right">
                  <SubscriptionStatusBadge status={item.status} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="sm:hidden space-y-3">
        {history.map((item) => (
          <div
            key={item.id}
            className="rounded-lg border border-border/60 bg-card p-3 shadow-sm"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-medium leading-tight">
                {getStatusEventLabel(item.event)}
              </p>
              <SubscriptionStatusBadge status={item.status} />
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground tabular-nums">
              {new Date(item.createdAt).toLocaleDateString('bg-BG', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
        ))}
      </div>
    </>
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

function SubscriptionStatusBadge({ status }: { status: string }) {
  const statusTranslations: Record<string, string> = {
    'ACTIVE': 'Активен',
    'CANCELED': 'Отменен',
    'PAST_DUE': 'Просрочен',
    'UNPAID': 'Неплатен',
    'TRIALING': 'Пробен период',
    'INCOMPLETE': 'Незавършен',
    'INCOMPLETE_EXPIRED': 'Изтекъл незавършен',
    'PAUSED': 'Паузиран'
  };

  let variant: 'default' | 'destructive' | 'outline-solid' | 'secondary' | null = null;
  
  switch (status) {
    case 'ACTIVE':
      variant = 'default';
      break;
    case 'CANCELED':
      variant = 'destructive';
      break;
    case 'PAST_DUE':
      variant = 'outline-solid';
      break;
    case 'UNPAID':
      variant = 'destructive';
      break;
    case 'TRIALING':
      variant = 'secondary';
      break;
    case 'INCOMPLETE':
    case 'INCOMPLETE_EXPIRED':
      variant = 'outline-solid';
      break;
    case 'PAUSED':
      variant = 'secondary';
      break;
    default:
      variant = 'outline-solid';
  }
  
  return (
    <Badge variant={variant ?? undefined} className="shrink-0">
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
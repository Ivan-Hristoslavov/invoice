"use client";

import { useState, useRef, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
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
import { SUBSCRIPTION_PLANS, type SubscriptionPlanKey } from '@/lib/subscription-plans';

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
      <Card>
        <CardHeader>
          <CardTitle>История на абонамента</CardTitle>
          <CardDescription>
            Възникна грешка при зареждането на данните
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 text-destructive">
            <Info className="h-4 w-4" />
            <span>{error}</span>
          </div>
          <Button onClick={refresh} className="mt-4" variant="outline">
            Опитайте отново
          </Button>
        </CardContent>
      </Card>
    );
  }
  
  if (!subscription) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>История на абонамента</CardTitle>
          <CardDescription>
            Нямате активен абонамент.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }
  
  const hasPayments = payments.length > 0;
  const hasStatusHistory = history.length > 0;
  
  if (!hasPayments && !hasStatusHistory) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>История на абонамента</CardTitle>
          <CardDescription>
            Все още няма история на абонамента.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>История на абонамента</CardTitle>
            <CardDescription>
              Преглед на историята на плащанията и промените в статуса
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-sm text-muted-foreground">Резултати:</span>
            <Select
              value={pageSize.toString()}
              onValueChange={handlePageSizeChange}
            >
              <SelectTrigger className="w-20">
                <SelectValue placeholder="10" />
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
        
        {subscription && (
          <div className="mt-2 p-3 bg-secondary/20 rounded-md">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">План:</span>
                <Badge className="ml-2">
                  {subscription.plan && subscription.plan in SUBSCRIPTION_PLANS
                    ? SUBSCRIPTION_PLANS[subscription.plan as SubscriptionPlanKey].displayName
                    : subscription.plan}
                </Badge>
              </div>
              <div>
                <span className="text-muted-foreground">Статус:</span>
                <SubscriptionStatusBadge status={subscription.status} />
              </div>
              <div>
                <span className="text-muted-foreground">Активен до:</span>
                <span className="ml-2">
                  {new Date(subscription.currentPeriodEnd).toLocaleDateString('bg-BG')}
                </span>
              </div>
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <TabsList className="flex min-w-max gap-1 rounded-xl border border-border/60 bg-card/70 p-1">
            <TabsTrigger value="payments" className="flex min-h-10 items-center gap-2 whitespace-nowrap rounded-lg px-3">
              <CreditCard className="h-4 w-4" />
              <span>Плащания</span>
              {hasPayments && (
                <Badge variant="secondary" className="ml-1">{payments.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="status" className="flex min-h-10 items-center gap-2 whitespace-nowrap rounded-lg px-3">
              <ReceiptText className="h-4 w-4" />
              <span>Промени в статуса</span>
              {hasStatusHistory && (
                <Badge variant="secondary" className="ml-1">{history.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>
          </div>
          
          <TabsContent value="payments" className="mt-4">
            {hasPayments ? (
              <PaymentsTable payments={payments} />
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                Все още няма история на плащанията
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="status" className="mt-4">
            {hasStatusHistory ? (
              <StatusHistoryTable history={history} />
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                Все още няма промени в статуса
              </div>
            )}
          </TabsContent>
        </Tabs>
        
        {/* Lazy loading observer element */}
        {pagination.hasMore && (
          <div 
            ref={loadMoreRef} 
            className="py-4 flex justify-center"
          >
            {loadingMore ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> 
                <span>Зареждане...</span>
              </div>
            ) : (
              <Button 
                variant="ghost" 
                size="sm" 
                className="flex items-center gap-1"
                onClick={loadMore}
              >
                <ChevronDown className="h-4 w-4" />
                <span>Зареди още</span>
              </Button>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex flex-col gap-2 pt-0 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <div>
          Показани {activeTab === 'payments' ? payments.length : history.length} от{' '}
          {activeTab === 'payments' ? 
            pagination.totalItems : 
            pagination.totalItems} записа
        </div>
        <div>
          Страница {pagination.page} от {pagination.totalPages || 1}
        </div>
      </CardFooter>
    </Card>
  );
}

function PaymentsTable({ payments }: { payments: any[] }) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Дата</TableHead>
            <TableHead>Сума</TableHead>
            <TableHead className="text-right">Статус</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payments.map((payment) => (
            <TableRow key={payment.id}>
              <TableCell>
                {new Date(payment.createdAt).toLocaleDateString('bg-BG', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })}
              </TableCell>
              <TableCell>
                {new Intl.NumberFormat('bg-BG', {
                  style: 'currency',
                  currency: payment.currency || 'EUR',
                }).format(parseFloat(payment.amount))}
              </TableCell>
              <TableCell className="text-right">
                <PaymentStatusBadge status={payment.status} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function StatusHistoryTable({ history }: { history: any[] }) {
  const eventTranslations: Record<string, string> = {
    'SUBSCRIPTION_CREATED': 'Създаден абонамент',
    'SUBSCRIPTION_UPDATED': 'Обновен абонамент',
    'SUBSCRIPTION_CANCELED': 'Отменен абонамент',
    'SUBSCRIPTION_RENEWED': 'Подновен абонамент',
    'PAYMENT_FAILED': 'Неуспешно плащане',
    'PAYMENT_SUCCEEDED': 'Успешно плащане',
    'New subscription created with plan': 'Създаден нов абонамент с план',
    'Subscription updated to plan': 'Абонаментът е обновен до план',
    'Subscription status changed to': 'Статусът на абонамента е променен на',
    'Subscription updated': 'Абонаментът е обновен',
    'Subscription canceled': 'Абонаментът е отменен',
    'Subscription payment succeeded': 'Плащането за абонамента е успешно',
    'Payment failed for subscription': 'Неуспешно плащане за абонамента'
  };
  
  // Process the event text to match with translations or display original
  const getEventText = (event: string) => {
    // Check for direct match in translations
    if (eventTranslations[event]) {
      return eventTranslations[event];
    }
    
    // Check for partial matches
    for (const [key, value] of Object.entries(eventTranslations)) {
      if (event.includes(key)) {
        // Get the part after the known key phrase
        const extraInfo = event.replace(key, '').trim();
        if (extraInfo) {
          return `${value} ${extraInfo}`;
        }
        return value;
      }
    }
    
    // Return original if no match
    return event;
  };

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Дата</TableHead>
            <TableHead>Събитие</TableHead>
            <TableHead className="text-right">Статус</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {history.map((item) => (
            <TableRow key={item.id}>
              <TableCell>
                {new Date(item.createdAt).toLocaleDateString('bg-BG', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })}
              </TableCell>
              <TableCell>
                {getEventText(item.event)}
              </TableCell>
              <TableCell className="text-right">
                <SubscriptionStatusBadge status={item.status} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
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
    <Badge variant={variant ?? undefined} className="ml-2">
      {statusTranslations[status] || status.charAt(0) + status.slice(1).toLowerCase()}
    </Badge>
  );
}

function SubscriptionHistorySkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-[200px] mb-2" />
        <Skeleton className="h-4 w-[300px]" />
        <div className="mt-2">
          <Skeleton className="h-20 w-full" />
        </div>
      </CardHeader>
      <CardContent>
        <Skeleton className="h-10 w-full mb-6" />
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </CardContent>
      <CardFooter>
        <Skeleton className="h-4 w-full" />
      </CardFooter>
    </Card>
  );
} 
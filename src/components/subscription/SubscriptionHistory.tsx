"use client";

import { useState } from 'react';
import { useSubscription } from '@/hooks/useSubscription';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { CreditCard, ReceiptText } from 'lucide-react';

interface PaymentItem {
  id: string;
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
}

interface StatusHistoryItem {
  id: string;
  status: string;
  event: string;
  createdAt: string;
}

export function SubscriptionHistory() {
  const { subscription, isLoading } = useSubscription();
  const [activeTab, setActiveTab] = useState('payments');
  
  if (isLoading) {
    return <SubscriptionHistorySkeleton />;
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
  
  const hasPayments = subscription.paymentHistory && subscription.paymentHistory.length > 0;
  const hasStatusHistory = subscription.statusHistory && subscription.statusHistory.length > 0;
  
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
        <CardTitle>История на абонамента</CardTitle>
        <CardDescription>
          Преглед на историята на плащанията и промените в статуса
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="payments" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              <span>Плащания</span>
            </TabsTrigger>
            <TabsTrigger value="status" className="flex items-center gap-2">
              <ReceiptText className="h-4 w-4" />
              <span>Промени в статуса</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="payments" className="mt-4">
            {hasPayments ? (
              <PaymentsTable payments={subscription.paymentHistory} />
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                Все още няма история на плащанията
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="status" className="mt-4">
            {hasStatusHistory ? (
              <StatusHistoryTable history={subscription.statusHistory} />
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                Все още няма промени в статуса
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function PaymentsTable({ payments }: { payments: PaymentItem[] }) {
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
                  currency: payment.currency || 'BGN',
                }).format(payment.amount)}
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

function StatusHistoryTable({ history }: { history: StatusHistoryItem[] }) {
  const eventTranslations: Record<string, string> = {
    'SUBSCRIPTION_CREATED': 'Създаден абонамент',
    'SUBSCRIPTION_UPDATED': 'Обновен абонамент',
    'SUBSCRIPTION_CANCELED': 'Отменен абонамент',
    'SUBSCRIPTION_RENEWED': 'Подновен абонамент',
    'PAYMENT_FAILED': 'Неуспешно плащане',
    'PAYMENT_SUCCEEDED': 'Успешно плащане'
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
                {eventTranslations[item.event] || item.event}
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
    'PENDING': 'В изчакване'
  };

  let variant: 'default' | 'destructive' | 'outline' | 'secondary' | null = null;
  
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
    default:
      variant = 'outline';
  }
  
  return (
    <Badge variant={variant}>
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
    'TRIALING': 'Пробен период'
  };

  let variant: 'default' | 'destructive' | 'outline' | 'secondary' | null = null;
  
  switch (status) {
    case 'ACTIVE':
      variant = 'default';
      break;
    case 'CANCELED':
      variant = 'destructive';
      break;
    case 'PAST_DUE':
      variant = 'outline';
      break;
    case 'UNPAID':
      variant = 'destructive';
      break;
    case 'TRIALING':
      variant = 'secondary';
      break;
    default:
      variant = 'outline';
  }
  
  return (
    <Badge variant={variant}>
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
      </CardHeader>
      <CardContent>
        <Skeleton className="h-10 w-full mb-6" />
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </CardContent>
    </Card>
  );
} 
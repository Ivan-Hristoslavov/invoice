"use client";

import { Suspense, useState, useEffect, useRef } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { SubscriptionPlans } from '@/components/subscription/SubscriptionPlans';
import { SubscriptionHistory } from '@/components/subscription/SubscriptionHistory';
import { useSearchParams } from 'next/navigation';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle2, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

function SubscriptionPageInner() {
  const searchParams = useSearchParams();
  const success = searchParams.get('success');
  const canceled = searchParams.get('canceled');
  const [historyRefreshTrigger, setHistoryRefreshTrigger] = useState<number | null>(null);
  const [postPaymentLoading, setPostPaymentLoading] = useState(false);

  useEffect(() => {
    if (success === 'true') setPostPaymentLoading(true);
  }, [success]);

  const didTriggerHistoryRefresh = useRef(false);
  useEffect(() => {
    if (success !== 'true') return;
    if (didTriggerHistoryRefresh.current) return;
    didTriggerHistoryRefresh.current = true;
    setHistoryRefreshTrigger(Date.now());
    const t = window.setTimeout(() => setHistoryRefreshTrigger(Date.now()), 4000);
    return () => clearTimeout(t);
  }, [success]);

  const handleSuccessRefetchDone = () => setPostPaymentLoading(false);

  return (
    <div className="app-page-shell">
      <div className="app-page-header">
        <div>
          <h1 className="page-title">Абонамент</h1>
          <p className="card-description mt-1">
            Изберете план и вижте какво ви предлага — лимити, функции и история на плащанията.
          </p>
        </div>
      </div>

      <div className="relative">
        {postPaymentLoading && (
          <div className="absolute inset-0 z-10 flex flex-col gap-4 rounded-lg bg-background/95 backdrop-blur-sm pt-1" aria-live="polite" aria-busy="true">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              Обновяване след плащане...
            </div>
            <SubscriptionPageSkeleton />
          </div>
        )}

        {success && !postPaymentLoading && (
          <Alert variant="success" className="py-2">
            <CheckCircle2 className="h-4 w-4" />
            <AlertTitle className="text-sm">Успех!</AlertTitle>
            <AlertDescription className="text-xs">
              Готово! Вашият план е активен. Можете да ползвате всички включени функции.
            </AlertDescription>
          </Alert>
        )}

        {canceled && !postPaymentLoading && (
          <Alert variant="destructive" className="py-2">
            <XCircle className="h-4 w-4" />
            <AlertTitle className="text-sm">Отказано</AlertTitle>
            <AlertDescription className="text-xs">
              Плащането беше отменено. Можете да опитате отново когато искате.
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardContent>
            <Suspense fallback={<SubscriptionSkeleton />}>
              <SubscriptionPlans onSuccessRefetchDone={handleSuccessRefetchDone} />
            </Suspense>
          </CardContent>
        </Card>

        <section className="pt-4" aria-label="История на плащанията">
          <p className="text-sm text-muted-foreground mb-3">
            Историята на плащанията и промените в статуса се показват тук след активиране на платен план. Записват се автоматично след всяко плащане чрез Stripe. Ако току-що сте платили, изчакайте няколко секунди и обновете страницата.
          </p>
          <Suspense fallback={<SubscriptionSkeleton />}>
            <SubscriptionHistory refreshTrigger={historyRefreshTrigger ?? undefined} />
          </Suspense>
        </section>
      </div>
    </div>
  );
}

function SubscriptionSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-8 w-full" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    </div>
  );
}

export function SubscriptionPageSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-48" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Skeleton className="h-52 w-full rounded-xl" />
        <Skeleton className="h-52 w-full rounded-xl" />
        <Skeleton className="h-52 w-full rounded-xl" />
        <Skeleton className="h-52 w-full rounded-xl" />
      </div>
      <Skeleton className="h-24 w-full rounded-lg" />
    </div>
  );
}

export default function SubscriptionPageClient() {
  return (
    <Suspense fallback={<SubscriptionPageSkeleton />}>
      <SubscriptionPageInner />
    </Suspense>
  );
}

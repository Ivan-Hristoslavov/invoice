"use client";

import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { SubscriptionPlans } from '@/components/subscription/SubscriptionPlans';
import { SubscriptionHistory } from '@/components/subscription/SubscriptionHistory';
import { useSearchParams } from 'next/navigation';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle2, XCircle, History, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function SubscriptionPage() {
  const searchParams = useSearchParams();
  const success = searchParams.get('success');
  const canceled = searchParams.get('canceled');
  
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

      {/* Success/Cancel Alerts - Compact */}
      {success && (
        <Alert variant="default" className="py-2 bg-green-50 dark:bg-green-950/20 text-green-800 dark:text-green-200 border-green-200 dark:border-green-800">
          <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertTitle className="text-sm">Успех!</AlertTitle>
          <AlertDescription className="text-xs">
            Готово! Вашият план е активен. Можете да ползвате всички включени функции.
          </AlertDescription>
        </Alert>
      )}
      
      {canceled && (
        <Alert variant="destructive" className="py-2">
          <XCircle className="h-4 w-4" />
          <AlertTitle className="text-sm">Отказано</AlertTitle>
          <AlertDescription className="text-xs">
            Плащането беше отменено. Можете да опитате отново когато искате.
          </AlertDescription>
        </Alert>
      )}
      
      {/* Subscription Plans - Main content */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Планове и лимити</CardTitle>
          <CardDescription>Сравнете плановете и надградете, когато искате повече фактури, фирми или изпращане по имейл.</CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<SubscriptionSkeleton />}>
            <SubscriptionPlans />
          </Suspense>
        </CardContent>
      </Card>

      {/* Payment History - Collapsible or minimal */}
      <Card>
        <CardContent className="pt-4 sm:pt-5 md:pt-6">
          <details className="group">
            <summary className="flex cursor-pointer items-center gap-2 py-1 text-sm text-muted-foreground transition-colors hover:text-foreground">
              <History className="h-4 w-4" />
              <span>История на плащанията</span>
              <ChevronRight className="h-4 w-4 transition-transform group-open:rotate-90" />
            </summary>
            <div className="pt-4">
              <Suspense fallback={<SubscriptionSkeleton />}>
                <SubscriptionHistory />
              </Suspense>
            </div>
          </details>
        </CardContent>
      </Card>
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
  )
} 
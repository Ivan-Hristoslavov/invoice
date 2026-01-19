"use client";

import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { SubscriptionPlans } from '@/components/subscription/SubscriptionPlans';
import { SubscriptionHistory } from '@/components/subscription/SubscriptionHistory';
import { useSearchParams } from 'next/navigation';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle2, XCircle, History, ChevronRight } from 'lucide-react';

export default function SubscriptionPage() {
  const searchParams = useSearchParams();
  const success = searchParams.get('success');
  const canceled = searchParams.get('canceled');
  
  return (
    <div className="space-y-4">
      {/* Success/Cancel Alerts - Compact */}
      {success && (
        <Alert variant="default" className="py-2 bg-green-50 dark:bg-green-950/20 text-green-800 dark:text-green-200 border-green-200 dark:border-green-800">
          <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertTitle className="text-sm">Успех!</AlertTitle>
          <AlertDescription className="text-xs">
            Абонаментът беше успешно обновен.
          </AlertDescription>
        </Alert>
      )}
      
      {canceled && (
        <Alert variant="destructive" className="py-2">
          <XCircle className="h-4 w-4" />
          <AlertTitle className="text-sm">Отказано</AlertTitle>
          <AlertDescription className="text-xs">
            Плащането беше отказано.
          </AlertDescription>
        </Alert>
      )}
      
      {/* Subscription Plans - Main content */}
      <Suspense fallback={<SubscriptionSkeleton />}>
        <SubscriptionPlans />
      </Suspense>

      {/* Payment History - Collapsible or minimal */}
      <details className="group">
        <summary className="flex items-center gap-2 cursor-pointer text-sm text-muted-foreground hover:text-foreground transition-colors py-2">
          <History className="h-4 w-4" />
          <span>История на плащанията</span>
          <ChevronRight className="h-4 w-4 transition-transform group-open:rotate-90" />
        </summary>
        <div className="pt-2">
          <Suspense fallback={<SubscriptionSkeleton />}>
            <SubscriptionHistory />
          </Suspense>
        </div>
      </details>
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
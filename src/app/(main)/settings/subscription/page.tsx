"use client";

import { Suspense } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { SubscriptionPlans } from '@/components/subscription/SubscriptionPlans';
import { SubscriptionHistory } from '@/components/subscription/SubscriptionHistory';
import { useSearchParams } from 'next/navigation';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle2, XCircle, CreditCard, History } from 'lucide-react';

export default function SubscriptionPage() {
  const searchParams = useSearchParams();
  const success = searchParams.get('success');
  const canceled = searchParams.get('canceled');
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="page-title">Абонамент</h1>
        <p className="card-description mt-1.5">
          Управлявайте вашия абонамент и вижте история на плащанията
        </p>
      </div>
      
      {/* Success/Cancel Alerts */}
      {success && (
        <Alert variant="default" className="bg-green-50 dark:bg-green-950/20 text-green-800 dark:text-green-200 border-green-200 dark:border-green-800">
          <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertTitle>Успех!</AlertTitle>
          <AlertDescription>
            Вашият абонамент беше успешно обновен. Благодарим ви!
          </AlertDescription>
        </Alert>
      )}
      
      {canceled && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertTitle>Отказано плащане</AlertTitle>
          <AlertDescription>
            Плащането беше отказано. Може да опитате отново, когато сте готови.
          </AlertDescription>
        </Alert>
      )}
      
      {/* Subscription Sections - Combined with Settings navigation */}
      <div className="grid gap-6">
        <Card className="border border-border/60 shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <CreditCard className="h-4 w-4 text-primary" />
              </div>
              <div>
                <CardTitle className="card-title">Планове и фактуриране</CardTitle>
                <CardDescription className="card-description">
                  Изберете план, управлявайте подновяване и отмяна
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<SubscriptionSkeleton />}>
              <SubscriptionPlans />
            </Suspense>
          </CardContent>
        </Card>

        <Card className="border border-border/60 shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-lg bg-secondary flex items-center justify-center">
                <History className="h-4 w-4 text-foreground" />
              </div>
              <div>
                <CardTitle className="card-title">История на плащанията</CardTitle>
                <CardDescription className="card-description">
                  Преглед на всички транзакции и периоди
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<SubscriptionSkeleton />}>
              <SubscriptionHistory />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function SubscriptionSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-[250px] mb-3" />
        <Skeleton className="h-4 w-[300px]" />
      </CardHeader>
      <CardContent className="space-y-6">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </CardContent>
    </Card>
  )
} 
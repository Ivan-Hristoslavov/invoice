"use client";

import { Suspense } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { SubscriptionPlans } from '@/components/subscription/SubscriptionPlans';
import { SubscriptionHistory } from '@/components/subscription/SubscriptionHistory';
import { useSearchParams } from 'next/navigation';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle2, XCircle } from 'lucide-react';

export default function SubscriptionPage() {
  const searchParams = useSearchParams();
  const success = searchParams.get('success') === 'true';
  const canceled = searchParams.get('canceled') === 'true';
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Subscription</h2>
        <p className="text-muted-foreground">
          Manage your subscription and billing information
        </p>
      </div>
      
      {success && (
        <Alert variant="default" className="bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-900">
          <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertTitle>Subscription Updated</AlertTitle>
          <AlertDescription>
            Your subscription has been updated successfully.
          </AlertDescription>
        </Alert>
      )}
      
      {canceled && (
        <Alert variant="default" className="bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-900">
          <XCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <AlertTitle>Checkout Canceled</AlertTitle>
          <AlertDescription>
            Your checkout session was canceled. You can try again when you're ready.
          </AlertDescription>
        </Alert>
      )}
      
      <Tabs defaultValue="plans">
        <TabsList>
          <TabsTrigger value="plans">Plans</TabsTrigger>
          <TabsTrigger value="history">Payment History</TabsTrigger>
        </TabsList>
        <TabsContent value="plans" className="space-y-6">
          <Suspense fallback={<PlansLoadingSkeleton />}>
            <SubscriptionPlans />
          </Suspense>
        </TabsContent>
        <TabsContent value="history">
          <Suspense fallback={<HistoryLoadingSkeleton />}>
            <SubscriptionHistory />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function PlansLoadingSkeleton() {
  return (
    <div className="grid gap-6 sm:grid-cols-3">
      {[1, 2, 3].map((i) => (
        <Card key={i} className="flex flex-col">
          <CardHeader>
            <Skeleton className="h-6 w-24 mb-2" />
            <Skeleton className="h-4 w-full" />
            <div className="mt-4">
              <Skeleton className="h-8 w-20" />
            </div>
          </CardHeader>
          <CardContent className="flex-1">
            <div className="space-y-2">
              {[1, 2, 3, 4].map((j) => (
                <Skeleton key={j} className="h-4 w-full" />
              ))}
            </div>
          </CardContent>
          <div className="p-6 pt-0">
            <Skeleton className="h-10 w-full" />
          </div>
        </Card>
      ))}
    </div>
  );
}

function HistoryLoadingSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-40 mb-2" />
        <Skeleton className="h-4 w-60" />
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </CardContent>
    </Card>
  );
} 
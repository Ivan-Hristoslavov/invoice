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
import { WebhookEventHistory } from '@/components/subscription/WebhookEventHistory';
import { useSearchParams } from 'next/navigation';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle2, XCircle } from 'lucide-react';

export default function SubscriptionPage() {
  const searchParams = useSearchParams();
  const success = searchParams.get('success');
  const canceled = searchParams.get('canceled');
  
  return (
    <div className="container mx-auto px-4 py-6 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Абонамент</h1>
      </div>
      <p className="text-muted-foreground">
        Управлявайте вашия абонамент и вижте история на плащанията.
      </p>
      
      {success && (
        <Alert variant="default" className="bg-green-50 text-green-800 border-green-200">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertTitle>Успех!</AlertTitle>
          <AlertDescription>
            Вашият абонамент беше успешно обновен. Благодарим ви!
          </AlertDescription>
        </Alert>
      )}
      
      {canceled && (
        <Alert variant="destructive" className="bg-red-50 text-red-800 border-red-200">
          <XCircle className="h-4 w-4 text-red-600" />
          <AlertTitle>Отказано плащане</AlertTitle>
          <AlertDescription>
            Плащането беше отказано. Може да опитате отново, когато сте готови.
          </AlertDescription>
        </Alert>
      )}
      
      <Tabs defaultValue="plans" className="space-y-4">
        <TabsList>
          <TabsTrigger value="plans">Планове</TabsTrigger>
          <TabsTrigger value="history">История</TabsTrigger>
          <TabsTrigger value="events">Webhook събития</TabsTrigger>
        </TabsList>
        
        <TabsContent value="plans" className="space-y-4">
          <Suspense fallback={<SubscriptionSkeleton />}>
            <SubscriptionPlans />
          </Suspense>
        </TabsContent>
        
        <TabsContent value="history" className="space-y-4">
          <Suspense fallback={<SubscriptionSkeleton />}>
            <SubscriptionHistory />
          </Suspense>
        </TabsContent>
        
        <TabsContent value="events" className="space-y-4">
          <Suspense fallback={<SubscriptionSkeleton />}>
            <WebhookEventHistory />
          </Suspense>
        </TabsContent>
      </Tabs>
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
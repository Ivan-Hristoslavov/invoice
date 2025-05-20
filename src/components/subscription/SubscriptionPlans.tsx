"use client";

import { useState, useEffect } from 'react';
import { Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSubscription } from '@/hooks/useSubscription';
import { useSubscriptionPlans, formatPrice } from '@/lib/stripe-client';
import { AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export function SubscriptionPlans() {
  const { subscription, isLoading, error, createCheckoutSession, cancelSubscription } = useSubscription();
  const [cancelingSubscription, setCancelingSubscription] = useState(false);
  const [plans, setPlans] = useState<any>(null);
  const [plansLoading, setPlansLoading] = useState(true);
  const [plansError, setPlansError] = useState<string | null>(null);

  // Fetch subscription plans
  useEffect(() => {
    async function loadPlans() {
      try {
        const plansData = await useSubscriptionPlans();
        setPlans(plansData);
      } catch (error) {
        console.error('Error loading plans:', error);
        setPlansError('Failed to load subscription plans');
      } finally {
        setPlansLoading(false);
      }
    }
    
    loadPlans();
  }, []);

  const handleSubscribe = async (plan: string) => {
    await createCheckoutSession(plan);
  };

  const handleCancelSubscription = async () => {
    setCancelingSubscription(true);
    await cancelSubscription();
    setCancelingSubscription(false);
  };

  const isCurrentPlan = (plan: string) => {
    return subscription?.plan === plan && 
           (subscription?.status === 'ACTIVE' || subscription?.status === 'TRIALING');
  };

  const getSubscriptionEndsText = () => {
    if (!subscription || !subscription.currentPeriodEnd) return '';
    
    const endDate = new Date(subscription.currentPeriodEnd);
    return `Вашият абонамент ще ${subscription.cancelAtPeriodEnd ? 'приключи' : 'се поднови'} на ${endDate.toLocaleDateString('bg-BG')}`;
  };

  // Show loading state while fetching plans
  if (plansLoading) {
    return <div className="text-center py-8">Зареждане на абонаментните планове...</div>;
  }

  // Show error if plans couldn't be loaded
  if (plansError) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Грешка</AlertTitle>
        <AlertDescription>{plansError}</AlertDescription>
      </Alert>
    );
  }

  // Ensure plans are loaded
  if (!plans) {
    return null;
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Грешка</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {subscription && (
        <div className="bg-muted p-4 rounded-lg">
          <h3 className="font-medium">Вашият текущ абонамент</h3>
          <p className="text-sm text-muted-foreground mt-1">
            В момента сте на план {subscription.plan}.
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {getSubscriptionEndsText()}
          </p>
          {subscription.cancelAtPeriodEnd ? (
            <Badge className="mt-2" variant="outline">Анулиране</Badge>
          ) : (
            <Button 
              className="mt-2" 
              variant="outline" 
              size="sm" 
              onClick={handleCancelSubscription}
              disabled={cancelingSubscription}
            >
              {cancelingSubscription ? 'Анулиране...' : 'Анулиране на абонамента'}
            </Button>
          )}
        </div>
      )}

      <div className="grid gap-6 sm:grid-cols-3">
        <PlanCard
          title="Базов"
          price={plans.BASIC.price}
          description="Идеален за фрийлансъри и индивидуални потребители"
          features={plans.BASIC.features}
          current={isCurrentPlan('BASIC')}
          onSubscribe={() => handleSubscribe('BASIC')}
          loading={isLoading}
        />

        <PlanCard
          title="Про"
          price={plans.PRO.price}
          description="Идеален за малки бизнеси"
          features={plans.PRO.features}
          popular={true}
          current={isCurrentPlan('PRO')}
          onSubscribe={() => handleSubscribe('PRO')}
          loading={isLoading}
        />

        <PlanCard
          title="ВИП"
          price={plans.VIP.price}
          description="За предприятия и разрастващи се екипи"
          features={plans.VIP.features}
          current={isCurrentPlan('VIP')}
          onSubscribe={() => handleSubscribe('VIP')}
          loading={isLoading}
        />
      </div>
    </div>
  );
}

interface PlanCardProps {
  title: string;
  price: number;
  description: string;
  features: string[];
  popular?: boolean;
  current?: boolean;
  onSubscribe: () => void;
  loading: boolean;
}

function PlanCard({
  title,
  price,
  description,
  features,
  popular = false,
  current = false,
  onSubscribe,
  loading,
}: PlanCardProps) {
  return (
    <Card className={`relative flex flex-col ${popular ? 'border-primary shadow-lg' : ''}`}>
      {popular && (
        <div className="absolute -top-3 left-0 right-0 flex justify-center">
          <Badge variant="outline" className="bg-primary text-primary-foreground">
            Най-популярен
          </Badge>
        </div>
      )}
      
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
        <div className="mt-4 flex items-baseline">
          <span className="text-3xl font-bold">{formatPrice(price)}</span>
          <span className="text-sm text-muted-foreground ml-1">/месец</span>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1">
        <ul className="space-y-2.5">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start">
              <Check className="w-4 h-4 text-green-500 mr-2 mt-0.5" />
              <span className="text-sm">{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      
      <CardFooter>
        {current ? (
          <Button variant="outline" className="w-full" disabled>
            Текущ план
          </Button>
        ) : (
          <Button 
            className="w-full" 
            onClick={onSubscribe} 
            disabled={loading}
            variant={popular ? "default" : "outline"}
          >
            {loading ? 'Зареждане...' : 'Абониране'}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
} 
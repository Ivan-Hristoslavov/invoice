"use client";

import { useState, useEffect } from 'react';
import { Check, X, Edit, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSubscription } from '@/hooks/useSubscription';
import { useSubscriptionPlans, formatPrice } from '@/lib/stripe-client';
import { AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CancellationSurvey } from './CancellationSurvey';
import { toast } from 'sonner';

export function SubscriptionPlans() {
  const { subscription, isLoading, error, createCheckoutSession, cancelSubscription } = useSubscription();
  const [cancelingSubscription, setCancelingSubscription] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState(false);
  const [plans, setPlans] = useState<any>(null);
  const [plansLoading, setPlansLoading] = useState(true);
  const [plansError, setPlansError] = useState<string | null>(null);
  const [showCancellationSurvey, setShowCancellationSurvey] = useState(false);

  // Debug: Log subscription data
  useEffect(() => {
    console.log('Current subscription data:', subscription);
  }, [subscription]);

  // Fetch subscription plans
  useEffect(() => {
    async function loadPlans() {
      try {
        const plansData = await useSubscriptionPlans();
        setPlans(plansData);
      } catch (error) {
        console.error('Error loading plans:', error);
        setPlansError('Неуспешно зареждане на абонаментните планове');
      } finally {
        setPlansLoading(false);
      }
    }
    
    loadPlans();
  }, []);

  const handleSubscribe = async (plan: string) => {
    await createCheckoutSession(plan);
  };

  const handleEditSubscription = async (plan: string) => {
    setEditingSubscription(true);
    await createCheckoutSession(plan);
    setEditingSubscription(false);
  };

  const handleCancelButtonClick = () => {
    setShowCancellationSurvey(true);
  };

  const handleCancelSubscription = async () => {
    try {
      setCancelingSubscription(true);
      await cancelSubscription();
      toast("Абонаментът ви ще бъде прекратен в края на текущия период.");
    } catch (error) {
      console.error('Error canceling subscription:', error);
      toast("Грешка при отказване. Моля, опитайте отново по-късно.");
    } finally {
      setCancelingSubscription(false);
      setShowCancellationSurvey(false);
    }
  };

  const handleCloseSurvey = () => {
    setShowCancellationSurvey(false);
  };

  const handleSubmitCancellationSurvey = async (reason: string, feedback: string) => {
    if (!subscription) return;
    
    // Изпращаме данните към API-то
    try {
      const response = await fetch('/api/subscription/cancellation-survey', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscriptionId: subscription.id,
          reason,
          feedback,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to submit survey');
      }
      
      // Отказваме абонамента
      await handleCancelSubscription();
    } catch (error) {
      console.error('Error submitting survey:', error);
      // Все пак отказваме абонамента дори при грешка в анкетата
      await handleCancelSubscription();
    }
  };

  const isCurrentPlan = (plan: string) => {
    // Добавяме логване за по-лесно дебъгване
    const isCurrentPlanValue = subscription?.plan === plan && 
                (subscription?.status === 'ACTIVE' || 
                 subscription?.status === 'TRIALING' || 
                 subscription?.status === 'PAST_DUE');
                 
    console.log('Checking plan:', {
      planToCheck: plan,
      currentPlan: subscription?.plan,
      status: subscription?.status,
      isCurrentPlan: isCurrentPlanValue
    });
    
    return isCurrentPlanValue;
  };

  const getSubscriptionEndsText = () => {
    if (!subscription || !subscription.currentPeriodEnd) return '';
    
    try {
      const endDate = new Date(subscription.currentPeriodEnd);
      if (isNaN(endDate.getTime())) {
        return 'Няма информация за дата на подновяване';
      }
      
      return `Вашият абонамент ще ${subscription.cancelAtPeriodEnd ? 'приключи' : 'се поднови'} на ${endDate.toLocaleDateString('bg-BG')}`;
    } catch (error) {
      console.error('Грешка при форматиране на дата:', error);
      return 'Няма информация за дата на подновяване';
    }
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
        <Card className="bg-secondary/10 border-primary/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Вашият текущ абонамент
            </CardTitle>
            <CardDescription>
              <div className="mt-2">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                  <div className="flex items-center">
                    <span className="text-sm font-medium">План:</span>
                    <Badge className="ml-2" variant="secondary">{subscription.plan}</Badge>
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm font-medium">Статус:</span>
                    <Badge className="ml-2" variant={subscription.cancelAtPeriodEnd ? "outline" : "default"}>
                      {subscription.cancelAtPeriodEnd ? 'Анулиран' : 'Активен'}
                    </Badge>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  {getSubscriptionEndsText()}
                </p>
              </div>
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex flex-wrap gap-2">
            {!subscription.cancelAtPeriodEnd ? (
              <>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleCancelButtonClick}
                  disabled={cancelingSubscription}
                >
                  {cancelingSubscription ? 'Анулиране...' : 'Анулиране на абонамента'}
                </Button>
                <Button 
                  size="sm" 
                  className="flex items-center gap-1"
                  disabled={editingSubscription}
                  onClick={() => window.scrollTo({
                    top: document.getElementById('subscription-plans')?.offsetTop,
                    behavior: 'smooth'
                  })}
                >
                  <Edit className="h-3.5 w-3.5 mr-1" />
                  {editingSubscription ? 'Редактиране...' : 'Промяна на плана'}
                </Button>
              </>
            ) : (
              <Badge variant="outline">Абонаментът ще бъде прекратен</Badge>
            )}
          </CardFooter>
        </Card>
      )}

      <div id="subscription-plans" className="grid gap-6 sm:grid-cols-3">
        <PlanCard
          title="Базов"
          price={plans.BASIC.price}
          description="Идеален за фрийлансъри и индивидуални потребители"
          features={[
            'Достъп до основни функции за фактуриране',
            'До 10 клиента',
            'До 50 фактури месечно'
          ]}
          current={isCurrentPlan('BASIC')}
          onSubscribe={() => handleSubscribe('BASIC')}
          onEditSubscription={() => handleEditSubscription('BASIC')}
          loading={isLoading || editingSubscription}
          hasActiveSubscription={!!subscription}
        />

        <PlanCard
          title="Про"
          price={plans.PRO.price}
          description="Идеален за малки бизнеси"
          features={[
            'Всички функции от Базов план',
            'До 50 клиента',
            'Неограничен брой фактури',
            'Персонализиран брандинг'
          ]}
          popular={true}
          current={isCurrentPlan('PRO')}
          onSubscribe={() => handleSubscribe('PRO')}
          onEditSubscription={() => handleEditSubscription('PRO')}
          loading={isLoading || editingSubscription}
          hasActiveSubscription={!!subscription}
        />

        <PlanCard
          title="ВИП"
          price={plans.VIP.price}
          description="За предприятия и разрастващи се екипи"
          features={[
            'Всички функции от Про план',
            'Неограничен брой клиенти',
            'Приоритетна поддръжка',
            'Разширена аналитика'
          ]}
          current={isCurrentPlan('VIP')}
          onSubscribe={() => handleSubscribe('VIP')}
          onEditSubscription={() => handleEditSubscription('VIP')}
          loading={isLoading || editingSubscription}
          hasActiveSubscription={!!subscription}
        />
      </div>

      {showCancellationSurvey && (
        <CancellationSurvey
          isOpen={showCancellationSurvey}
          onClose={handleCloseSurvey}
          onConfirm={handleCancelSubscription}
          onSubmit={handleSubmitCancellationSurvey}
          isLoading={cancelingSubscription}
        />
      )}
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
  onEditSubscription: () => void;
  loading: boolean;
  hasActiveSubscription: boolean;
}

function PlanCard({
  title,
  price,
  description,
  features,
  popular = false,
  current = false,
  onSubscribe,
  onEditSubscription,
  loading,
  hasActiveSubscription,
}: PlanCardProps) {
  return (
    <Card className={`relative flex flex-col ${
      current
        ? 'border-primary shadow-lg ring-2 ring-primary/40 bg-primary/5'
        : popular
          ? 'border-primary/60 shadow-md'
          : ''
    }`}>
      {popular && !current && (
        <div className="absolute -top-3 left-0 right-0 flex justify-center">
          <Badge variant="outline" className="bg-primary text-primary-foreground">
            Най-популярен
          </Badge>
        </div>
      )}
      
      {current && (
        <div className="absolute -top-3 left-0 right-0 flex justify-center">
          <Badge variant="default" className="bg-green-600 border-green-600 text-white font-medium px-3">
            Текущ план
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
              <Check className={`w-4 h-4 mr-2 mt-0.5 ${current ? 'text-green-500' : 'text-green-500'}`} />
              <span className="text-sm">{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      
      <CardFooter>
        {current ? (
          <Button variant="outline" className="w-full border-green-600 text-green-700" disabled>
            Текущ план
          </Button>
        ) : hasActiveSubscription ? (
          <Button 
            className="w-full" 
            onClick={onEditSubscription} 
            disabled={loading}
            variant={popular ? "default" : "outline"}
          >
            {loading ? 'Зареждане...' : 'Смяна на плана'}
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
"use client";

import { useState } from 'react';
import { Check, Edit, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSubscription } from '@/hooks/useSubscription';
import { formatPrice } from '@/lib/stripe-client';
import { AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CancellationSurvey } from './CancellationSurvey';
import { toast } from 'sonner';

// Default fallback plans data
const DEFAULT_PLANS = {
  FREE: { name: 'Free', price: 0, priceMonthly: 0, priceYearly: 0, priceIdMonthly: null, priceIdYearly: null, features: [] },
  PRO: { name: 'Pro', price: 13, priceMonthly: 13, priceYearly: 130, priceIdMonthly: null, priceIdYearly: null, features: [] },
  BUSINESS: { name: 'Business', price: 28, priceMonthly: 28, priceYearly: 280, priceIdMonthly: null, priceIdYearly: null, features: [] },
};

interface Plan {
  name: string;
  price: number;
  priceMonthly: number;
  priceYearly: number;
  priceIdMonthly: string | null;
  priceIdYearly: string | null;
  features: string[];
}

interface PlansData {
  FREE: Plan;
  PRO: Plan;
  BUSINESS: Plan;
}

export function SubscriptionPlans() {
  const { subscription, isLoading, error, createCheckoutSession, cancelSubscription } = useSubscription();
  const [cancelingSubscription, setCancelingSubscription] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState(false);
  const [showCancellationSurvey, setShowCancellationSurvey] = useState(false);

  // Use DEFAULT_PLANS directly - no fetching, no complex logic, no errors
  const safeFreePrice = DEFAULT_PLANS.FREE.price;
  const safeProPrice = DEFAULT_PLANS.PRO.price;
  const safeBusinessPrice = DEFAULT_PLANS.BUSINESS.price;

  const handleSubscribe = async (plan: string) => {
    try {
      await createCheckoutSession(plan);
    } catch (error) {
      console.error('Error creating checkout session:', error);
      toast.error('Грешка при създаване на сесия за плащане');
    }
  };

  const handleEditSubscription = async (plan: string) => {
    try {
      setEditingSubscription(true);
      await createCheckoutSession(plan);
    } catch (error) {
      console.error('Error editing subscription:', error);
      toast.error('Грешка при промяна на абонамента');
    } finally {
      setEditingSubscription(false);
    }
  };

  const handleCancelButtonClick = () => {
    setShowCancellationSurvey(true);
  };

  const handleCancelSubscription = async () => {
    try {
      setCancelingSubscription(true);
      await cancelSubscription();
      toast.success("Абонаментът ви ще бъде прекратен в края на текущия период.");
    } catch (error) {
      console.error('Error canceling subscription:', error);
      toast.error("Грешка при отказване. Моля, опитайте отново по-късно.");
    } finally {
      setCancelingSubscription(false);
      setShowCancellationSurvey(false);
    }
  };

  const handleCloseSurvey = () => {
    setShowCancellationSurvey(false);
  };

  const handleSubmitCancellationSurvey = async (reason: string, feedback: string) => {
    if (!subscription?.id) {
      toast.error('Няма активен абонамент');
      return;
    }
    
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
      
      await handleCancelSubscription();
    } catch (error) {
      console.error('Error submitting survey:', error);
      await handleCancelSubscription();
    }
  };

  const isCurrentPlan = (plan: string): boolean => {
    if (!subscription) return plan === 'FREE';
    
    return subscription.plan === plan && 
           (subscription.status === 'ACTIVE' || 
            subscription.status === 'TRIALING' || 
            subscription.status === 'PAST_DUE');
  };

  const getSubscriptionEndsText = (): string => {
    if (!subscription?.currentPeriodEnd) {
      return '';
    }
    
    try {
      const endDate = new Date(subscription.currentPeriodEnd);
      if (isNaN(endDate.getTime())) {
        return 'Няма информация за дата на подновяване';
      }
      
      const willCancel = subscription.cancelAtPeriodEnd === true;
      return `Вашият абонамент ще ${willCancel ? 'приключи' : 'се поднови'} на ${endDate.toLocaleDateString('bg-BG')}`;
    } catch (error) {
      console.error('Грешка при форматиране на дата:', error);
      return 'Няма информация за дата на подновяване';
    }
  };

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
                    <Badge className="ml-2" variant="secondary">
                      {subscription.plan || 'N/A'}
                    </Badge>
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm font-medium">Статус:</span>
                    <Badge 
                      className="ml-2" 
                      variant={subscription.cancelAtPeriodEnd === true ? "outline" : "default"}
                    >
                      {subscription.cancelAtPeriodEnd === true ? 'Анулиран' : 'Активен'}
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
            {subscription.cancelAtPeriodEnd !== true ? (
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
                  onClick={() => {
                    const element = document.getElementById('subscription-plans');
                    if (element) {
                      window.scrollTo({
                        top: element.offsetTop,
                        behavior: 'smooth'
                      });
                    }
                  }}
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
          title="Free"
          price={safeFreePrice}
          description="Идеален за тестване и малки фирми"
          features={[
            'До 3 фактури на месец',
            '1 фирма',
            'Basic PDF (с воден знак)',
            'Без експорт',
            'Без лого'
          ]}
          current={isCurrentPlan('FREE')}
          onSubscribe={() => handleSubscribe('FREE')}
          onEditSubscription={() => handleEditSubscription('FREE')}
          loading={isLoading || editingSubscription}
          hasActiveSubscription={!!subscription}
          isFree={true}
        />

        <PlanCard
          title="Pro"
          price={safeProPrice}
          description="Идеален за малки бизнеси"
          features={[
            'Неограничени фактури',
            '3 фирми',
            'Собствено лого',
            'Професионален PDF',
            'Кредитни известия',
            'Експорт PDF / CSV',
            'Изпращане по имейл'
          ]}
          popular={true}
          current={isCurrentPlan('PRO')}
          onSubscribe={() => handleSubscribe('PRO')}
          onEditSubscription={() => handleEditSubscription('PRO')}
          loading={isLoading || editingSubscription}
          hasActiveSubscription={!!subscription}
        />

        <PlanCard
          title="Business"
          price={safeBusinessPrice}
          description="За предприятия и разрастващи се екипи"
          features={[
            'Всичко от Pro',
            'Неограничени фирми',
            'Приоритетна поддръжка'
          ]}
          current={isCurrentPlan('BUSINESS')}
          onSubscribe={() => handleSubscribe('BUSINESS')}
          onEditSubscription={() => handleEditSubscription('BUSINESS')}
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
  isFree?: boolean;
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
  isFree = false,
}: PlanCardProps) {
  // Ensure price is a valid number with fallback - simple check
  const safePrice = typeof price === 'number' && !isNaN(price) && isFinite(price) ? price : 0;
  
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
          <span className="text-3xl font-bold">{formatPrice(safePrice)}</span>
          <span className="text-sm text-muted-foreground ml-1">/месец</span>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1">
        <ul className="space-y-2.5">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start">
              <Check className="w-4 h-4 mr-2 mt-0.5 text-green-500" />
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
        ) : isFree ? (
          <Button variant="outline" className="w-full" disabled>
            Безплатен план
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

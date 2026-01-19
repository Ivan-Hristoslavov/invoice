"use client";

import { useState } from 'react';
import { Check, X, Edit, CreditCard, Sparkles, Star, Zap, Crown, FileText, Shield, TrendingUp, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSubscription } from '@/hooks/useSubscription';
import { AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CancellationSurvey } from './CancellationSurvey';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

// Pricing structure - compact features list
const PLANS = {
  FREE: {
    name: 'FREE',
    displayName: 'Безплатен',
    monthlyPrice: 0,
    yearlyPrice: 0,
    description: 'За стартиране',
    icon: FileText,
    features: ['3 фактури/мес', '1 фирма', '5 клиенти', '10 продукти'],
    excluded: ['Лого', 'Експорт', 'Имейл'],
  },
  STARTER: {
    name: 'STARTER',
    displayName: 'Стартер',
    monthlyPrice: 4.99,
    yearlyPrice: 49.99,
    description: 'За фрийлансъри',
    icon: Zap,
    features: ['15 фактури/мес', '1 фирма', '25 клиенти', '50 продукти', 'CSV експорт'],
    excluded: ['Лого', 'Имейл'],
  },
  PRO: {
    name: 'PRO',
    displayName: 'Про',
    monthlyPrice: 8.99,
    yearlyPrice: 89.99,
    description: 'За малки бизнеси',
    icon: Star,
    popular: true,
    features: ['∞ фактури', '3 фирми', '100 клиенти', '200 продукти', 'Лого', 'PDF+CSV', 'Имейл'],
    excluded: [],
  },
  BUSINESS: {
    name: 'BUSINESS',
    displayName: 'Бизнес',
    monthlyPrice: 19.99,
    yearlyPrice: 199.99,
    description: 'За предприятия',
    icon: Crown,
    features: ['∞ всичко', '10 фирми', '∞ клиенти', '∞ продукти', '5 потребители', 'API'],
    excluded: [],
  },
};

type PlanKey = keyof typeof PLANS;

export function SubscriptionPlans() {
  const { subscription, isLoading, error, createCheckoutSession, cancelSubscription } = useSubscription();
  const [cancelingSubscription, setCancelingSubscription] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState(false);
  const [showCancellationSurvey, setShowCancellationSurvey] = useState(false);
  const [isYearly, setIsYearly] = useState(true);

  const handleSubscribe = async (plan: string) => {
    try {
      await createCheckoutSession(plan, isYearly ? 'yearly' : 'monthly');
    } catch (error) {
      console.error('Error creating checkout session:', error);
      toast.error('Грешка при създаване на сесия за плащане');
    }
  };

  const handleEditSubscription = async (plan: string) => {
    try {
      setEditingSubscription(true);
      await createCheckoutSession(plan, isYearly ? 'yearly' : 'monthly');
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscriptionId: subscription.id, reason, feedback }),
      });
      
      if (!response.ok) throw new Error('Failed to submit survey');
      await handleCancelSubscription();
    } catch (error) {
      console.error('Error submitting survey:', error);
      await handleCancelSubscription();
    }
  };

  const isCurrentPlan = (plan: string): boolean => {
    if (!subscription) return plan === 'FREE';
    return subscription.plan === plan && 
           ['ACTIVE', 'TRIALING', 'PAST_DUE'].includes(subscription.status);
  };

  const getSubscriptionEndsText = (): string => {
    if (!subscription?.currentPeriodEnd) return '';
    try {
      const endDate = new Date(subscription.currentPeriodEnd);
      if (isNaN(endDate.getTime())) return '';
      const willCancel = subscription.cancelAtPeriodEnd === true;
      return `${willCancel ? 'Приключва' : 'Подновяване'}: ${endDate.toLocaleDateString('bg-BG')}`;
    } catch { return ''; }
  };

  const getYearlySavings = (plan: typeof PLANS[PlanKey]) => {
    if (plan.monthlyPrice === 0) return 0;
    return (plan.monthlyPrice * 12) - plan.yearlyPrice;
  };

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive" className="py-2">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle className="text-sm">Грешка</AlertTitle>
          <AlertDescription className="text-xs">{error}</AlertDescription>
        </Alert>
      )}

      {/* Current Subscription - Compact */}
      {subscription && subscription.plan !== 'FREE' && (
        <div className="flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/20">
          <div className="flex items-center gap-3">
            <CreditCard className="h-4 w-4 text-primary" />
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {PLANS[subscription.plan as PlanKey]?.displayName || subscription.plan}
              </Badge>
              <Badge variant={subscription.cancelAtPeriodEnd ? "outline" : "default"} className="text-xs">
                {subscription.cancelAtPeriodEnd ? 'Анулиран' : 'Активен'}
              </Badge>
              <span className="text-xs text-muted-foreground hidden sm:inline">
                {getSubscriptionEndsText()}
              </span>
            </div>
          </div>
          {subscription.cancelAtPeriodEnd !== true && (
            <Button variant="ghost" size="sm" onClick={handleCancelButtonClick} disabled={cancelingSubscription} className="text-xs h-7">
              {cancelingSubscription ? '...' : 'Отказ'}
            </Button>
          )}
        </div>
      )}

      {/* Header + Toggle - Compact */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 border-0 text-xs">
            <Sparkles className="h-3 w-3 mr-1" />
            14 дни безплатен trial
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn("text-xs transition-colors", !isYearly ? "text-foreground font-medium" : "text-muted-foreground")}>
            Месечно
          </span>
          <Switch 
            checked={isYearly} 
            onCheckedChange={setIsYearly}
            className="data-[state=checked]:bg-emerald-500 h-5 w-9"
          />
          <span className={cn("text-xs transition-colors", isYearly ? "text-foreground font-medium" : "text-muted-foreground")}>
            Годишно
          </span>
          {isYearly && (
            <Badge variant="outline" className="text-emerald-600 border-emerald-300 text-[10px] px-1.5 py-0">
              -17%
            </Badge>
          )}
        </div>
      </div>

      {/* Plans Grid - Compact */}
      <div id="subscription-plans" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {(Object.keys(PLANS) as PlanKey[]).map((planKey) => {
          const plan = PLANS[planKey];
          const isCurrent = isCurrentPlan(planKey);
          const isPopular = plan.popular;
          const price = isYearly ? plan.yearlyPrice / 12 : plan.monthlyPrice;
          const savings = getYearlySavings(plan);
          const Icon = plan.icon;

          return (
            <Card 
              key={planKey}
              className={cn(
                "relative flex flex-col transition-all duration-200",
                isPopular && !isCurrent && "border-emerald-500 shadow-md shadow-emerald-500/10 ring-1 ring-emerald-500/20",
                isCurrent && "border-primary ring-1 ring-primary/30 bg-primary/5",
                !isPopular && !isCurrent && "hover:border-muted-foreground/30"
              )}
            >
              {/* Badges */}
              {(isPopular || isCurrent) && (
                <div className="absolute -top-2.5 left-0 right-0 flex justify-center">
                  <Badge className={cn(
                    "text-[10px] px-2 py-0 h-5 border-0 shadow-sm",
                    isPopular && !isCurrent && "bg-emerald-500 text-white",
                    isCurrent && "bg-primary text-primary-foreground"
                  )}>
                    {isCurrent ? (
                      <><Check className="h-2.5 w-2.5 mr-0.5" /> Текущ</>
                    ) : (
                      <><Star className="h-2.5 w-2.5 mr-0.5 fill-current" /> Популярен</>
                    )}
                  </Badge>
                </div>
              )}

              <CardHeader className="p-3 pb-2">
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "h-8 w-8 rounded-md flex items-center justify-center",
                    planKey === 'FREE' && "bg-slate-100 dark:bg-slate-900 text-slate-500",
                    planKey === 'STARTER' && "bg-blue-100 dark:bg-blue-950 text-blue-500",
                    planKey === 'PRO' && "bg-emerald-100 dark:bg-emerald-950 text-emerald-500",
                    planKey === 'BUSINESS' && "bg-violet-100 dark:bg-violet-950 text-violet-500",
                  )}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-semibold">{plan.displayName}</CardTitle>
                    <p className="text-[10px] text-muted-foreground">{plan.description}</p>
                  </div>
                </div>
                
                {/* Price */}
                <div className="mt-2">
                  <div className="flex items-baseline gap-0.5">
                    <span className="text-2xl font-bold">
                      {price === 0 ? '0' : price.toFixed(2)}
                    </span>
                    <span className="text-xs text-muted-foreground">лв/мес</span>
                  </div>
                  {isYearly && savings > 0 && (
                    <p className="text-[10px] text-emerald-600 dark:text-emerald-400">
                      Спестявате {savings.toFixed(0)} лв/год
                    </p>
                  )}
                </div>
              </CardHeader>

              <CardContent className="p-3 pt-0 flex-1">
                <ul className="space-y-1">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-1.5 text-xs">
                      <Check className="h-3 w-3 text-emerald-500 shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                  {plan.excluded.map((feature, index) => (
                    <li key={`ex-${index}`} className="flex items-center gap-1.5 text-xs text-muted-foreground/50">
                      <X className="h-3 w-3 shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter className="p-3 pt-0">
                {isCurrent ? (
                  <Button variant="outline" size="sm" className="w-full h-8 text-xs" disabled>
                    Текущ план
                  </Button>
                ) : planKey === 'FREE' ? (
                  <Button variant="outline" size="sm" className="w-full h-8 text-xs" disabled>
                    Безплатен
                  </Button>
                ) : subscription && subscription.plan !== 'FREE' ? (
                  <Button 
                    size="sm"
                    className={cn(
                      "w-full h-8 text-xs",
                      isPopular && "bg-emerald-500 hover:bg-emerald-600 text-white"
                    )}
                    variant={isPopular ? "default" : "outline"}
                    onClick={() => handleEditSubscription(planKey)} 
                    disabled={isLoading || editingSubscription}
                  >
                    Смяна <ChevronRight className="h-3 w-3 ml-0.5" />
                  </Button>
                ) : (
                  <Button 
                    size="sm"
                    className={cn(
                      "w-full h-8 text-xs",
                      isPopular && "bg-emerald-500 hover:bg-emerald-600 text-white"
                    )}
                    variant={isPopular ? "default" : "outline"}
                    onClick={() => handleSubscribe(planKey)} 
                    disabled={isLoading}
                  >
                    Избери <ChevronRight className="h-3 w-3 ml-0.5" />
                  </Button>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {/* Trust Badges - Compact single line */}
      <div className="flex flex-wrap justify-center gap-4 pt-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <Shield className="h-3.5 w-3.5 text-emerald-500" />
          <span>НАП съвместим</span>
        </div>
        <div className="flex items-center gap-1">
          <Shield className="h-3.5 w-3.5 text-blue-500" />
          <span>GDPR</span>
        </div>
        <div className="flex items-center gap-1">
          <TrendingUp className="h-3.5 w-3.5 text-violet-500" />
          <span>500+ компании</span>
        </div>
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

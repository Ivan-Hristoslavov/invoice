"use client";

import { useState } from 'react';
import { Check, X, CreditCard, Sparkles, Star, Zap, Crown, FileText, Shield, TrendingUp, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSubscription } from '@/hooks/useSubscription';
import { AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CancellationSurvey } from './CancellationSurvey';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// Pricing structure - 6 items per plan for equal height
const PLANS = {
  FREE: {
    name: 'FREE',
    displayName: 'Безплатен',
    monthlyPrice: 0,
    yearlyPrice: 0,
    description: 'За стартиране',
    icon: FileText,
    color: 'slate',
    features: [
      { text: '3 фактури/месец', included: true },
      { text: '1 фирма', included: true },
      { text: '5 клиенти', included: true },
      { text: '10 продукти', included: true },
      { text: 'Без лого', included: false },
      { text: 'Без експорт', included: false },
    ],
  },
  STARTER: {
    name: 'STARTER',
    displayName: 'Стартер',
    monthlyPrice: 4.99,
    yearlyPrice: 49.99,
    description: 'За фрийлансъри',
    icon: Zap,
    color: 'blue',
    features: [
      { text: '15 фактури/месец', included: true },
      { text: '1 фирма', included: true },
      { text: '25 клиенти', included: true },
      { text: '50 продукти', included: true },
      { text: 'CSV експорт', included: true },
      { text: 'Без имейл', included: false },
    ],
  },
  PRO: {
    name: 'PRO',
    displayName: 'Про',
    monthlyPrice: 8.99,
    yearlyPrice: 89.99,
    description: 'За малки бизнеси',
    icon: Star,
    color: 'emerald',
    popular: true,
    features: [
      { text: 'Неограничени фактури', included: true },
      { text: '3 фирми', included: true },
      { text: '100 клиенти', included: true },
      { text: '200 продукти', included: true },
      { text: 'Лого + PDF/CSV', included: true },
      { text: 'Имейл изпращане', included: true },
    ],
  },
  BUSINESS: {
    name: 'BUSINESS',
    displayName: 'Бизнес',
    monthlyPrice: 19.99,
    yearlyPrice: 199.99,
    description: 'За предприятия',
    icon: Crown,
    color: 'violet',
    features: [
      { text: 'Всичко неограничено', included: true },
      { text: '10 фирми', included: true },
      { text: '5 потребители', included: true },
      { text: 'API достъп', included: true },
      { text: 'Приоритетна поддръжка', included: true },
      { text: 'Персонализация', included: true },
    ],
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
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive" className="py-2">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle className="text-sm">Грешка</AlertTitle>
          <AlertDescription className="text-xs">{error}</AlertDescription>
        </Alert>
      )}

      {/* Current Subscription - Compact */}
      {subscription && subscription.plan !== 'FREE' && (
        <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <CreditCard className="h-4 w-4 text-primary" />
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">
                  {PLANS[subscription.plan as PlanKey]?.displayName || subscription.plan}
                </span>
                <Badge variant={subscription.cancelAtPeriodEnd ? "outline" : "secondary"} className="text-[10px] h-5">
                  {subscription.cancelAtPeriodEnd ? 'Изтича' : 'Активен'}
                </Badge>
              </div>
              <span className="text-xs text-muted-foreground">
                {getSubscriptionEndsText()}
              </span>
            </div>
          </div>
          {subscription.cancelAtPeriodEnd !== true && (
            <Button variant="ghost" size="sm" onClick={handleCancelButtonClick} disabled={cancelingSubscription} className="text-xs h-8 text-muted-foreground hover:text-destructive">
              {cancelingSubscription ? '...' : 'Отказ'}
            </Button>
          )}
        </div>
      )}

      {/* Header + Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <Sparkles className="h-4 w-4 text-emerald-500" />
            <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">14 дни безплатен trial</span>
          </div>
        </div>
        
        {/* Billing Toggle - Improved Design */}
        <div className="flex items-center gap-1 p-1 rounded-full bg-muted/50 border">
          <button
            onClick={() => setIsYearly(false)}
            className={cn(
              "px-4 py-1.5 rounded-full text-sm font-medium transition-all",
              !isYearly 
                ? "bg-background shadow-sm text-foreground" 
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Месечно
          </button>
          <button
            onClick={() => setIsYearly(true)}
            className={cn(
              "px-4 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-2",
              isYearly 
                ? "bg-emerald-500 text-white shadow-sm" 
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Годишно
            <span className={cn(
              "text-[10px] px-1.5 py-0.5 rounded-full font-bold",
              isYearly ? "bg-white/20" : "bg-emerald-500/20 text-emerald-600"
            )}>
              -17%
            </span>
          </button>
        </div>
      </div>

      {/* Plans Grid */}
      <div id="subscription-plans" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {(Object.keys(PLANS) as PlanKey[]).map((planKey) => {
          const plan = PLANS[planKey];
          const isCurrent = isCurrentPlan(planKey);
          const isPopular = plan.popular;
          const price = isYearly ? plan.yearlyPrice / 12 : plan.monthlyPrice;
          const savings = getYearlySavings(plan);
          const Icon = plan.icon;

          return (
            <div 
              key={planKey}
              className={cn(
                "relative flex flex-col rounded-2xl border bg-card p-5 transition-all duration-300",
                isPopular && !isCurrent && "border-emerald-500/50 shadow-lg shadow-emerald-500/10 scale-[1.02]",
                isCurrent && "border-primary/50 bg-primary/5 shadow-lg shadow-primary/10",
                !isPopular && !isCurrent && "hover:border-border/80 hover:shadow-md"
              )}
            >
              {/* Badge */}
              {(isPopular || isCurrent) && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className={cn(
                    "px-3 py-1 text-xs font-medium border-0 shadow-md",
                    isPopular && !isCurrent && "bg-emerald-500 text-white",
                    isCurrent && "bg-primary text-primary-foreground"
                  )}>
                    {isCurrent ? (
                      <><Check className="h-3 w-3 mr-1" /> Текущ план</>
                    ) : (
                      <><Star className="h-3 w-3 mr-1 fill-current" /> Най-популярен</>
                    )}
                  </Badge>
                </div>
              )}

              {/* Header */}
              <div className={cn("pt-2", (isPopular || isCurrent) && "pt-4")}>
                <div className="flex items-center gap-3 mb-4">
                  <div className={cn(
                    "h-10 w-10 rounded-xl flex items-center justify-center",
                    planKey === 'FREE' && "bg-slate-100 dark:bg-slate-800 text-slate-500",
                    planKey === 'STARTER' && "bg-blue-100 dark:bg-blue-900/50 text-blue-500",
                    planKey === 'PRO' && "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-500",
                    planKey === 'BUSINESS' && "bg-violet-100 dark:bg-violet-900/50 text-violet-500",
                  )}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-base">{plan.displayName}</h3>
                    <p className="text-xs text-muted-foreground">{plan.description}</p>
                  </div>
                </div>
                
                {/* Price */}
                <div className="mb-5">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold tracking-tight">
                      {price === 0 ? '0' : price.toFixed(2)}
                    </span>
                    <span className="text-sm text-muted-foreground">€/мес</span>
                  </div>
                  <div className="h-5">
                    {isYearly && savings > 0 ? (
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                        Спестявате {savings.toFixed(0)}€ годишно
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        {planKey === 'FREE' ? 'Завинаги безплатен' : 'Таксува се месечно'}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Features */}
              <div className="flex-1 mb-5">
                <ul className="space-y-2.5">
                  {plan.features.map((feature, index) => (
                    <li 
                      key={index} 
                      className={cn(
                        "flex items-center gap-2.5 text-sm",
                        !feature.included && "text-muted-foreground/60"
                      )}
                    >
                      {feature.included ? (
                        <div className="h-5 w-5 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                          <Check className="h-3 w-3 text-emerald-500" />
                        </div>
                      ) : (
                        <div className="h-5 w-5 rounded-full bg-muted flex items-center justify-center shrink-0">
                          <X className="h-3 w-3 text-muted-foreground/50" />
                        </div>
                      )}
                      <span>{feature.text}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Button */}
              <div>
                {isCurrent ? (
                  <Button variant="outline" className="w-full h-10" disabled>
                    <Check className="h-4 w-4 mr-2" />
                    Текущ план
                  </Button>
                ) : planKey === 'FREE' ? (
                  <Button variant="outline" className="w-full h-10" disabled>
                    Безплатен план
                  </Button>
                ) : subscription && subscription.plan !== 'FREE' ? (
                  <Button 
                    className={cn(
                      "w-full h-10 font-medium",
                      isPopular && "bg-emerald-500 hover:bg-emerald-600 text-white shadow-md shadow-emerald-500/20"
                    )}
                    variant={isPopular ? "default" : "outline"}
                    onClick={() => handleEditSubscription(planKey)} 
                    disabled={isLoading || editingSubscription}
                  >
                    Смени плана
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                ) : (
                  <Button 
                    className={cn(
                      "w-full h-10 font-medium",
                      isPopular && "bg-emerald-500 hover:bg-emerald-600 text-white shadow-md shadow-emerald-500/20"
                    )}
                    variant={isPopular ? "default" : "outline"}
                    onClick={() => handleSubscribe(planKey)} 
                    disabled={isLoading}
                  >
                    Започни сега
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Trust Badges */}
      <div className="flex flex-wrap justify-center gap-6 pt-4 pb-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
            <Shield className="h-4 w-4 text-emerald-500" />
          </div>
          <span>НАП съвместим</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <Shield className="h-4 w-4 text-blue-500" />
          </div>
          <span>GDPR</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="h-8 w-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
            <TrendingUp className="h-4 w-4 text-violet-500" />
          </div>
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

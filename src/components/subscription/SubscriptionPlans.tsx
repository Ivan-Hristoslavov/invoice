"use client";

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { Check, X, CreditCard, Sparkles, Star, Zap, Crown, FileText, Shield, TrendingUp, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSubscription } from '@/hooks/useSubscription';
import { useSubscriptionLimit } from '@/hooks/useSubscriptionLimit';
import { AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CancellationSurvey } from './CancellationSurvey';
import { toast } from "@/lib/toast";
import { cn, formatPrice } from '@/lib/utils';
import { SUBSCRIPTION_PLANS } from '@/lib/subscription-plans';
import { PRICING_CARD_SURFACE } from '@/lib/pricing-card-surfaces';

const PLANS = {
  FREE: {
    name: SUBSCRIPTION_PLANS.FREE.key,
    displayName: SUBSCRIPTION_PLANS.FREE.displayName,
    monthlyPrice: SUBSCRIPTION_PLANS.FREE.monthlyPrice,
    yearlyPrice: SUBSCRIPTION_PLANS.FREE.yearlyPrice,
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
    name: SUBSCRIPTION_PLANS.STARTER.key,
    displayName: SUBSCRIPTION_PLANS.STARTER.displayName,
    monthlyPrice: SUBSCRIPTION_PLANS.STARTER.monthlyPrice,
    yearlyPrice: SUBSCRIPTION_PLANS.STARTER.yearlyPrice,
    description: 'За фрийлансъри',
    icon: Zap,
    color: 'blue',
    features: [
      { text: '15 фактури/месец', included: true },
      { text: '1 фирма', included: true },
      { text: '25 клиенти', included: true },
      { text: '50 продукти', included: true },
      { text: 'Търсене по ЕИК', included: true },
      { text: 'CSV експорт', included: true },
      { text: 'Без имейл', included: false },
    ],
  },
  PRO: {
    name: SUBSCRIPTION_PLANS.PRO.key,
    displayName: SUBSCRIPTION_PLANS.PRO.displayName,
    monthlyPrice: SUBSCRIPTION_PLANS.PRO.monthlyPrice,
    yearlyPrice: SUBSCRIPTION_PLANS.PRO.yearlyPrice,
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
    name: SUBSCRIPTION_PLANS.BUSINESS.key,
    displayName: SUBSCRIPTION_PLANS.BUSINESS.displayName,
    monthlyPrice: SUBSCRIPTION_PLANS.BUSINESS.monthlyPrice,
    yearlyPrice: SUBSCRIPTION_PLANS.BUSINESS.yearlyPrice,
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

interface SubscriptionPlansProps {
  /** Извиква се след първия refetch при ?success=true – за да скрие страницата loading overlay-а */
  onSuccessRefetchDone?: () => void;
}

export function SubscriptionPlans({ onSuccessRefetchDone }: SubscriptionPlansProps = {}) {
  const searchParams = useSearchParams();
  const { subscription, isLoading, error, createCheckoutSession, cancelSubscription, refetchSubscription, refetchSubscriptionSilent } = useSubscription();
  const { refreshUsage } = useSubscriptionLimit();
  const [cancelingSubscription, setCancelingSubscription] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState(false);
  const [showCancellationSurvey, setShowCancellationSurvey] = useState(false);
  const [isYearly, setIsYearly] = useState(true);

  // При връщане след плащане (?success=true): един път refetch с loading, после callback; след 4s тих retry
  const successParam = searchParams.get('success');
  const didRefreshOnSuccess = useRef(false);
  useEffect(() => {
    if (successParam !== 'true') return;
    if (didRefreshOnSuccess.current) return;
    didRefreshOnSuccess.current = true;

    const run = async () => {
      try {
        await refetchSubscription();
        await refreshUsage();
      } finally {
        onSuccessRefetchDone?.();
      }
    };
    run();

    const t = window.setTimeout(() => {
      refetchSubscriptionSilent();
      refreshUsage();
    }, 4000);
    return () => clearTimeout(t);
  }, [successParam, refetchSubscription, refetchSubscriptionSilent, refreshUsage, onSuccessRefetchDone]);

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

  const getYearlySavingsPercent = (plan: typeof PLANS[PlanKey]) => {
    if (plan.monthlyPrice === 0) return 0;
    const fullYear = plan.monthlyPrice * 12;
    return Math.round((getYearlySavings(plan) / fullYear) * 100);
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
        <div className="flex items-center justify-between p-3 rounded-xl bg-linear-to-r from-primary/10 to-primary/5 border border-primary/20">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <CreditCard className="h-4 w-4 text-primary" />
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">
                  {PLANS[subscription.plan as PlanKey]?.displayName || subscription.plan}
                </span>
                <Badge variant={subscription.cancelAtPeriodEnd ? "outline-solid" : "secondary"} className="text-[10px] h-5">
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
      <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Trial badge – по-компактен и не толкова висок */}
        <div className="flex w-full justify-center sm:justify-start">
          <div className="flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 max-w-[240px]">
            <Sparkles className="h-4 w-4 shrink-0 text-emerald-500" />
            <span className="text-xs font-medium text-emerald-500 dark:text-emerald-300 leading-none">
              14 дни безплатен trial
            </span>
          </div>
        </div>
        
        {/* Billing Toggle - Compact, центриран по-добре на мобилни */}
        <div className="grid w-full max-w-xs grid-cols-2 gap-0.5 rounded-full border bg-muted/50 p-0.5 self-center sm:self-auto sm:w-auto sm:max-w-[220px]">
          <button
            onClick={() => setIsYearly(false)}
            className={cn(
              "flex min-w-0 items-center justify-center rounded-full px-2 py-1.5 text-xs font-medium transition-all",
              !isYearly 
                ? "bg-background shadow-xs text-foreground" 
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Месечно
          </button>
          <button
            onClick={() => setIsYearly(true)}
            className={cn(
              "flex min-w-0 items-center justify-center gap-1 rounded-full px-2 py-1.5 text-xs font-medium transition-all",
              isYearly 
                ? "bg-emerald-500 text-white shadow-xs" 
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Годишно
            <span className={cn(
              "rounded-full px-1 py-0.5 text-[8px] font-bold leading-tight",
              isYearly ? "bg-white/20" : "bg-emerald-500/20 text-emerald-600"
            )}>
              2 мес. безпл.
            </span>
          </button>
        </div>
      </div>

      {isYearly && (
        <p className="text-center text-sm text-muted-foreground">
          При годишен план плащате за 10 месеца и получавате <strong className="text-foreground">12</strong> — най-добра стойност.
        </p>
      )}

      {/* Plans Grid – glass / featured карти */}
      <div id="subscription-plans" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {(Object.keys(PLANS) as PlanKey[]).map((planKey) => {
          const plan = PLANS[planKey];
          const isCurrent = isCurrentPlan(planKey);
          const isPopular = 'popular' in plan && (plan as { popular?: boolean }).popular;
          const price = isYearly ? plan.yearlyPrice / 12 : plan.monthlyPrice;
          const savings = getYearlySavings(plan);
          const savingsPercent = getYearlySavingsPercent(plan);
          const Icon = plan.icon;

          // Per-plan color themes
          const planTheme = {
            FREE:     { iconBg: "bg-slate-100 dark:bg-slate-800", iconText: "text-slate-500", btnClass: "border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300", checkBg: "bg-slate-100 dark:bg-slate-800", checkIcon: "text-slate-500" },
            STARTER:  { iconBg: "bg-blue-100 dark:bg-blue-900/50", iconText: "text-blue-500", btnClass: "bg-blue-500 hover:bg-blue-600 text-white shadow-md shadow-blue-500/20", checkBg: "bg-blue-500/10", checkIcon: "text-blue-500" },
            PRO:      { iconBg: "bg-emerald-100 dark:bg-emerald-900/50", iconText: "text-emerald-500", btnClass: "bg-emerald-500 hover:bg-emerald-600 text-white shadow-md shadow-emerald-500/20", checkBg: "bg-emerald-500/10", checkIcon: "text-emerald-500" },
            BUSINESS: { iconBg: "bg-violet-100 dark:bg-violet-900/50", iconText: "text-violet-500", btnClass: "bg-violet-500 hover:bg-violet-600 text-white shadow-md shadow-violet-500/20", checkBg: "bg-violet-500/10", checkIcon: "text-violet-500" },
          }[planKey];

          const planBody = (
            <>
              {isPopular && !isCurrent ? (
                <div
                  className="pointer-events-none absolute inset-x-0 top-0 h-24 rounded-t-[1.4375rem] bg-linear-to-b from-white/12 to-transparent dark:from-white/8"
                  aria-hidden
                />
              ) : null}
              <div className="relative z-1 flex flex-1 flex-col p-4 sm:p-5">
                {/* Header */}
                <div className="mb-3 flex gap-3">
                  <div
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl shadow-sm ring-1 ring-black/5 dark:ring-white/10",
                      planTheme.iconBg,
                      planTheme.iconText
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="truncate text-sm font-semibold leading-tight">{plan.displayName}</h3>
                      <div className="flex shrink-0 flex-wrap justify-end gap-1">
                        {isCurrent && (
                          <Badge className="h-5 border-0 bg-primary px-2 py-0 text-[10px] font-semibold text-primary-foreground">
                            <Check className="mr-0.5 h-2.5 w-2.5" />
                            Текущ
                          </Badge>
                        )}
                        {isPopular && !isCurrent && (
                          <Badge className="h-5 border-0 bg-emerald-500 px-2 py-0 text-[10px] font-semibold text-white">
                            <Star className="mr-0.5 h-2.5 w-2.5 fill-current" />
                            Популярен
                          </Badge>
                        )}
                        {planKey === "BUSINESS" && !isCurrent && (
                          <Badge className="h-5 border-0 bg-violet-500 px-2 py-0 text-[10px] font-semibold text-white">
                            Корпоративен
                          </Badge>
                        )}
                      </div>
                    </div>
                    <p
                      className="truncate text-[11px] leading-tight text-muted-foreground sm:text-xs"
                      title={plan.description}
                    >
                      {plan.description}
                    </p>
                  </div>
                </div>

                {/* Price */}
                <div className="mb-1">
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-bold tracking-tight sm:text-2xl">{formatPrice(price)}</span>
                    <span className="text-sm font-normal text-muted-foreground">€/мес</span>
                  </div>
                  {isYearly && plan.yearlyPrice > 0 && (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {formatPrice(plan.yearlyPrice)} € общо за 12 месеца
                    </p>
                  )}
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    {isYearly && savings > 0 && (
                      <>
                        <span className="inline-flex items-center rounded-md bg-emerald-500/15 px-2 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                          2 месеца безплатно
                        </span>
                        <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                          Спестявате {savings.toFixed(0)} € ({savingsPercent}%)
                        </span>
                      </>
                    )}
                    {!isYearly && planKey !== "FREE" && (
                      <p className="text-xs text-muted-foreground">Таксува се месечно</p>
                    )}
                    {planKey === "FREE" && (
                      <p className="text-xs text-muted-foreground">Завинаги безплатен</p>
                    )}
                  </div>
                </div>

                <div className="my-3 flex items-center gap-2">
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border/80 to-transparent" />
                  <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    Функции
                  </span>
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border/80 to-transparent" />
                </div>

                <div className="mb-3 flex-1">
                  <ul className="space-y-1.5">
                    {plan.features.map((feature, index) => (
                      <li
                        key={index}
                        className={cn(
                          "flex items-center gap-2 text-xs sm:text-sm",
                          !feature.included && "text-muted-foreground/50"
                        )}
                      >
                        {feature.included ? (
                          <div
                            className={cn(
                              "flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
                              planTheme.checkBg
                            )}
                          >
                            <Check className={cn("h-3 w-3", planTheme.checkIcon)} />
                          </div>
                        ) : (
                          <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted">
                            <X className="h-3 w-3 text-muted-foreground/40" />
                          </div>
                        )}
                        <span>{feature.text}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-auto border-t border-border/40 pt-3.5">
                  {isCurrent ? (
                    <Button variant="outline" className="h-11 w-full rounded-2xl font-semibold" disabled>
                      <Check className="mr-2 h-4 w-4" />
                      Текущ план
                    </Button>
                  ) : planKey === "FREE" ? (
                    <Button variant="outline" className="h-11 w-full rounded-2xl text-muted-foreground" disabled>
                      Безплатен план
                    </Button>
                  ) : subscription && subscription.plan !== "FREE" ? (
                    <Button
                      className={cn("h-11 w-full rounded-2xl border-0 font-semibold", planTheme.btnClass)}
                      onClick={() => handleEditSubscription(planKey)}
                      disabled={isLoading || editingSubscription}
                    >
                      Смени плана
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      className={cn("h-11 w-full rounded-2xl border-0 font-semibold", planTheme.btnClass)}
                      onClick={() => handleSubscribe(planKey)}
                      disabled={isLoading}
                    >
                      Започни сега
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </>
          );

          return (
            <div key={planKey} className={cn("flex min-h-0 flex-col", isPopular && !isCurrent && "lg:-mt-1")}>
              {isPopular && !isCurrent ? (
                <div className="pricing-featured-ring flex min-h-0 flex-1 flex-col">
                  <div
                    className={cn(
                      "relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-[calc(1.5rem-1px)] backdrop-blur-xl",
                      PRICING_CARD_SURFACE[planKey]
                    )}
                  >
                    {planBody}
                  </div>
                </div>
              ) : (
                <div
                  className={cn(
                    "relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-3xl border shadow-lg backdrop-blur-md transition-all duration-300",
                    "border-white/15 dark:border-white/10",
                    PRICING_CARD_SURFACE[planKey],
                    isCurrent && "border-primary/50 shadow-md ring-1 ring-primary/25",
                    !isPopular && !isCurrent && "hover:border-white/25 hover:shadow-md",
                    isPopular && isCurrent && "border-emerald-500/45 shadow-emerald-500/10"
                  )}
                >
                  {planBody}
                </div>
              )}
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
          <span>Български формати</span>
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

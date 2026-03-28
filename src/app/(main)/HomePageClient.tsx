"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ChevronRight,
  Check,
  X,
  Sparkles,
  Zap,
  Shield,
  BarChart3,
  FileText,
  Users,
  Building,
  ArrowRight,
  Star,
  Crown,
  CreditCard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { APP_NAME } from "@/config/constants";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { BackgroundShapes } from "@/components/ui/background-shapes";
import { shouldReduceBrowserEffects } from "@/lib/browser-effects";
import { cn } from "@/lib/utils";
import { Pagination } from "@/components/ui/pagination";
import { SUBSCRIPTION_PLANS } from "@/lib/subscription-plans";
import {
  paymentMessage,
  publicBusinessProfile,
  shouldShowPublicLegalField,
} from "@/config/public-business";

function HCard({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-[1.75rem] border border-border/60 bg-card/95 text-card-foreground",
        className
      )}
      {...props}
    />
  );
}

function HCardContent({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={className} {...props} />;
}

function HCardFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex items-center", className)} {...props} />;
}

function Chip({
  className,
  color = "default",
  variant = "soft",
  size = "md",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & {
  color?: "default" | "accent" | "warning" | "success";
  variant?: "soft" | "solid" | "outline";
  size?: "sm" | "md";
}) {
  const palette = {
    default:
      variant === "outline"
        ? "border-border/70 text-foreground"
        : "bg-muted text-muted-foreground",
    accent:
      variant === "outline"
        ? "border-cyan-400/40 text-cyan-600 dark:text-cyan-300"
        : "bg-cyan-500/10 text-cyan-700 dark:text-cyan-300",
    warning:
      variant === "outline"
        ? "border-amber-400/40 text-amber-700 dark:text-amber-300"
        : "bg-amber-500/10 text-amber-700 dark:text-amber-300",
    success:
      variant === "outline"
        ? "border-emerald-400/40 text-emerald-700 dark:text-emerald-300"
        : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  } as const;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 font-medium",
        size === "sm" ? "text-[10px]" : "text-xs sm:text-sm",
        palette[color],
        className
      )}
      {...props}
    />
  );
}

function Separator({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("h-px w-full bg-border/60", className)} {...props} />;
}

type PlanKey = "FREE" | "STARTER" | "PRO" | "BUSINESS";

interface PricingPlan {
  key: PlanKey;
  name: string;
  price: { monthly: number; yearly: number };
  description: string;
  icon: React.ElementType;
  gradient: string;
  glowColor: string;
  popular?: boolean;
  features: { text: string; included: boolean }[];
  cta: string;
  ctaHref: string;
}

const features = [
  {
    icon: FileText,
    title: "Професионални фактури",
    description:
      "Създавайте елегантни фактури с персонализиран дизайн, автоматично номериране и PDF експорт.",
    color: "from-blue-500 to-cyan-500",
  },
  {
    icon: Zap,
    title: "Бързо и лесно",
    description:
      "Интуитивен интерфейс за създаване на фактури за минути. Спестете време с шаблони.",
    color: "from-amber-500 to-orange-500",
  },
  {
    icon: Shield,
    title: "НАП съвместимост",
    description:
      "Пълна съвместимост с българските данъчни изисквания и автоматично генериране на номера.",
    color: "from-emerald-500 to-teal-500",
  },
  {
    icon: BarChart3,
    title: "Финансови анализи",
    description:
      "Подробни отчети и статистики за вашия бизнес в реално време.",
    color: "from-violet-500 to-purple-500",
  },
  {
    icon: Users,
    title: "Управление на клиенти",
    description:
      "Централизирана база данни с клиенти, история на фактури и бързо търсене.",
    color: "from-rose-500 to-pink-500",
  },
  {
    icon: Building,
    title: "Мулти-компании",
    description:
      "Управлявайте множество фирми от един акаунт с различни настройки.",
    color: "from-indigo-500 to-blue-500",
  },
] as const;

const pricingPlans: PricingPlan[] = [
  {
    key: "FREE",
    name: "Безплатен",
    price: {
      monthly: SUBSCRIPTION_PLANS.FREE.monthlyPrice,
      yearly: SUBSCRIPTION_PLANS.FREE.yearlyPrice,
    },
    description: "За стартиращи бизнеси",
    icon: FileText,
    gradient: "from-slate-500 to-slate-600",
    glowColor: "rgba(100,116,139,0.15)",
    features: [
      { text: "3 фактури/месец", included: true },
      { text: "1 фирма", included: true },
      { text: "5 клиенти", included: true },
      { text: "10 продукти", included: true },
      { text: "Собствено лого", included: false },
      { text: "Имейл изпращане", included: false },
    ],
    cta: "Започни безплатно",
    ctaHref: "/signup?plan=FREE",
  },
  {
    key: "STARTER",
    name: "Стартер",
    price: {
      monthly: SUBSCRIPTION_PLANS.STARTER.monthlyPrice,
      yearly: SUBSCRIPTION_PLANS.STARTER.yearlyPrice,
    },
    description: "За фрийлансъри",
    icon: Zap,
    gradient: "from-blue-500 to-indigo-600",
    glowColor: "rgba(59,130,246,0.15)",
    features: [
      { text: "15 фактури/месец", included: true },
      { text: "1 фирма", included: true },
      { text: "25 клиенти", included: true },
      { text: "50 продукти", included: true },
      { text: "CSV експорт", included: true },
      { text: "Имейл изпращане", included: false },
    ],
    cta: "Опитай безплатно",
    ctaHref: "/signup?plan=STARTER",
  },
  {
    key: "PRO",
    name: "Про",
    price: {
      monthly: SUBSCRIPTION_PLANS.PRO.monthlyPrice,
      yearly: SUBSCRIPTION_PLANS.PRO.yearlyPrice,
    },
    description: "За малки бизнеси",
    icon: Star,
    gradient: "from-emerald-500 to-teal-600",
    glowColor: "rgba(16,185,129,0.2)",
    popular: true,
    features: [
      { text: "Неограничени фактури", included: true },
      { text: "3 фирми", included: true },
      { text: "100 клиенти", included: true },
      { text: "200 продукти", included: true },
      { text: "Лого + PDF/CSV", included: true },
      { text: "Имейл изпращане", included: true },
    ],
    cta: "14-дневен пробен период",
    ctaHref: "/signup?plan=PRO",
  },
  {
    key: "BUSINESS",
    name: "Бизнес",
    price: {
      monthly: SUBSCRIPTION_PLANS.BUSINESS.monthlyPrice,
      yearly: SUBSCRIPTION_PLANS.BUSINESS.yearlyPrice,
    },
    description: "За предприятия",
    icon: Crown,
    gradient: "from-violet-500 to-purple-600",
    glowColor: "rgba(139,92,246,0.15)",
    features: [
      { text: "Всичко неограничено", included: true },
      { text: "10 фирми", included: true },
      { text: "5 потребители", included: true },
      { text: "API достъп", included: true },
      { text: "Приоритетна поддръжка", included: true },
      { text: "Персонализация", included: true },
    ],
    cta: "Свържете се с нас",
    ctaHref: "/contact",
  },
];

const testimonials = [
  {
    name: "Счетоводна къща",
    role: "Екип с множество фирми",
    content:
      "По-бърза обработка на месечните документи и по-малко ръчна работа при издаване и проследяване.",
    initials: "СК",
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    name: "Фрийланс бизнес",
    role: "1 човек, услужна дейност",
    content:
      "По-бързо издаване на фактури и по-ясен контрол кои документи са платени и кои са в изчакване.",
    initials: "ФБ",
    gradient: "from-emerald-500 to-teal-500",
  },
  {
    name: "Търговска фирма",
    role: "Екип с активни клиенти",
    content:
      "По-добра проследимост на документи, клиенти и суми с подредена история на действията.",
    initials: "ТФ",
    gradient: "from-violet-500 to-purple-500",
  },
  {
    name: "Услуги и консултации",
    role: "Малък растящ екип",
    content:
      "По-стабилен процес от оферта до фактура с по-малко пропуски в административната част.",
    initials: "УК",
    gradient: "from-amber-500 to-orange-500",
  },
  {
    name: "Микро компания",
    role: "Собственик + външен счетоводител",
    content:
      "По-лесно предаване на информация към счетоводството и по-малко корекции на вече издадени документи.",
    initials: "МК",
    gradient: "from-cyan-500 to-blue-500",
  },
  {
    name: "Агенция",
    role: "Повтаряеми месечни фактури",
    content:
      "По-добра дисциплина при месечните цикли и по-ясни лимити по план при растеж на обема.",
    initials: "АГ",
    gradient: "from-rose-500 to-pink-500",
  },
] as const;

const quickHighlights = [
  {
    title: "За 2-3 минути",
    description: "Създаване на фактура с готови стъпки и автоматични данни.",
  },
  {
    title: "Подредена информация",
    description: "Клиенти, продукти, компании и документи на едно място.",
  },
  {
    title: "Подходящо за България",
    description: "Съобразено с местните изисквания и работен процес.",
  },
  {
    title: "Лесно за екип",
    description: "Ясни роли, история и достъп до важните действия.",
  },
] as const;

const workflowSteps = [
  {
    title: "Добавете фирма и клиенти",
    description: "Запазете основните данни веднъж и ги използвайте многократно.",
    icon: Building,
    color: "from-slate-500 to-slate-600",
  },
  {
    title: "Създайте фактура",
    description: "Изберете клиент, добавете артикули и генерирайте документа.",
    icon: FileText,
    color: "from-blue-500 to-indigo-600",
  },
  {
    title: "Проследете статуса",
    description: "Следете издадени, платени, анулирани и сторнирани документи.",
    icon: BarChart3,
    color: "from-emerald-500 to-teal-600",
  },
] as const;

const heroHighlights = [
  { value: "EUR", label: "Ясно ценообразуване в евро" },
  { value: "BG", label: "Съобразено с българския пазар" },
  { value: "Stripe", label: "Сигурно абонаментно плащане" },
] as const;

const caseBasedSegments = [
  {
    title: "За счетоводни къщи",
    points: ["Управление на множество фирми", "Аудитна история на документи", "Ясни роли в екипа"],
    ctaHref: "/signup?plan=BUSINESS",
    ctaLabel: "Започни с Business",
  },
  {
    title: "За фрийлансъри",
    points: ["Бързо издаване на фактура", "Готови клиентски и продуктови шаблони", "Прост процес без излишни менюта"],
    ctaHref: "/signup?plan=STARTER",
    ctaLabel: "Започни със Starter",
  },
  {
    title: "За търговци",
    points: ["Следене на издадени и платени фактури", "PDF/CSV експорт", "Ясна история по клиент и документ"],
    ctaHref: "/signup?plan=PRO",
    ctaLabel: "Започни с Pro",
  },
] as const;

const pricingTrustNotes = [
  "Без дългосрочен договор",
  "Смяна на план според нуждите",
  "Отказ по всяко време от настройките",
  "Поддръжка по имейл в работни дни",
] as const;

const faqItems = [
  {
    q: "Какво е Invoicy?",
    a: "Invoicy е софтуер за издаване на фактури, предназначен за български бизнеси. Помагаме ви да създавате професионални фактури, да ги изпращате по имейл и да следите кой ви дължи пари.",
  },
  {
    q: "Мога ли да приемам плащания чрез Invoicy?",
    a: "Не, Invoicy не е платежна система и не обработва плащания. Ние ви помагаме да издавате фактури, но плащанията се извършват директно между вас и клиентите ви.",
  },
  {
    q: "Какво представлява кредитното известие?",
    a: "Кредитното известие е документ, който се издава за сторниране или коригиране на издадена фактура. Например, ако клиент върне стока или има грешка във фактурата.",
  },
  {
    q: "Съвместима ли е системата с изискванията на НАП?",
    a: "Да, Invoicy е напълно съвместима с българските данъчни изисквания. Фактурите съдържат всички задължителни реквизити съгласно ЗДДС и Закона за счетоводството.",
  },
  {
    q: "Мога ли да използвам системата за няколко фирми?",
    a: "Да, в зависимост от вашия план можете да управлявате от 1 до неограничен брой компании от един акаунт.",
  },
  {
    q: "Има ли дългосрочен договор и как спирам абонамента?",
    a: "Не, няма дългосрочен договор. Можете да промените или спрете плана си от настройките на абонамента по всяко време.",
  },
] as const;

export default function HomePage() {
  const [isYearly, setIsYearly] = useState(false);
  const [featurePage, setFeaturePage] = useState(1);
  const [testimonialPage, setTestimonialPage] = useState(1);
  const [shouldReduceEffects, setShouldReduceEffects] = useState(false);

  useEffect(() => {
    const updateEffects = () => {
      setShouldReduceEffects(shouldReduceBrowserEffects());
    };

    updateEffects();
    window.addEventListener("resize", updateEffects);
    return () => window.removeEventListener("resize", updateEffects);
  }, []);

  const featuresPerPage = 3;
  const testimonialsPerPage = 3;
  const paginatedFeatures = useMemo(
    () =>
      features.slice(
        (featurePage - 1) * featuresPerPage,
        featurePage * featuresPerPage
      ),
    [featurePage]
  );
  const paginatedTestimonials = useMemo(
    () =>
      testimonials.slice(
        (testimonialPage - 1) * testimonialsPerPage,
        testimonialPage * testimonialsPerPage
      ),
    [testimonialPage]
  );

  return (
    <>
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            name: APP_NAME,
            applicationCategory: "BusinessApplication",
            operatingSystem: "Web",
            offers: {
              "@type": "Offer",
              price: "0",
              priceCurrency: "EUR",
              description: "Безплатен план с ограничени функции",
            },
            aggregateRating: {
              "@type": "AggregateRating",
              ratingValue: "4.8",
              ratingCount: "150",
              bestRating: "5",
              worstRating: "1",
            },
            description:
              "Професионална система за фактуриране за български бизнеси с пълна НАП съвместимост",
            url: process.env.NEXT_PUBLIC_APP_URL || "https://invoicy.bg",
            inLanguage: "bg-BG",
          }),
        }}
      />

      <div className="min-h-screen overflow-x-hidden flex flex-col pb-20 sm:pb-0">
        <BackgroundShapes
          variant={shouldReduceEffects ? "subtle" : "vibrant"}
          reduceEffects={shouldReduceEffects}
        />

        {/* ── Header ── */}
        <header className="sticky top-0 z-50 w-full rounded-none border-x-0 border-t-0 glass-card">
          <div className="container mx-auto flex h-14 items-center justify-between px-3 sm:h-16 sm:px-4 md:px-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2"
            >
              <Link href="/" className="flex h-7 w-7 items-center justify-center rounded-lg overflow-hidden sm:h-8 sm:w-8" aria-label="Начало">
                <div className="flex h-full w-full items-center justify-center rounded-lg gradient-primary shadow-md">
                  <FileText className="h-4 w-4 text-white sm:h-5 sm:w-5" aria-hidden />
                </div>
              </Link>
              <span className="max-w-28 truncate text-base font-bold tracking-tight sm:max-w-none sm:text-xl">
                {APP_NAME}
              </span>
            </motion.div>
            <nav className="hidden lg:flex items-center gap-5 text-sm text-muted-foreground">
              <Link href="#features" className="hover:text-foreground transition-colors">Функции</Link>
              <Link href="#pricing" className="hover:text-foreground transition-colors">Цени</Link>
              <Link href="#faq" className="hover:text-foreground transition-colors">FAQ</Link>
              <Link href="/contact" className="hover:text-foreground transition-colors">Контакт</Link>
            </nav>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-1.5 sm:gap-3"
            >
              <ThemeToggle />
              <Button variant="ghost" size="sm" asChild className="hidden sm:flex">
                <Link href="/signin">Вход</Link>
              </Button>
              <Button
                size="sm"
                asChild
                className="h-9 px-3 text-xs gradient-primary hover:opacity-90 text-white border-0 sm:h-10 sm:px-4 sm:text-sm"
              >
                <Link href="/signup" className="flex items-center whitespace-nowrap">
                  <span className="sm:hidden">Старт</span>
                  <span className="hidden sm:inline">Започнете безплатно</span>
                  <ArrowRight className="ml-1.5 h-3.5 w-3.5 sm:ml-2 sm:h-4 sm:w-4" />
                </Link>
              </Button>
            </motion.div>
          </div>
        </header>

        {/* ── Hero ── */}
        <section id="features" className="px-4 py-5 sm:py-10">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center">
              <HCard className="border border-border/50 bg-card shadow-md sm:shadow-xl">
                <HCardContent className="p-3.5 sm:p-6 md:p-8">
                  <div className="mb-5 flex justify-center sm:mb-6">
                    <Chip
                      variant="soft"
                      color="accent"
                      className="tiny-text max-w-full px-3 py-1"
                    >
                      <Sparkles className="mr-1.5 h-3.5 w-3.5 shrink-0" />
                      <span className="max-[359px]:hidden">
                        Ново: Автоматично генериране на НАП номера
                      </span>
                      <span className="hidden max-[359px]:inline">
                        Ново: НАП номера
                      </span>
                    </Chip>
                  </div>

                  <h1
                    className="hero-title mx-auto mb-3 max-w-[13ch] text-foreground sm:mb-4 sm:max-w-4xl"
                    style={{ textShadow: "0 6px 30px rgba(15, 23, 42, 0.24)" }}
                  >
                    <span className="block sm:inline">Фактурирайте </span>
                    <span className="gradient-primary-text block sm:inline">професионално</span>
                    <span className="block sm:inline"> за минути</span>
                  </h1>

                  <p className="lead-text mx-auto mb-5 max-w-2xl sm:mb-6">
                    Софтуер за издаване на фактури, създаден за български бизнеси.
                    Създавайте професионални фактури, изпращайте ги по имейл и следете статуса им.
                  </p>

                  <div className="mx-auto mb-5 flex w-full max-w-md flex-col items-stretch justify-center gap-2 sm:mb-8 sm:max-w-none sm:flex-row sm:gap-3">
                    <Button
                      size="sm"
                      asChild
                      className="h-11 w-full border-0 px-4 text-sm text-white shadow-md gradient-primary hover:opacity-90 sm:h-10 sm:w-auto sm:px-5 sm:shadow-lg"
                    >
                      <Link href="/signup" className="flex items-center justify-center whitespace-nowrap">
                        Започнете безплатно
                        <ChevronRight className="ml-1.5 h-3.5 w-3.5 sm:ml-2 sm:h-4 sm:w-4" />
                      </Link>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      asChild
                      className="h-11 w-full border-slate-300 px-4 text-sm dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 sm:h-10 sm:w-auto sm:px-5"
                    >
                      <Link href="/signin" className="flex items-center justify-center whitespace-nowrap">
                        Вече имам акаунт
                      </Link>
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-3 sm:gap-4">
                    {heroHighlights.map((stat) => (
                      <div
                        key={stat.label}
                        className="rounded-2xl border border-border/50 bg-background/60 px-4 py-4 shadow-xs"
                      >
                        <div className="metric-value gradient-primary-text">
                          {stat.value}
                        </div>
                        <div className="metric-label mt-1">
                          {stat.label}
                        </div>
                      </div>
                    ))}
                  </div>
                </HCardContent>
              </HCard>
            </div>
          </div>
        </section>

        {/* ── What we do (Какво прави Invoicy) ── */}
        <section className="px-4 py-5 sm:py-9">
          <div className="container mx-auto max-w-6xl">
            <div className="mb-4 text-center sm:mb-5">
              <Chip variant="soft" color="accent" className="mb-4">
                Какво прави {APP_NAME}
              </Chip>
              <h2 className="section-title mb-2 sm:mb-3">
                Всичко необходимо за професионално фактуриране на едно място
              </h2>
              <p className="lead-text mx-auto max-w-2xl">
                Създавайте фактури, кредитни и дебитни известия, управлявайте клиенти и фирми, изпращайте документи по имейл и следете статуси — в съответствие с българските изисквания.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 mb-6">
              {[
                { text: "Издаване на фактури с автоматично номериране и НАП-съвместими реквизити", icon: FileText },
                { text: "Управление на клиенти и компании с ЕИК/Булстат и данъчни полета", icon: Building },
                { text: "Кредитни и дебитни известия за сторниране и коригиране", icon: CreditCard },
                { text: "PDF и CSV експорт, изпращане на фактури по имейл (PRO/Business)", icon: Zap },
                { text: "Екип с роли — собственик, администратор, счетоводител, наблюдател", icon: Users },
                { text: "История на промените и аудит за всяка фактура", icon: Shield },
              ].map((item) => (
                <div
                  key={item.text}
                  className="flex items-start gap-3 rounded-2xl border border-border/60 bg-card/95 px-4 py-3.5 shadow-sm"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <p className="small-text font-medium text-foreground leading-snug pt-1.5">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 py-5 sm:py-9">
          <div className="container mx-auto max-w-6xl">
            <div className="mb-4 text-center sm:mb-5">
              <Chip variant="soft" color="default" className="mb-4">
                Основни акценти
              </Chip>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {quickHighlights.map((item) => (
                <HCard key={item.title} className="border border-border/50 bg-card shadow-xs sm:shadow-sm">
                  <HCardContent className="p-3.5 sm:p-5">
                    <p className="card-title mb-1.5">{item.title}</p>
                    <p className="card-description">{item.description}</p>
                  </HCardContent>
                </HCard>
              ))}
            </div>
          </div>
        </section>

        {/* ── Who Is It For ── */}
        <section className="px-4 py-5 sm:py-10">
          <div className="container mx-auto max-w-6xl">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <HCard className="border border-amber-400/30 bg-card shadow-md sm:border-2 sm:shadow-xl">
                <HCardContent className="relative overflow-hidden p-3.5 sm:p-6 md:p-8">
                  <div className="absolute left-1/2 top-0 h-28 w-40 -translate-x-1/2 rounded-full bg-amber-500/10 blur-3xl" />
                  <div className="relative text-center">
                    <div className="mb-4 flex justify-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br from-amber-500/95 to-orange-500/95 shadow-sm sm:h-16 sm:w-16 sm:rounded-2xl sm:shadow-lg sm:shadow-amber-500/25">
                        <FileText className="h-6 w-6 text-white sm:h-8 sm:w-8" />
                      </div>
                    </div>

                    <Chip variant="soft" color="warning" className="mb-4">
                      За кого е {APP_NAME}
                    </Chip>

                    <h2 className="section-title mb-2 sm:mb-3 md:text-3xl">
                      Създаден за реални бизнеси, не за сложни системи
                    </h2>
                    <p className="lead-text mx-auto mb-5 max-w-3xl sm:mb-6">
                      {APP_NAME} е система за <strong>издаване на фактури</strong>, а не за обработка
                      на плащания. Приложението е идеално за:
                    </p>

                    <div className="mb-5 grid grid-cols-1 gap-2.5 text-left sm:mb-6 sm:grid-cols-2 sm:gap-3">
                      {[
                        "Фрийлансъри и самонаети лица",
                        "Малки и средни предприятия",
                        "Счетоводители и счетоводни къщи",
                        "Консултанти и агенции",
                        "Занаятчии и услуги",
                        "Търговци и дистрибутори",
                      ].map((item) => (
                        <div
                          key={item}
                          className="flex items-center gap-3 rounded-2xl border border-border/60 bg-background/55 px-4 py-3 shadow-xs transition-colors hover:bg-background/75"
                        >
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/15">
                            <Check className="h-4 w-4 text-emerald-600" />
                          </div>
                          <span className="small-text font-medium text-foreground">{item}</span>
                        </div>
                      ))}
                    </div>

                    <div className="mx-auto max-w-3xl rounded-2xl border border-amber-400/30 bg-linear-to-br from-amber-500/10 via-amber-500/5 to-orange-500/10 p-4 text-left sm:p-5">
                      <div className="mb-2 flex justify-center sm:justify-start">
                        <Chip size="sm" color="warning" variant="outline">
                          Важно
                        </Chip>
                      </div>
                    <p className="small-text text-amber-800 dark:text-amber-200">{paymentMessage.short}</p>
                    <p className="small-text mt-2 text-amber-800 dark:text-amber-200">{paymentMessage.subscription}</p>
                    <p className="small-text mt-1 text-amber-800 dark:text-amber-200">{paymentMessage.clientInvoices}</p>
                    </div>
                  </div>
                </HCardContent>
              </HCard>
            </motion.div>
          </div>
        </section>

        <section className="px-4 py-5 sm:py-10">
          <div className="container mx-auto max-w-6xl">
            <div className="mb-5 text-center sm:mb-8">
              <Chip variant="soft" color="success" className="mb-4">
                По бизнес тип
              </Chip>
              <h2 className="marketing-title mb-2.5 sm:mb-4">Избери подход според твоя модел</h2>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              {caseBasedSegments.map((segment) => (
                <HCard key={segment.title} className="border border-border/50 bg-card shadow-sm">
                  <HCardContent className="p-4 sm:p-5">
                    <h3 className="card-title mb-3">{segment.title}</h3>
                    <ul className="mb-5 space-y-2">
                      {segment.points.map((point) => (
                        <li key={point} className="flex items-start gap-2">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                          <span className="card-description">{point}</span>
                        </li>
                      ))}
                    </ul>
                    <Button asChild variant="outline" className="w-full">
                      <Link href={segment.ctaHref}>{segment.ctaLabel}</Link>
                    </Button>
                  </HCardContent>
                </HCard>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 py-5 sm:py-10">
          <div className="container mx-auto max-w-6xl">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="mb-5 text-center sm:mb-8"
            >
              <Chip variant="soft" color="warning" className="mb-4">
                Как работи
              </Chip>
              <h2 className="marketing-title mb-2.5 sm:mb-4">
                Подреден процес без излишна сложност
              </h2>
              <p className="lead-text mx-auto max-w-2xl">
                Влизате, настройвате основните данни и започвате да издавате документи още в първия ден.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              {workflowSteps.map((step, index) => (
                <HCard key={step.title} className="border border-border/50 bg-card shadow-xs sm:shadow-sm">
                  <HCardContent className="p-3.5 sm:p-5">
                    <div className="mb-3 flex items-center justify-between sm:mb-4">
                      <div className={`flex h-9 w-9 items-center justify-center rounded-xl bg-linear-to-br ${step.color} shadow-xs sm:h-10 sm:w-10 sm:shadow-sm`}>
                        <step.icon className="h-4.5 w-4.5 text-white sm:h-5 sm:w-5" />
                      </div>
                      <Chip variant="soft" color="default" size="sm">
                        Стъпка {index + 1}
                      </Chip>
                    </div>
                    <h3 className="card-title mb-1.5">{step.title}</h3>
                    <p className="card-description">{step.description}</p>
                  </HCardContent>
                </HCard>
              ))}
            </div>
          </div>
        </section>

        {/* ── Features ── */}
        <section className="px-4 py-5 sm:py-10">
          <div className="container mx-auto max-w-6xl">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="mb-5 text-center sm:mb-8"
            >
              <Chip variant="soft" color="accent" className="mb-4">
                Функции
              </Chip>
              <h2 className="marketing-title mt-3 mb-2.5 sm:mb-4">
                Всичко необходимо за вашия бизнес
              </h2>
              <p className="lead-text mx-auto max-w-2xl">
                Пълен набор от инструменти за професионално фактуриране и
                управление на финансите
              </p>
            </motion.div>

            <div className="grid grid-cols-1 gap-3 md:hidden">
              {paginatedFeatures.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                >
                  <HCard
                    className="group h-full border border-border/50 bg-card shadow-xs transition-shadow duration-300 hover:shadow-md sm:shadow-sm sm:hover:shadow-lg"
                  >
                    <HCardContent className="p-3.5 sm:p-5">
                      <div
                        className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-linear-to-br ${feature.color} shadow-xs transition-transform duration-300 group-hover:scale-105 sm:mb-4 sm:h-10 sm:w-10 sm:shadow-sm`}
                      >
                        <feature.icon className="h-4.5 w-4.5 text-white sm:h-5 sm:w-5" />
                      </div>
                      <h3 className="card-title mb-1.5">
                        {feature.title}
                      </h3>
                      <p className="card-description">
                        {feature.description}
                      </p>
                    </HCardContent>
                  </HCard>
                </motion.div>
              ))}
            </div>
            <div className="mt-6 flex justify-center md:hidden">
              <Pagination
                currentPage={featurePage}
                totalPages={Math.ceil(features.length / featuresPerPage)}
                onPageChange={setFeaturePage}
                size="sm"
              />
            </div>
            <div className="hidden gap-4 md:grid md:grid-cols-2 xl:grid-cols-3">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.08 }}
                >
                  <HCard className="group h-full border border-border/50 bg-card shadow-sm transition-shadow duration-300 hover:shadow-lg">
                    <HCardContent className="p-5">
                      <div
                        className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br ${feature.color} shadow-sm transition-transform duration-300 group-hover:scale-105`}
                      >
                        <feature.icon className="h-5 w-5 text-white" />
                      </div>
                      <h3 className="card-title mb-2">{feature.title}</h3>
                      <p className="marketing-copy">
                        {feature.description}
                      </p>
                    </HCardContent>
                  </HCard>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Pricing ── */}
        <section id="pricing" className="px-4 py-5 sm:py-10">
          <div className="container mx-auto max-w-7xl">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="mb-5 text-center sm:mb-8"
            >
              <Chip variant="soft" color="success" className="mb-4">
                Ценообразуване
              </Chip>
              <h2 className="marketing-title mt-3 mb-2.5 sm:mb-4">
                Прозрачни цени без изненади
              </h2>
              <p className="lead-text mx-auto mb-5 max-w-2xl sm:mb-8">
                Изберете плана, който отговаря на нуждите на вашия бизнес
              </p>

              {/* Monthly / Yearly toggle */}
              <div className="inline-flex items-center gap-2 rounded-full border border-border/50 bg-muted/60 px-3 py-2 sm:gap-3 sm:px-5 sm:py-3">
                <span
                  className={cn(
                    "text-xs font-medium transition-colors sm:text-sm",
                    !isYearly ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  Месечно
                </span>
                <button
                  type="button"
                  onClick={() => setIsYearly(!isYearly)}
                  aria-label="Превключване към годишно ценообразуване"
                  className={cn(
                    "relative inline-flex h-5 w-10 items-center rounded-full transition-colors focus:outline-none sm:h-6 sm:w-11",
                    isYearly ? "bg-emerald-500" : "bg-muted-foreground/30"
                  )}
                >
                  <span
                    className={cn(
                      "inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform shadow sm:h-4 sm:w-4",
                      isYearly ? "translate-x-5 sm:translate-x-6" : "translate-x-1"
                    )}
                  />
                </button>
                <span
                  className={cn(
                    "flex items-center gap-1.5 text-xs font-medium transition-colors sm:gap-2 sm:text-sm",
                    isYearly ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  Годишно
                  <Chip
                    size="sm"
                    color="success"
                    variant="soft"
                    className="tiny-text h-5"
                  >
                    -17%
                  </Chip>
                </span>
              </div>
            </motion.div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
              {pricingPlans.map((plan, index) => {
                const PlanIcon = plan.icon;
                const monthlyPrice =
                  isYearly && plan.price.yearly > 0
                    ? plan.price.yearly / 12
                    : plan.price.monthly;

                return (
                  <motion.div
                    key={plan.key}
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.08 }}
                    className={cn(
                      "flex flex-col",
                      plan.popular && "xl:-mt-3 xl:mb-3"
                    )}
                  >
                    <HCard
                        className={cn(
                          "relative flex h-full flex-col overflow-hidden border bg-card",
                        plan.popular
                          ? "border-emerald-500/50 shadow-lg sm:shadow-2xl"
                            : "border-border/50 shadow-sm"
                      )}
                      style={
                        plan.popular
                          ? {
                              boxShadow: `0 12px 32px ${plan.glowColor}, 0 4px 12px rgba(0,0,0,0.08)`,
                            }
                          : undefined
                      }
                    >
                      {/* Gradient top bar */}
                      <div className={`h-1 w-full shrink-0 bg-linear-to-r ${plan.gradient}`} />

                      <HCardContent className="flex flex-1 flex-col p-3.5 sm:p-5">
                        {/* Header */}
                        <div className="mb-4 flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5 sm:gap-3">
                            <div
                              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-linear-to-br ${plan.gradient} shadow-xs sm:h-9 sm:w-9 sm:shadow-md`}
                            >
                              <PlanIcon className="h-4 w-4 text-white sm:h-4.5 sm:w-4.5" />
                            </div>
                            <div>
                              <p className="card-title">
                                {plan.name}
                              </p>
                              <p className="card-description">
                                {plan.description}
                              </p>
                            </div>
                          </div>
                          {plan.popular && (
                            <Chip size="sm" color="success" variant="soft" className="tiny-text shrink-0">
                              Популярен
                            </Chip>
                          )}
                        </div>

                        {/* Price */}
                        <div className="mb-5">
                          {plan.key === "FREE" ? (
                            <div className="flex items-baseline gap-1">
                              <span className="metric-value">0 €</span>
                              <span className="small-text text-muted-foreground">
                                /завинаги
                              </span>
                            </div>
                          ) : (
                            <div>
                              <div className="flex items-baseline gap-1">
                                <span className="metric-value">
                                  {monthlyPrice.toFixed(2)} €
                                </span>
                                <span className="small-text text-muted-foreground">
                                  /месец
                                </span>
                              </div>
                              {isYearly && (
                                <p className="tiny-text mt-0.5 font-medium text-emerald-600 dark:text-emerald-400">
                                  {plan.price.yearly} €/год. · 2 месеца
                                  безплатно
                                </p>
                              )}
                            </div>
                          )}
                        </div>

                        <Separator className="mb-4" />

                        {/* Features */}
                        <ul className="mb-5 flex-1 space-y-2">
                          {plan.features.map((feat) => (
                            <li
                              key={feat.text}
                              className="flex items-center gap-2.5"
                            >
                              {feat.included ? (
                                <div
                                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-linear-to-br ${plan.gradient}`}
                                >
                                  <Check className="h-2.5 w-2.5 text-white" />
                                </div>
                              ) : (
                                <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-muted">
                                  <X className="h-2.5 w-2.5 text-muted-foreground" />
                                </div>
                              )}
                              <span
                                className={cn(
                                  "card-description",
                                  !feat.included && "text-muted-foreground"
                                )}
                              >
                                {feat.text}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </HCardContent>

                      <HCardFooter className="px-3.5 pb-3.5 pt-0 sm:px-5 sm:pb-5">
                        <Button
                          asChild
                          className={cn(
                            "btn-text h-9 w-full sm:h-10",
                            plan.popular &&
                              "gradient-primary hover:opacity-90 text-white border-0"
                          )}
                          variant={plan.popular ? "default" : "outline"}
                        >
                          <Link href={plan.ctaHref} className="flex items-center justify-center whitespace-nowrap">
                            {plan.cta}
                          </Link>
                        </Button>
                      </HCardFooter>
                    </HCard>
                  </motion.div>
                );
              })}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mt-8 text-center sm:mt-10"
            >
              <p className="card-description mx-auto max-w-2xl">
                Всички планове включват софтуер за издаване на фактури. Не
                предлагаме обработка на плащания — вашите клиенти плащат
                директно на вас.
              </p>
              <p className="card-description mx-auto mt-2 max-w-2xl">
                Всички цени са в EUR. Таксуването е за избрания период (месец
                или година), а планът може да се промени при растеж на екипа.
              </p>
            </motion.div>
            <div className="mt-5 grid grid-cols-1 gap-2 sm:mt-6 sm:grid-cols-2 lg:grid-cols-4">
              {pricingTrustNotes.map((note) => (
                <div
                  key={note}
                  className="flex items-center gap-2 rounded-xl border border-border/60 bg-card/80 px-3 py-2.5"
                >
                  <Check className="h-4 w-4 shrink-0 text-emerald-600" />
                  <span className="small-text text-foreground">{note}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Testimonials ── */}
        <section id="faq" className="px-4 py-5 sm:py-10">
          <div className="container mx-auto max-w-6xl">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="mb-5 text-center sm:mb-8"
            >
              <Chip variant="soft" color="warning" className="mb-4">
                Отзиви
              </Chip>
              <h2 className="marketing-title mt-3 mb-2.5 sm:mb-4">
                Реални бизнес сценарии
              </h2>
              <p className="lead-text mx-auto max-w-2xl">
                Типични резултати, които бизнесите търсят при внедряване на {APP_NAME}
              </p>
            </motion.div>

            <div className="grid grid-cols-1 gap-3 md:hidden">
              {paginatedTestimonials.map((testimonial, index) => (
                <motion.div
                  key={testimonial.name}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                >
                  <HCard
                    className="relative h-full overflow-hidden border border-border/50 bg-card shadow-xs transition-shadow duration-300 hover:shadow-md sm:shadow-sm sm:hover:shadow-lg"
                  >
                    <div
                      className={`absolute top-0 left-0 right-0 h-[3px] bg-linear-to-r ${testimonial.gradient}`}
                    />
                    <HCardContent className="p-3.5 sm:p-5">
                      <div className="mb-3 sm:mb-4">
                        <svg
                          className="h-8 w-8 text-emerald-500/20 sm:h-10 sm:w-10"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                        </svg>
                      </div>
                      <p className="marketing-copy mb-4 text-foreground/90 sm:mb-6">
                        &ldquo;{testimonial.content}&rdquo;
                      </p>
                      <div className="flex items-center gap-3 border-t border-border/50 pt-4">
                        <div
                          className={cn(
                            "flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-linear-to-br text-xs font-bold text-white sm:h-10 sm:w-10 sm:text-sm",
                            testimonial.gradient
                          )}
                        >
                          {testimonial.initials}
                        </div>
                        <div>
                          <div className="card-title text-foreground">
                            {testimonial.name}
                          </div>
                          <div className="card-description">
                            {testimonial.role}
                          </div>
                        </div>
                      </div>
                    </HCardContent>
                  </HCard>
                </motion.div>
              ))}
            </div>
            <div className="mt-6 flex justify-center md:hidden">
              <Pagination
                currentPage={testimonialPage}
                totalPages={Math.ceil(testimonials.length / testimonialsPerPage)}
                onPageChange={setTestimonialPage}
                size="sm"
              />
            </div>
            <div className="hidden gap-4 md:grid md:grid-cols-2 xl:grid-cols-3">
              {testimonials.map((testimonial, index) => (
                <motion.div
                  key={testimonial.name}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.08 }}
                >
                  <HCard className="relative h-full overflow-hidden border border-border/50 bg-card shadow-sm transition-shadow duration-300 hover:shadow-lg">
                    <div
                      className={`absolute left-0 right-0 top-0 h-[3px] bg-linear-to-r ${testimonial.gradient}`}
                    />
                    <HCardContent className="p-5">
                      <div className="mb-4">
                        <svg
                          className="h-10 w-10 text-emerald-500/20"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                        </svg>
                      </div>
                      <p className="marketing-copy mb-6 text-foreground/90">
                        &ldquo;{testimonial.content}&rdquo;
                      </p>
                      <div className="flex items-center gap-3 border-t border-border/50 pt-4">
                        <div
                          className={cn(
                            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-linear-to-br text-sm font-bold text-white",
                            testimonial.gradient
                          )}
                        >
                          {testimonial.initials}
                        </div>
                        <div>
                          <div className="card-title text-foreground">
                            {testimonial.name}
                          </div>
                          <div className="card-description">
                            {testimonial.role}
                          </div>
                        </div>
                      </div>
                    </HCardContent>
                  </HCard>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="px-4 py-5 sm:py-10">
          <div className="container mx-auto max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="mb-5 text-center sm:mb-8"
            >
              <Chip variant="soft" color="default" className="mb-4">
                Въпроси
              </Chip>
              <h2 className="marketing-title mt-3 mb-2.5 sm:mb-4">
                Често задавани въпроси
              </h2>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="space-y-2.5 sm:space-y-4"
            >
              {faqItems.map((faq, index) => (
                <motion.div
                  key={faq.q}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.07 }}
                >
                  <HCard className="border border-border/50 bg-card shadow-xs transition-shadow hover:shadow-sm sm:shadow-sm sm:hover:shadow-md">
                    <HCardContent className="p-3.5 sm:p-5">
                      <h3 className="card-title mb-1.5 flex items-center gap-2">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
                          {index + 1}
                        </span>
                        {faq.q}
                      </h3>
                      <p className="card-description pl-7">
                        {faq.a}
                      </p>
                    </HCardContent>
                  </HCard>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="px-4 py-6 sm:py-10">
          <div className="container mx-auto max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <HCard className="relative overflow-hidden border border-emerald-500/20 bg-card shadow-md sm:border-2 sm:shadow-2xl">
                {/* Decorative gradient background */}
                <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-emerald-500/3 via-teal-500/3 to-cyan-500/3 sm:from-emerald-500/5 sm:via-teal-500/5 sm:to-cyan-500/5" />
                <div className="absolute top-0 left-0 right-0 h-[3px] bg-linear-to-r from-emerald-500 via-teal-500 to-cyan-500 sm:h-1" />
                <HCardContent className="relative z-10 p-4 text-center sm:p-8 md:p-10">
                  <h2 className="marketing-title mb-2 sm:mb-4">
                    Готови ли сте да започнете?
                  </h2>
                  <p className="lead-text mx-auto mb-5 max-w-md sm:mb-8 sm:max-w-xl">
                    Започнете с безплатен план и преминете към платен, когато
                    обемът на документите ви нарасне.
                  </p>
                  <div className="mx-auto flex w-full max-w-xs flex-col justify-center gap-3 sm:max-w-none sm:flex-row sm:gap-4">
                    <Button
                      size="default"
                      asChild
                      className="h-11 w-full px-4 text-sm gradient-primary text-white border-0 shadow-md hover:opacity-90 sm:h-11 sm:w-auto sm:px-6 sm:shadow-lg"
                    >
                      <Link
                        href="/signup"
                        className="flex items-center justify-center whitespace-nowrap"
                      >
                        Започнете безплатно
                        <ArrowRight className="ml-1.5 h-4 w-4 sm:ml-2 sm:h-5 sm:w-5" />
                      </Link>
                    </Button>
                    <Button
                      size="default"
                      variant="outline"
                      asChild
                      className="h-11 w-full px-4 text-sm sm:h-11 sm:w-auto sm:px-6"
                    >
                      <Link
                        href="/signin"
                        className="flex items-center justify-center whitespace-nowrap"
                      >
                        Вход в системата
                      </Link>
                    </Button>
                  </div>
                </HCardContent>
              </HCard>
            </motion.div>
          </div>
        </section>

        <div className="fixed inset-x-3 bottom-3 z-40 sm:hidden">
          <div className="rounded-2xl border border-border/70 bg-background/95 p-2 shadow-lg backdrop-blur">
            <Button asChild className="h-11 w-full gradient-primary text-white border-0">
              <Link href="/signup" className="flex items-center justify-center">
                Започнете безплатно
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>

        {/* ── Footer ── */}
        <footer className="mt-auto border-t border-x-0 border-b-0 px-4 py-6 rounded-none glass-card sm:py-10">
          <div className="container mx-auto max-w-6xl">
            <div className="mb-6 grid grid-cols-1 gap-6 md:mb-10 md:grid-cols-4 md:gap-10">
              <div>
                <div className="mb-3 flex items-center gap-2 sm:mb-4">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg gradient-primary shadow-md sm:h-8 sm:w-8">
                    <FileText className="h-4 w-4 text-white sm:h-5 sm:w-5" aria-hidden />
                  </div>
                  <span className="section-title">{APP_NAME}</span>
                </div>
                <p className="card-description">
                  Софтуер за издаване на фактури за български бизнеси. Не
                  обработваме плащания.
                </p>
                <div className="mt-4 space-y-1 text-xs text-muted-foreground">
                  <p>{publicBusinessProfile.supportEmail}</p>
                  {shouldShowPublicLegalField(publicBusinessProfile.legalCompanyName) ? (
                    <p>{publicBusinessProfile.legalCompanyName}</p>
                  ) : null}
                  {shouldShowPublicLegalField(publicBusinessProfile.legalCompanyId) ? (
                    <p>ЕИК: {publicBusinessProfile.legalCompanyId}</p>
                  ) : null}
                  {shouldShowPublicLegalField(publicBusinessProfile.legalVatId) ? (
                    <p>ДДС №: {publicBusinessProfile.legalVatId}</p>
                  ) : null}
                </div>
              </div>
              <div>
                <h4 className="marketing-kicker mb-3 sm:mb-4">Продукт</h4>
                <ul className="space-y-2.5 small-text sm:space-y-3">
                  <li>
                    <Link
                      href="/features"
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Функции
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="#pricing"
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Ценообразуване
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/integrations"
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Интеграции
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/api"
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      API
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="marketing-kicker mb-3 sm:mb-4">Компания</h4>
                <ul className="space-y-2.5 small-text sm:space-y-3">
                  <li>
                    <Link
                      href="/about"
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      За нас
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/blog"
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Блог
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/contact"
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Контакти
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="marketing-kicker mb-3 sm:mb-4">Правна информация</h4>
                <ul className="space-y-2.5 small-text sm:space-y-3">
                  <li>
                    <Link
                      href="/terms"
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Условия за ползване
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/privacy"
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Политика за поверителност
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/cookies"
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Бисквитки
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/gdpr"
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      GDPR
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
            <div className="flex flex-col items-center justify-between gap-3 border-t pt-6 sm:flex-row sm:gap-4 sm:pt-8">
              <p className="text-center text-xs text-muted-foreground sm:text-left sm:text-sm">
                © {new Date().getFullYear()} {APP_NAME}. Всички права запазени.
              </p>
              <div className="flex items-center gap-3 sm:gap-4">
                {publicBusinessProfile.facebookUrl ? (
                  <Link
                    href={publicBusinessProfile.facebookUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="Facebook"
                  >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                  </Link>
                ) : null}
                {publicBusinessProfile.xUrl ? (
                  <Link
                    href={publicBusinessProfile.xUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="X"
                  >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                  </svg>
                  </Link>
                ) : null}
                {publicBusinessProfile.linkedinUrl ? (
                  <Link
                    href={publicBusinessProfile.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="LinkedIn"
                  >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                  </Link>
                ) : null}
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}

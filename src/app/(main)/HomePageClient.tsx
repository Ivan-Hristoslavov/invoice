"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ChevronRight,
  Check,
  X,
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
  Menu,
  Mail,
  CircleAlert,
  Percent,
} from "lucide-react";
import { Chip } from "@heroui/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { APP_NAME } from "@/config/constants";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { BackgroundShapes } from "@/components/ui/background-shapes";
import { shouldReduceBrowserEffects } from "@/lib/browser-effects";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuItemIcon,
  DropdownMenuItemText,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SUBSCRIPTION_PLANS } from "@/lib/subscription-plans";
import {
  paymentMessage,
  publicBusinessProfile,
  shouldShowPublicLegalField,
} from "@/config/public-business";
import { PRICING_CARD_SURFACE } from "@/lib/pricing-card-surfaces";

/**
 * Якорни линкове: `/#id` (не само `#id`), за да не се трупат фрагменти в Next.js.
 * По-малко линкове от секции — `data-landing-spy` групира няколко блока под един таб.
 */
const LANDING_NAV = [
  { href: "/#top", label: "Начало", spy: "top" },
  { href: "/#product", label: "Продукт", spy: "product" },
  { href: "/#pricing", label: "Цени", spy: "pricing" },
  { href: "/#contact", label: "Контакт", spy: "contact" },
] as const;

type LandingNavSpy = (typeof LANDING_NAV)[number]["spy"];

function landingNavLinkVisual(isActive: boolean) {
  return cn(
    "shrink-0 rounded-full px-2 py-1 text-xs font-medium outline-none transition-[color,background-color,box-shadow] duration-200 sm:px-2.5 sm:py-1.5 sm:text-sm",
    "focus-visible:ring-2 focus-visible:ring-emerald-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    isActive
      ? "bg-emerald-600 text-white shadow-sm dark:bg-emerald-500 dark:text-white"
      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
  );
}

const LANDING_SCROLL_MARGIN = "scroll-mt-28 sm:scroll-mt-32";

/** Секции без тежки рамки — само вертикален ритъм и контейнер. */
const LANDING_ZONE_OUTER = "px-4 py-8 sm:py-10";
const LANDING_ZONE_PANEL = "rounded-2xl border border-border/40 bg-card/70 shadow-sm dark:bg-card/40";
const LANDING_ZONE_LABEL =
  "text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400";

type PlanKey = "FREE" | "STARTER" | "PRO" | "BUSINESS";

interface PricingPlan {
  key: PlanKey;
  name: string;
  price: { monthly: number; yearly: number };
  description: string;
  icon: React.ElementType;
  gradient: string;
  popular?: boolean;
  features: { text: string; included: boolean }[];
  cta: string;
  ctaHref: string;
}

const features = [
  {
    icon: FileText,
    title: "Фактури и PDF",
    description: "Шаблони, номерация и PDF без объркване.",
    color: "from-blue-500 to-cyan-500",
  },
  {
    icon: Zap,
    title: "Бърз старт",
    description: "Данните веднъж — после само избор от списъци.",
    color: "from-amber-500 to-orange-500",
  },
  {
    icon: Shield,
    title: "Реквизити за България",
    description: "ЕИК, ДДС и текстове за счетоводство и НАП.",
    color: "from-emerald-500 to-teal-500",
  },
  {
    icon: BarChart3,
    title: "Преглед в цифри",
    description: "Приходи и фактури в изчакване.",
    color: "from-violet-500 to-purple-500",
  },
  {
    icon: Users,
    title: "Клиенти на едно място",
    description: "Списък, история и търсене.",
    color: "from-rose-500 to-pink-500",
  },
  {
    icon: Building,
    title: "Няколко фирми",
    description: "Един акаунт, отделни настройки за всяка фирма.",
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
] as const;

const workflowSteps = [
  {
    title: "Фирма и клиенти",
    description: "Въвеждате данните веднъж — после само избирате от списъка.",
    icon: Building,
    color: "from-slate-500 to-slate-600",
  },
  {
    title: "Нова фактура",
    description: "Клиент, редове, ДДС — готово за изпращане, PDF или имейл.",
    icon: FileText,
    color: "from-blue-500 to-indigo-600",
  },
  {
    title: "Статус и история",
    description: "Платени, чакащи и корекции с известия.",
    icon: BarChart3,
    color: "from-emerald-500 to-teal-600",
  },
] as const;

const heroHighlights = [
  { value: "EUR", label: "Цени в евро" },
  { value: "BG", label: "За българския пазар" },
  { value: "Stripe", label: "Абонамент през Stripe" },
] as const;

const pricingTrustNotes = [
  "Без дългосрочен договор",
  "Смяна на план според нуждите",
  "Отказ по всяко време от настройките",
  "Поддръжка по имейл в работни дни",
] as const;

const faqItems = [
  {
    q: "Какво е Invoicy и за какво служи?",
    a: "Уеб приложение за фактури: издавате документи, изпращате ги и следите кой още не е платил. Не е банка и не приема плащания вместо вас.",
  },
  {
    q: "Клиентът плаща през Invoicy ли?",
    a: "Не. Плащанията са между вас и клиента (банка, наложен платеж и т.н.). Invoicy е за документите и проследяването им.",
  },
  {
    q: "Какво е кредитно известие?",
    a: "Документ за намаляване или отмяна на сума от вече издадена фактура — например при връщане на стока или грешка в сумата.",
  },
  {
    q: "Подходящо ли е за НАП?",
    a: "Фактурите са с нужните реквизити по българското законодателство. За конкретен случай винаги може да се консултирате със счетоводител.",
  },
  {
    q: "Няколко фирми в един акаунт?",
    a: "Да — според плана може да имате от една до повече фирми под един вход.",
  },
] as const;

const LANDING_HEADER_SCROLL_COMPACT = 48;

export default function HomePage() {
  const [isYearly, setIsYearly] = useState(false);
  const [shouldReduceEffects, setShouldReduceEffects] = useState(false);
  const [isHeaderCompact, setIsHeaderCompact] = useState(false);
  const [activeLandingSpy, setActiveLandingSpy] = useState<LandingNavSpy>("top");

  useEffect(() => {
    const updateEffects = () => {
      setShouldReduceEffects(shouldReduceBrowserEffects());
    };

    updateEffects();
    window.addEventListener("resize", updateEffects);
    return () => window.removeEventListener("resize", updateEffects);
  }, []);

  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY ?? document.documentElement.scrollTop ?? 0;
        setIsHeaderCompact(y > LANDING_HEADER_SCROLL_COMPACT);
        ticking = false;
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const spySelector = "[data-landing-spy]";

    function readSpyFromHash(): LandingNavSpy | null {
      const raw = window.location.hash.replace(/^#/, "");
      if (!raw) return null;
      const match = LANDING_NAV.find((item) => item.href === `/#${raw}`);
      return match ? match.spy : null;
    }

    function updateActiveFromScroll() {
      const header = document.querySelector("header");
      const headerH = header?.getBoundingClientRect().height ?? 64;
      const y = window.scrollY + headerH + 16;
      const nodes = document.querySelectorAll<HTMLElement>(spySelector);
      let next: LandingNavSpy = "top";
      for (const el of nodes) {
        const spy = el.dataset.landingSpy as LandingNavSpy | undefined;
        if (!spy) continue;
        const top = el.getBoundingClientRect().top + window.scrollY;
        if (top <= y) next = spy;
      }
      setActiveLandingSpy((prev) => (prev === next ? prev : next));
    }

    function syncFromHash() {
      const fromHash = readSpyFromHash();
      if (fromHash) setActiveLandingSpy(fromHash);
      else updateActiveFromScroll();
    }

    syncFromHash();
    requestAnimationFrame(updateActiveFromScroll);

    window.addEventListener("scroll", updateActiveFromScroll, { passive: true });
    window.addEventListener("hashchange", syncFromHash);
    window.addEventListener("resize", updateActiveFromScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", updateActiveFromScroll);
      window.removeEventListener("hashchange", syncFromHash);
      window.removeEventListener("resize", updateActiveFromScroll);
    };
  }, []);

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
              "Фактури и известия за български фирми — ясни реквизити и проследяване на документи",
            url: process.env.NEXT_PUBLIC_APP_URL || "https://invoicy.bg",
            inLanguage: "bg-BG",
          }),
        }}
      />

      <div className="flex min-h-screen flex-col overflow-x-hidden pb-24 sm:pb-0">
        <BackgroundShapes variant="subtle" reduceEffects />

        {/* ── Header: fixed + компактен режим при скрол ── */}
        <header
          className={cn(
            "fixed inset-x-0 top-0 z-50 w-full rounded-none border-x-0 border-t-0 glass-card supports-backdrop-filter:bg-background/80",
            shouldReduceEffects
              ? "transition-none"
              : "transition-[box-shadow,background-color,border-color,backdrop-filter] duration-300 ease-out",
            isHeaderCompact
              ? "border-b border-border/70 bg-card/95 shadow-lg shadow-black/5 backdrop-blur-md dark:border-border/80 dark:bg-card/90 dark:shadow-black/20"
              : "border-b border-transparent shadow-sm"
          )}
        >
          <div
            className={cn(
              "container mx-auto flex min-w-0 max-w-full items-center justify-between gap-2 px-3 sm:gap-3 sm:px-4 md:px-6",
              shouldReduceEffects ? "" : "transition-[min-height,gap] duration-300 ease-out",
              isHeaderCompact ? "min-h-11 py-1 sm:min-h-12" : "min-h-14 py-0 sm:min-h-16"
            )}
          >
            <motion.div
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex min-w-0 shrink-0 items-center gap-1.5 sm:gap-2"
            >
              <DropdownMenu>
                <DropdownMenuTrigger
                  className={cn(
                    "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg md:hidden",
                    "text-muted-foreground outline-none transition-colors",
                    "hover:bg-accent hover:text-accent-foreground",
                    "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  )}
                  aria-label="Отвори навигацията"
                >
                  <Menu className="h-5 w-5" aria-hidden />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="min-w-48">
                  {LANDING_NAV.map((item) => (
                    <DropdownMenuItem key={item.spy} asChild>
                      <Link
                        href={item.href}
                        scroll
                        className={cn(
                          "w-full cursor-pointer",
                          landingNavLinkVisual(activeLandingSpy === item.spy)
                        )}
                        aria-current={activeLandingSpy === item.spy ? "page" : undefined}
                        onClick={() => setActiveLandingSpy(item.spy)}
                      >
                        <DropdownMenuItemIcon>
                          <span className="block size-4" aria-hidden />
                        </DropdownMenuItemIcon>
                        <DropdownMenuItemText>{item.label}</DropdownMenuItemText>
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <Link
                href="/#top"
                className={cn(
                  "flex min-w-0 items-center gap-1.5 rounded-lg outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring sm:gap-2",
                  !shouldReduceEffects && "transition-[gap] duration-300 ease-out"
                )}
                aria-label="Към началото на страницата"
              >
                <span
                  className={cn(
                    "flex shrink-0 items-center justify-center overflow-hidden rounded-lg gradient-primary shadow-md transition-[width,height,border-radius] duration-300 ease-out",
                    isHeaderCompact ? "h-6 w-6 rounded-md sm:h-7 sm:w-7" : "h-7 w-7 sm:h-8 sm:w-8"
                  )}
                >
                  <FileText
                    className={cn(
                      "text-white transition-[width,height] duration-300 ease-out",
                      isHeaderCompact ? "h-3.5 w-3.5 sm:h-4 sm:w-4" : "h-4 w-4 sm:h-5 sm:w-5"
                    )}
                    aria-hidden
                  />
                </span>
                <span
                  className={cn(
                    "truncate font-bold tracking-tight transition-[font-size] duration-300 ease-out",
                    isHeaderCompact ? "text-sm sm:text-lg" : "text-base sm:text-xl"
                  )}
                >
                  {APP_NAME}
                </span>
              </Link>
            </motion.div>

            <nav
              className={cn(
                "mx-1 hidden min-h-0 min-w-0 max-w-full flex-1 items-center justify-center overflow-x-auto text-muted-foreground [scrollbar-width:none] md:flex [&::-webkit-scrollbar]:hidden",
                "transition-[gap] duration-300 ease-out",
                isHeaderCompact ? "gap-1 lg:gap-2" : "gap-1.5 lg:gap-3 xl:gap-4"
              )}
              aria-label="Секции на страницата"
            >
              {LANDING_NAV.map((item) => {
                const isActive = activeLandingSpy === item.spy;
                return (
                  <Link
                    key={item.spy}
                    href={item.href}
                    scroll
                    className={cn("whitespace-nowrap", landingNavLinkVisual(isActive))}
                    aria-current={isActive ? "page" : undefined}
                    onClick={() => setActiveLandingSpy(item.spy)}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <motion.div
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              className={cn(
                "flex shrink-0 items-center justify-end transition-[gap] duration-300 ease-out",
                isHeaderCompact ? "gap-1" : "gap-1 sm:gap-1.5"
              )}
            >
              <div className="shrink-0">
                <ThemeToggle />
              </div>
              <Button
                variant="outline"
                size="sm"
                asChild
                className={cn(
                  "hidden h-9 shrink-0 border border-border/70 bg-background/90 px-2.5 text-xs font-semibold shadow-sm hover:bg-muted/60 md:inline-flex",
                  isHeaderCompact && "h-8 px-2 text-[11px]"
                )}
              >
                <Link href="/signin" className="whitespace-nowrap">
                  Вход
                </Link>
              </Button>
              <Button
                size="sm"
                asChild
                className={cn(
                  "gradient-primary h-9 shrink-0 border-0 px-2.5 text-xs font-semibold text-white shadow-md hover:opacity-90 sm:px-3",
                  "transition-[height,padding] duration-300 ease-out",
                  isHeaderCompact && "h-8 px-2 text-[11px]"
                )}
              >
                <Link href="/signup" className="flex items-center justify-center whitespace-nowrap">
                  <span className="md:hidden">Старт</span>
                  <span className="hidden md:inline xl:hidden">Започнете</span>
                  <span className="hidden xl:inline">
                    {isHeaderCompact ? "Започнете" : "Започнете безплатно"}
                  </span>
                  <ArrowRight
                    className={cn(
                      "ml-0.5 h-3.5 w-3.5 shrink-0 sm:ml-1 sm:h-4 sm:w-4",
                      isHeaderCompact && "ml-0.5 h-3 w-3"
                    )}
                    aria-hidden
                  />
                </Link>
              </Button>
            </motion.div>
          </div>
        </header>
        {/* Отстъп = височина на header (синхрон с компактен режим) */}
        <div
          className={cn(
            "shrink-0 transition-[height] duration-300 ease-out",
            shouldReduceEffects && "transition-none",
            isHeaderCompact ? "h-11 sm:h-12" : "h-14 sm:h-16"
          )}
          aria-hidden
        />

        {/* ── Hero ── */}
        <section
          id="top"
          data-landing-spy="top"
          className={cn(LANDING_SCROLL_MARGIN, "bg-background px-4 py-8 sm:py-10")}
        >
          <div className="container mx-auto max-w-6xl">
            <div className="mx-auto max-w-3xl px-1 text-center sm:px-4">
              <p className={LANDING_ZONE_LABEL}>Начало</p>
              <h1
                className="hero-title mx-auto mt-3 mb-3 max-w-[13ch] text-foreground sm:mb-4 sm:max-w-4xl"
                style={{ textShadow: "0 6px 30px rgba(15, 23, 42, 0.24)" }}
              >
                <span className="block sm:inline">Фактурирайте </span>
                <span className="gradient-primary-text block sm:inline">професионално</span>
                <span className="block sm:inline"> за минути</span>
              </h1>
              <p className="card-description mx-auto mb-6 max-w-xl text-base sm:text-lg">
                Фактури и известия за България. Без плащания през нас — само документи и проследяване.
              </p>
              <div className="mx-auto mb-8 grid w-full max-w-lg grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                <Button
                  size="sm"
                  asChild
                  className="h-12 w-full border-0 px-5 text-sm font-semibold text-white shadow-lg gradient-primary hover:opacity-90 sm:h-12"
                >
                  <Link href="/signup" className="flex items-center justify-center whitespace-nowrap">
                    Започнете безплатно
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  asChild
                  className="h-12 w-full border-2 border-border/80 bg-background/60 px-5 text-sm font-semibold shadow-sm backdrop-blur-sm hover:bg-muted/70 dark:border-border/60"
                >
                  <Link href="/signin" className="flex items-center justify-center whitespace-nowrap">
                    Вход
                  </Link>
                </Button>
              </div>
              <div className="mx-auto mt-2 grid max-w-lg grid-cols-3 gap-2 sm:max-w-xl sm:gap-3">
                {heroHighlights.map((stat) => (
                  <div key={stat.label} className="rounded-xl bg-muted/40 px-2 py-2.5 sm:px-3 sm:py-3">
                    <div className="text-sm font-semibold text-foreground sm:text-base">{stat.value}</div>
                    <div className="metric-label mt-0.5 text-[11px] sm:text-xs">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section
          id="product"
          data-landing-spy="product"
          className={cn(LANDING_SCROLL_MARGIN, LANDING_ZONE_OUTER, "bg-muted/15 dark:bg-muted/5")}
        >
          <div className="container mx-auto max-w-6xl">
            <div className={cn(LANDING_ZONE_PANEL, "p-5 sm:p-8 md:p-10")}>
              <header className="pb-6 text-center sm:pb-8">
                <p className={LANDING_ZONE_LABEL}>Продукт</p>
                <h2 className="section-title mt-3">Какво прави {APP_NAME}</h2>
                <p className="card-description mx-auto mt-3 max-w-lg">
                  Всичко за ежедневна работа с фактури и известия.
                </p>
              </header>

              <div className="mt-8 space-y-10 sm:mt-10 sm:space-y-12">
                <div>
                  <h3 className="card-title mb-4 text-center sm:text-left">Възможности</h3>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {features.map((feature) => (
                      <Card
                        key={feature.title}
                        className="border-0 bg-transparent shadow-none ring-1 ring-border/50 dark:ring-border/40"
                      >
                        <CardContent className="flex gap-3 p-3 sm:p-4">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <feature.icon className="h-4 w-4" aria-hidden />
                          </div>
                          <div className="min-w-0">
                            <p className="card-title mb-1">{feature.title}</p>
                            <p className="card-description">{feature.description}</p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="card-title mb-4 text-center sm:text-left">За кого</h3>
                  <Card className="border border-amber-400/35 bg-card">
                    <CardContent className="space-y-4 p-4 sm:p-5">
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-2.5">
                        {[
                          "Фрийлансъри и МСП",
                          "Счетоводни къщи",
                          "Консултанти и агенции",
                          "Търговия и услуги",
                        ].map((item) => (
                          <div
                            key={item}
                            className="flex items-center gap-2 rounded-lg border border-border/50 bg-muted/20 px-3 py-2"
                          >
                            <Check className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
                            <span className="small-text font-medium">{item}</span>
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2 rounded-lg border border-amber-400/30 bg-amber-500/10 p-3 dark:bg-amber-500/5">
                        <CircleAlert
                          className="mt-0.5 h-4 w-4 shrink-0 text-amber-700 dark:text-amber-300"
                          aria-hidden
                        />
                        <p className="small-text leading-relaxed text-amber-950 dark:text-amber-100">
                          {paymentMessage.short} {paymentMessage.subscription}{" "}
                          {paymentMessage.clientInvoices}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div>
                  <h3 className="card-title mb-4 text-center sm:text-left">Три стъпки</h3>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    {workflowSteps.map((step, index) => (
                      <Card
                        key={step.title}
                        className="border-0 bg-transparent shadow-none ring-1 ring-border/50 dark:ring-border/40"
                      >
                        <CardContent className="p-3 sm:p-4">
                          <div className="mb-2 flex items-center gap-2.5">
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
                              {index + 1}
                            </span>
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                              <step.icon className="h-4 w-4" aria-hidden />
                            </div>
                          </div>
                          <p className="card-title mb-1">{step.title}</p>
                          <p className="card-description">{step.description}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          id="pricing"
          data-landing-spy="pricing"
          className={cn(
            LANDING_SCROLL_MARGIN,
            LANDING_ZONE_OUTER,
            "relative bg-background pricing-dot-bg"
          )}
        >
          <div className="container relative z-[1] mx-auto max-w-7xl">
            <div
              className={cn(
                LANDING_ZONE_PANEL,
                "rounded-3xl border-border/30 bg-card/50 p-5 shadow-xl backdrop-blur-md dark:bg-card/35 sm:p-8"
              )}
            >
              <div className="mb-6 text-center sm:mb-8">
                <p className={LANDING_ZONE_LABEL}>Цени</p>
                <h2 className="section-title mt-3">Планове</h2>
                <p className="card-description mx-auto mt-2 max-w-md">
                  Месечно или годишно · EUR · без скрити такси за софтуера
                </p>
              <div className="mt-5 inline-flex items-center gap-3 rounded-full border border-border/40 bg-muted/40 px-4 py-2.5 shadow-inner backdrop-blur-sm sm:gap-4 sm:px-6 sm:py-3">
                <span
                  className={cn(
                    "text-xs font-semibold transition-colors sm:text-sm",
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
                    "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:h-7 sm:w-12",
                    isYearly
                      ? "bg-gradient-to-r from-emerald-500 to-cyan-500 shadow-[0_0_20px_-4px_rgba(16,185,129,0.55)]"
                      : "bg-muted-foreground/35"
                  )}
                >
                  <span
                    className={cn(
                      "inline-block h-4 w-4 rounded-full bg-white shadow-md transition-transform sm:h-[18px] sm:w-[18px]",
                      isYearly ? "translate-x-6 sm:translate-x-[1.35rem]" : "translate-x-1"
                    )}
                  />
                </button>
                <span
                  className={cn(
                    "flex items-center gap-1.5 text-xs font-semibold transition-colors sm:gap-2 sm:text-sm",
                    isYearly ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  Годишно
                  <Chip size="sm" color="success" variant="soft" className="tiny-text h-5 gap-1 px-2">
                    <Percent className="h-3 w-3 shrink-0" aria-hidden />
                    -17%
                  </Chip>
                </span>
              </div>
              </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              {pricingPlans.map((plan, index) => {
                const PlanIcon = plan.icon;
                const monthlyPrice =
                  isYearly && plan.price.yearly > 0
                    ? plan.price.yearly / 12
                    : plan.price.monthly;

                const cardBody = (
                  <>
                    <CardContent className="relative z-1 flex flex-1 flex-col overflow-hidden p-4 sm:p-6">
                      {plan.popular ? (
                        <div
                          className="pointer-events-none absolute inset-x-0 top-0 h-28 rounded-t-[1.4375rem] bg-linear-to-b from-white/10 to-transparent dark:from-white/5"
                          aria-hidden
                        />
                      ) : null}

                      {/* Header: икона = цветен акцент вместо лента отгоре */}
                      <div className="relative mb-5 flex gap-3 sm:gap-3.5">
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br ${plan.gradient} shadow-md ring-1 ring-white/15 sm:h-11 sm:w-11`}
                        >
                          <PlanIcon className="h-5 w-5 text-white sm:h-5 sm:w-5" />
                        </div>
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="card-title truncate">{plan.name}</p>
                            {plan.popular ? (
                              <Chip
                                size="sm"
                                color="success"
                                variant="soft"
                                className="tiny-text shrink-0 gap-1"
                              >
                                <Star className="h-3 w-3 shrink-0 fill-current" aria-hidden />
                                Популярен
                              </Chip>
                            ) : null}
                          </div>
                          <p
                            className="card-description truncate text-xs leading-tight sm:text-sm"
                            title={plan.description}
                          >
                            {plan.description}
                          </p>
                        </div>
                      </div>

                      {/* Price */}
                      <div className="relative mb-1">
                        {plan.key === "FREE" ? (
                          <div className="flex items-baseline gap-1">
                            <span className="metric-value">0 €</span>
                            <span className="small-text text-muted-foreground">/завинаги</span>
                          </div>
                        ) : (
                          <div>
                            <div className="flex items-baseline gap-1">
                              <span className="metric-value">{monthlyPrice.toFixed(2)} €</span>
                              <span className="small-text text-muted-foreground">/месец</span>
                            </div>
                            {isYearly && (
                              <p className="tiny-text mt-0.5 font-medium text-emerald-600 dark:text-emerald-400">
                                {plan.price.yearly} €/год. · 2 месеца безплатно
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="relative mb-4 mt-4 flex items-center gap-3">
                        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border/80 to-transparent" />
                        <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                          Функции
                        </span>
                        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border/80 to-transparent" />
                      </div>

                      <ul className="relative mb-5 flex-1 space-y-2">
                        {plan.features.map((feat) => (
                          <li key={feat.text} className="flex items-center gap-2.5">
                            {feat.included ? (
                              <div
                                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-linear-to-br ${plan.gradient}`}
                              >
                                <Check className="h-2.5 w-2.5 text-white" />
                              </div>
                            ) : (
                              <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-muted/80">
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
                    </CardContent>

                    <CardFooter className="relative z-1 border-t border-white/15 bg-black/10 px-4 pb-4 pt-3.5 backdrop-blur-md dark:border-white/10 dark:bg-black/25 sm:px-6 sm:pb-5">
                      <Button
                        asChild
                        className={cn(
                          "btn-text h-11 w-full rounded-2xl font-semibold sm:h-12",
                          plan.popular && "gradient-primary border-0 text-white hover:opacity-90"
                        )}
                        variant={plan.popular ? "default" : "outline"}
                      >
                        <Link href={plan.ctaHref} className="flex items-center justify-center whitespace-nowrap">
                          {plan.cta}
                        </Link>
                      </Button>
                    </CardFooter>
                  </>
                );

                return (
                  <motion.div
                    key={plan.key}
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.08 }}
                    className={cn("flex flex-col", plan.popular && "xl:-mt-2 xl:mb-2")}
                  >
                    {plan.popular ? (
                      <div className="pricing-featured-ring flex h-full flex-col">
                        <Card
                          className={cn(
                            "flex h-full flex-col overflow-hidden rounded-[calc(1.5rem-1px)] border-0 shadow-none backdrop-blur-xl",
                            PRICING_CARD_SURFACE[plan.key]
                          )}
                        >
                          {cardBody}
                        </Card>
                      </div>
                    ) : (
                      <Card
                        className={cn(
                          "flex h-full flex-col overflow-hidden rounded-3xl border border-white/15 shadow-lg backdrop-blur-md dark:border-white/10",
                          PRICING_CARD_SURFACE[plan.key]
                        )}
                      >
                        {cardBody}
                      </Card>
                    )}
                  </motion.div>
                );
              })}
            </div>

            <Separator className="my-8 sm:my-10" />

            <h3 className="card-title mb-4 text-center">Отзиви</h3>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              {testimonials.map((t) => (
                <Card key={t.name} className="border border-border/50 bg-background/60 shadow-xs">
                  <CardContent className="p-4 sm:p-5">
                    <p className="small-text mb-3 leading-relaxed text-foreground/90">
                      &ldquo;{t.content}&rdquo;
                    </p>
                    <div className="flex items-center gap-3 border-t border-border/40 pt-3">
                      <div
                        className={cn(
                          "flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-linear-to-br text-xs font-bold text-white",
                          t.gradient
                        )}
                      >
                        {t.initials}
                      </div>
                      <div className="min-w-0">
                        <p className="card-title text-sm leading-tight">{t.name}</p>
                        <p className="card-description text-xs">{t.role}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <p className="small-text mx-auto mt-8 max-w-2xl text-center leading-relaxed text-muted-foreground">
              {pricingTrustNotes.join(" · ")}. Плащанията са между вас и клиента — софтуерът е само за
              документи.
            </p>
            </div>
          </div>
        </section>

        <section
          id="contact"
          data-landing-spy="contact"
          className={cn(LANDING_SCROLL_MARGIN, LANDING_ZONE_OUTER, "bg-muted/25 dark:bg-muted/10")}
        >
          <div className="container mx-auto max-w-3xl">
            <div className={cn(LANDING_ZONE_PANEL, "p-5 sm:p-8")}>
              <header className="border-b border-border/50 pb-8 text-center">
                <p className={LANDING_ZONE_LABEL}>Контакт</p>
                <h2 className="section-title mt-3">Въпроси и връзка</h2>
                <p className="card-description mx-auto mt-2 max-w-md">
                  Често задавани въпроси, имейл и старт в акаунт — в една зона.
                </p>
              </header>

              <div id="faq" className={cn(LANDING_SCROLL_MARGIN, "mt-8")}>
                <h3 className="card-title mb-4 text-center sm:text-left">Често задавани</h3>
                <dl className="space-y-5">
                  {faqItems.map((faq) => (
                    <div key={faq.q} className="border-b border-border/40 pb-5 last:border-0 last:pb-0">
                      <dt className="card-title mb-1.5 text-base">{faq.q}</dt>
                      <dd className="card-description m-0">{faq.a}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              <Separator className="my-8" />

              <div className="space-y-6">
                <div className="rounded-2xl border border-border/45 bg-gradient-to-br from-muted/50 to-muted/20 p-5 shadow-inner backdrop-blur-sm dark:from-muted/25 dark:to-muted/10 sm:p-6">
                  <p className="mb-3 text-center text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Поддръжка
                  </p>
                  <div className="flex flex-col items-center gap-4 sm:flex-row sm:flex-wrap sm:justify-center sm:gap-x-6 sm:gap-y-2">
                    <a
                      href={`mailto:${publicBusinessProfile.supportEmail}`}
                      className="inline-flex items-center gap-2.5 rounded-xl border border-emerald-500/25 bg-emerald-500/5 px-4 py-2.5 text-sm font-semibold text-emerald-700 shadow-sm transition-colors hover:border-emerald-500/40 hover:bg-emerald-500/10 dark:text-emerald-300"
                    >
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                        <Mail className="h-4 w-4" aria-hidden />
                      </span>
                      <span className="break-all">{publicBusinessProfile.supportEmail}</span>
                    </a>
                    <div className="hidden h-8 w-px bg-border/60 sm:block" aria-hidden />
                    <p className="max-w-sm text-center text-sm leading-relaxed text-muted-foreground sm:max-w-none sm:text-left">
                      <span className="block sm:inline">
                        Отговор {publicBusinessProfile.supportResponseHours}
                      </span>
                      <span className="mx-2 hidden text-border sm:inline" aria-hidden>
                        ·
                      </span>
                      <Link
                        href="/contact"
                        className="mt-1 inline-flex items-center justify-center font-semibold text-primary underline-offset-4 hover:underline sm:mt-0 sm:inline"
                      >
                        Контактна форма →
                      </Link>
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:mx-auto sm:max-w-xl sm:grid-cols-2 sm:gap-4">
                  <Button
                    asChild
                    className="h-12 w-full border-0 text-base font-semibold text-white shadow-lg gradient-primary hover:opacity-90"
                  >
                    <Link href="/signup" className="flex items-center justify-center gap-2">
                      Започнете безплатно
                      <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    asChild
                    className="h-12 w-full border-2 border-border/80 bg-background/70 text-base font-semibold shadow-sm backdrop-blur-sm hover:bg-muted/70 dark:border-border/60"
                  >
                    <Link href="/signin" className="flex items-center justify-center">
                      Вход
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="fixed inset-x-3 bottom-3 z-40 sm:hidden">
          <div className="rounded-3xl border border-border/70 bg-background/95 p-2.5 shadow-lg backdrop-blur">
            <Button
              asChild
              className="h-12 w-full border-0 font-semibold text-white shadow-md gradient-primary hover:opacity-90"
            >
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
                  Фактури и известия за български фирми. Не приемаме плащания вместо вас.
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
                      href="/#top"
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Начало
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/#product"
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Продукт
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/features"
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Възможности
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/#pricing"
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Цени
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
                      href="/#contact"
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

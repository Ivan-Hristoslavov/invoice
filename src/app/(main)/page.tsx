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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { APP_NAME } from "@/config/constants";
import { useSession } from "next-auth/react";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { useRouter } from "next/navigation";
import { BackgroundShapes } from "@/components/ui/background-shapes";
import { cn } from "@/lib/utils";
import {
  Card as HCard,
  CardContent as HCardContent,
  CardFooter as HCardFooter,
  Chip,
  Separator,
} from "@heroui/react";
import { Pagination } from "@/components/ui/pagination";

const fadeInUp = {
  initial: { opacity: 0, y: 60 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: "easeOut" },
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const floatingAnimation = {
  animate: {
    y: [0, -20, 0],
    transition: {
      duration: 6,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

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
}

export default function HomePage() {
  const { status } = useSession();
  const isAuthenticated = status === "authenticated";
  const router = useRouter();
  const [isYearly, setIsYearly] = useState(false);
  const [featurePage, setFeaturePage] = useState(1);
  const [testimonialPage, setTestimonialPage] = useState(1);

  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, router]);

  if (isAuthenticated) {
    return null;
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
  ];

  const pricingPlans: PricingPlan[] = [
    {
      key: "FREE",
      name: "Безплатен",
      price: { monthly: 0, yearly: 0 },
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
    },
    {
      key: "STARTER",
      name: "Стартер",
      price: { monthly: 4.99, yearly: 49.99 },
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
    },
    {
      key: "PRO",
      name: "Про",
      price: { monthly: 8.99, yearly: 89.99 },
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
    },
    {
      key: "BUSINESS",
      name: "Бизнес",
      price: { monthly: 19.99, yearly: 199.99 },
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
    },
  ];

  const testimonials = [
    {
      name: "Иван Петров",
      role: "Управител, ИТ Консулт ЕООД",
      content:
        "Спестих над 10 часа седмично от административни задачи. Фактурите са професионални и клиентите са доволни.",
      initials: "ИП",
      gradient: "from-blue-500 to-cyan-500",
      rating: 5,
    },
    {
      name: "Мария Георгиева",
      role: "Счетоводител",
      content:
        "Най-добрата система за фактуриране, която съм използвала. НАП съвместимостта е безупречна.",
      initials: "МГ",
      gradient: "from-emerald-500 to-teal-500",
      rating: 5,
    },
    {
      name: "Георги Димитров",
      role: "Фрийлансър",
      content:
        "Простичко и ефективно. Създавам фактури за минути и ги изпращам директно на клиентите.",
      initials: "ГД",
      gradient: "from-violet-500 to-purple-500",
      rating: 5,
    },
    {
      name: "Десислава Николова",
      role: "Собственик, онлайн магазин",
      content:
        "Намирам всичко важно веднага. Клиенти, фактури и статуси са подредени много по-ясно от предишния ни софтуер.",
      initials: "ДН",
      gradient: "from-amber-500 to-orange-500",
      rating: 5,
    },
    {
      name: "Николай Стоянов",
      role: "Консултант",
      content:
        "Най-много ми харесва, че интерфейсът е лек и разбираем. Не губя време в излишни менюта и настройки.",
      initials: "НС",
      gradient: "from-cyan-500 to-blue-500",
      rating: 5,
    },
    {
      name: "Елена Василева",
      role: "Управител, маркетинг агенция",
      content:
        "Работата с няколко клиента и няколко компании е подредена добре. Отчетите и историята на документите са много полезни.",
      initials: "ЕВ",
      gradient: "from-rose-500 to-pink-500",
      rating: 5,
    },
  ];

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
  ];

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
  ];

  const featuresPerPage = 3;
  const testimonialPerPage = 3;
  const paginatedFeatures = useMemo(
    () => features.slice((featurePage - 1) * featuresPerPage, featurePage * featuresPerPage),
    [featurePage, features]
  );
  const paginatedTestimonials = useMemo(
    () =>
      testimonials.slice(
        (testimonialPage - 1) * testimonialPerPage,
        testimonialPage * testimonialPerPage
      ),
    [testimonialPage, testimonials]
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

      <div className="min-h-screen overflow-x-hidden flex flex-col">
        <BackgroundShapes variant="vibrant" />

        {/* ── Header ── */}
        <header className="sticky top-0 z-50 w-full glass-card rounded-none! border-t-0! border-l-0! border-r-0!">
          <div className="container mx-auto flex items-center justify-between h-16 px-4 md:px-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2"
            >
              <div className="h-8 w-8 rounded-lg gradient-primary flex items-center justify-center">
                <FileText className="h-4 w-4 text-white" />
              </div>
              <span className="font-bold text-xl tracking-tight">{APP_NAME}</span>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3"
            >
              <ThemeToggle />
              <Button variant="ghost" size="sm" asChild className="hidden sm:flex">
                <Link href="/signin">Вход</Link>
              </Button>
              <Button
                size="sm"
                asChild
                className="gradient-primary hover:opacity-90 text-white border-0"
              >
                <Link href="/signup" className="flex items-center whitespace-nowrap">
                  Започнете безплатно
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </motion.div>
          </div>
        </header>

        {/* ── Hero ── */}
        <section className="relative px-4 pb-20 pt-14 sm:pt-16">
          <div className="container mx-auto max-w-6xl">
            <motion.div
              initial="initial"
              animate="animate"
              variants={staggerContainer}
              className="flex flex-col items-center text-center"
            >
              <motion.div variants={fadeInUp} className="mb-6">
                <Chip variant="flat" color="primary" className="px-3 py-1 text-xs sm:text-sm">
                  <Sparkles className="h-3.5 w-3.5 inline-block mr-1.5" />
                  Ново: Автоматично генериране на НАП номера
                </Chip>
              </motion.div>

              <motion.h1
                variants={fadeInUp}
                className="mb-5 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl lg:text-6xl"
              >
                Фактурирайте{" "}
                <span className="gradient-primary-text">професионално</span>
                <br />
                за минути
              </motion.h1>

              <motion.p
                variants={fadeInUp}
                className="mb-8 max-w-3xl text-base text-muted-foreground sm:text-lg"
              >
                Софтуер за издаване на фактури, създаден за български бизнеси.
                Създавайте професионални фактури, изпращайте ги по имейл и следете статуса им.
              </motion.p>

              <motion.div
                variants={fadeInUp}
                className="mb-12 flex flex-col gap-3 sm:flex-row"
              >
                <Button
                  size="default"
                  asChild
                  className="h-11 px-6 gradient-primary text-white border-0 shadow-lg hover:opacity-90"
                >
                  <Link href="/signup" className="flex items-center whitespace-nowrap">
                    Започнете безплатно
                    <ChevronRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button
                  size="default"
                  variant="outline"
                  asChild
                  className="h-11 px-6 border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <Link href="/signin" className="flex items-center whitespace-nowrap">
                    Вече имам акаунт
                  </Link>
                </Button>
              </motion.div>

              <motion.div
                variants={fadeInUp}
                className="grid grid-cols-3 gap-4 md:gap-8"
              >
                {[
                  { value: "1000+", label: "Активни потребители" },
                  { value: "50K+", label: "Създадени фактури" },
                  { value: "99.9%", label: "Uptime" },
                ].map((stat) => (
                  <div key={stat.label} className="text-center">
                    <div className="text-xl font-bold gradient-primary-text sm:text-2xl md:text-3xl">
                      {stat.value}
                    </div>
                    <div className="mt-1 text-[11px] text-muted-foreground sm:text-sm">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </motion.div>
            </motion.div>

            <motion.div
              variants={floatingAnimation}
              animate="animate"
              className="absolute top-32 left-10 hidden lg:block"
            >
              <div className="p-3 rounded-2xl bg-card shadow-xl border">
                <FileText className="h-6 w-6 text-primary" />
              </div>
            </motion.div>
            <motion.div
              variants={floatingAnimation}
              animate="animate"
              style={{ animationDelay: "2s" }}
              className="absolute top-48 right-16 hidden lg:block"
            >
              <div className="p-3 rounded-2xl bg-card shadow-xl border">
                <BarChart3 className="h-6 w-6 text-emerald-500" />
              </div>
            </motion.div>
          </div>
        </section>

        <section className="px-4 py-10 sm:py-12">
          <div className="container mx-auto max-w-6xl">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {quickHighlights.map((item) => (
                <HCard key={item.title} className="border border-border/50 bg-card shadow-sm">
                  <HCardContent className="p-5">
                    <p className="mb-2 text-base font-semibold">{item.title}</p>
                    <p className="text-sm leading-6 text-muted-foreground">{item.description}</p>
                  </HCardContent>
                </HCard>
              ))}
            </div>
          </div>
        </section>

        {/* ── Who Is It For ── */}
        <section className="px-4 py-12 sm:py-14">
          <div className="container mx-auto max-w-6xl">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
                <HCard className="border-2 border-amber-400/40 bg-card shadow-xl">
                  <HCardContent className="p-6 md:p-8">
                  <div className="flex flex-col md:flex-row gap-8 items-start">
                    <div className="flex-shrink-0">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/25">
                        <FileText className="h-8 w-8 text-white" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h2 className="mb-3 text-2xl font-bold md:text-3xl">
                        За кого е {APP_NAME}?
                      </h2>
                      <p className="mb-5 text-base text-muted-foreground md:text-lg">
                        {APP_NAME} е система за{" "}
                        <strong>издаване на фактури</strong>, а не за обработка
                        на плащания. Приложението е идеално за:
                      </p>
                      <div className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-2">
                        {[
                          "Фрийлансъри и самонаети лица",
                          "Малки и средни предприятия",
                          "Счетоводители и счетоводни къщи",
                          "Консултанти и агенции",
                          "Занаятчии и услуги",
                          "Търговци и дистрибутори",
                        ].map((item) => (
                          <div key={item} className="flex items-center gap-3">
                            <div className="h-6 w-6 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                              <Check className="h-4 w-4 text-emerald-600" />
                            </div>
                            <span className="text-sm md:text-base">{item}</span>
                          </div>
                        ))}
                      </div>
                      <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                        <p className="text-sm text-amber-800 dark:text-amber-200">
                          <strong>Важно:</strong> {APP_NAME}{" "}
                          <strong>не обработва плащания</strong> и не е
                          платежна система. Ние ви помагаме да създавате
                          професионални фактури. Плащанията се извършват
                          директно между вас и вашите клиенти.
                        </p>
                      </div>
                    </div>
                  </div>
                </HCardContent>
              </HCard>
            </motion.div>
          </div>
        </section>

        <section className="px-4 py-12 sm:py-14">
          <div className="container mx-auto max-w-6xl">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-10"
            >
              <Chip variant="flat" color="warning" className="mb-4">
                Как работи
              </Chip>
              <h2 className="mb-4 text-3xl font-bold sm:text-4xl">
                Подреден процес без излишна сложност
              </h2>
              <p className="mx-auto max-w-2xl text-base text-muted-foreground sm:text-lg">
                Влизате, настройвате основните данни и започвате да издавате документи още в първия ден.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {workflowSteps.map((step, index) => (
                <HCard key={step.title} className="border border-border/50 bg-card shadow-sm">
                  <HCardContent className="p-5">
                    <div className="mb-4 flex items-center justify-between">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${step.color} shadow-sm`}>
                        <step.icon className="h-5 w-5 text-white" />
                      </div>
                      <Chip variant="flat" color="secondary" size="sm">
                        Стъпка {index + 1}
                      </Chip>
                    </div>
                    <h3 className="mb-2 text-lg font-semibold">{step.title}</h3>
                    <p className="text-sm leading-6 text-muted-foreground">{step.description}</p>
                  </HCardContent>
                </HCard>
              ))}
            </div>
          </div>
        </section>

        {/* ── Features ── */}
        <section className="py-12 px-4 sm:py-14">
          <div className="container mx-auto max-w-6xl">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="mb-10 text-center"
            >
              <Chip variant="flat" color="primary" className="mb-4">
                Функции
              </Chip>
              <h2 className="mt-3 mb-4 text-3xl font-bold sm:text-4xl">
                Всичко необходимо за вашия бизнес
              </h2>
              <p className="mx-auto max-w-2xl text-base text-muted-foreground sm:text-lg">
                Пълен набор от инструменти за професионално фактуриране и
                управление на финансите
              </p>
            </motion.div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {paginatedFeatures.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                >
                  <HCard
                    isHoverable
                    className="group h-full border border-border/50 bg-card shadow-sm transition-shadow duration-300 hover:shadow-lg"
                  >
                    <HCardContent className="p-5">
                      <div
                        className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${feature.color} shadow-sm transition-transform duration-300 group-hover:scale-105`}
                      >
                        <feature.icon className="h-5 w-5 text-white" />
                      </div>
                      <h3 className="mb-2 text-lg font-semibold">
                        {feature.title}
                      </h3>
                      <p className="text-sm leading-6 text-muted-foreground">
                        {feature.description}
                      </p>
                    </HCardContent>
                  </HCard>
                </motion.div>
              ))}
            </div>
            <div className="mt-6 flex justify-center">
              <Pagination
                currentPage={featurePage}
                totalPages={Math.ceil(features.length / featuresPerPage)}
                onPageChange={setFeaturePage}
                size="sm"
              />
            </div>
          </div>
        </section>

        {/* ── Pricing ── */}
        <section id="pricing" className="px-4 py-12 sm:py-14">
          <div className="container mx-auto max-w-7xl">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="mb-10 text-center"
            >
              <Chip variant="flat" color="success" className="mb-4">
                Ценообразуване
              </Chip>
              <h2 className="mt-3 mb-4 text-3xl font-bold sm:text-4xl">
                Прозрачни цени без изненади
              </h2>
              <p className="mx-auto mb-8 max-w-2xl text-base text-muted-foreground sm:text-lg">
                Изберете плана, който отговаря на нуждите на вашия бизнес
              </p>

              {/* Monthly / Yearly toggle */}
              <div className="inline-flex items-center gap-3 px-5 py-3 rounded-full bg-muted/60 border border-border/50">
                <span
                  className={cn(
                    "text-sm font-medium transition-colors",
                    !isYearly ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  Месечно
                </span>
                <button
                  type="button"
                  onClick={() => setIsYearly(!isYearly)}
                  className={cn(
                    "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none",
                    isYearly ? "bg-emerald-500" : "bg-muted-foreground/30"
                  )}
                >
                  <span
                    className={cn(
                      "inline-block h-4 w-4 rounded-full bg-white transition-transform shadow",
                      isYearly ? "translate-x-6" : "translate-x-1"
                    )}
                  />
                </button>
                <span
                  className={cn(
                    "text-sm font-medium flex items-center gap-2 transition-colors",
                    isYearly ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  Годишно
                  <Chip
                    size="sm"
                    color="success"
                    variant="flat"
                    className="text-[10px] h-5"
                  >
                    -17%
                  </Chip>
                </span>
              </div>
            </motion.div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
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
                          ? "border-emerald-500/60 shadow-2xl"
                            : "border-border/50 shadow-md"
                      )}
                      style={
                        plan.popular
                          ? {
                              boxShadow: `0 20px 60px ${plan.glowColor}, 0 8px 24px rgba(0,0,0,0.12)`,
                            }
                          : undefined
                      }
                    >
                      {/* Gradient top bar */}
                      <div
                        className={`h-1.5 w-full bg-gradient-to-r ${plan.gradient} flex-shrink-0`}
                      />

                      <HCardContent className="flex flex-1 flex-col p-5">
                        {/* Header */}
                        <div className="mb-4 flex items-start justify-between gap-2">
                          <div className="flex items-center gap-3">
                            <div
                              className={`h-9 w-9 rounded-xl bg-gradient-to-br ${plan.gradient} flex items-center justify-center shadow-md flex-shrink-0`}
                            >
                              <PlanIcon className="h-4.5 w-4.5 text-white" />
                            </div>
                            <div>
                              <p className="text-base font-bold leading-tight">
                                {plan.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {plan.description}
                              </p>
                            </div>
                          </div>
                          {plan.popular && (
                            <Chip size="sm" color="success" variant="flat" className="text-[10px] flex-shrink-0">
                              Популярен
                            </Chip>
                          )}
                        </div>

                        {/* Price */}
                        <div className="mb-5">
                          {plan.key === "FREE" ? (
                            <div className="flex items-baseline gap-1">
                              <span className="text-2xl font-bold">0 €</span>
                              <span className="text-muted-foreground text-sm">
                                /завинаги
                              </span>
                            </div>
                          ) : (
                            <div>
                              <div className="flex items-baseline gap-1">
                                <span className="text-2xl font-bold">
                                  {monthlyPrice.toFixed(2)} €
                                </span>
                                <span className="text-muted-foreground text-sm">
                                  /месец
                                </span>
                              </div>
                              {isYearly && (
                                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">
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
                                  className={`h-4 w-4 rounded-full bg-gradient-to-br ${plan.gradient} flex items-center justify-center flex-shrink-0`}
                                >
                                  <Check className="h-2.5 w-2.5 text-white" />
                                </div>
                              ) : (
                                <div className="h-4 w-4 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                                  <X className="h-2.5 w-2.5 text-muted-foreground" />
                                </div>
                              )}
                              <span
                                className={cn(
                                  "text-sm leading-6",
                                  !feat.included && "text-muted-foreground"
                                )}
                              >
                                {feat.text}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </HCardContent>

                      <HCardFooter className="px-5 pb-5 pt-0">
                        <Button
                          asChild
                          className={cn(
                            "w-full h-10",
                            plan.popular &&
                              "gradient-primary hover:opacity-90 text-white border-0"
                          )}
                          variant={plan.popular ? "default" : "outline"}
                        >
                          <Link href={`/signup?plan=${plan.key}`} className="flex items-center justify-center whitespace-nowrap">
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
              className="mt-10 text-center"
            >
              <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
                Всички планове включват софтуер за издаване на фактури. Не
                предлагаме обработка на плащания — вашите клиенти плащат
                директно на вас.
              </p>
            </motion.div>
          </div>
        </section>

        {/* ── Testimonials ── */}
        <section className="px-4 py-12 sm:py-14">
          <div className="container mx-auto max-w-6xl">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="mb-10 text-center"
            >
              <Chip variant="flat" color="warning" className="mb-4">
                Отзиви
              </Chip>
              <h2 className="mt-3 mb-4 text-3xl font-bold sm:text-4xl">
                Доволни клиенти
              </h2>
              <p className="mx-auto max-w-2xl text-base text-muted-foreground sm:text-lg">
                Вижте какво казват нашите потребители за {APP_NAME}
              </p>
            </motion.div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {paginatedTestimonials.map((testimonial, index) => (
                <motion.div
                  key={testimonial.name}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                >
                  <HCard
                    isHoverable
                    className="relative h-full overflow-hidden border border-border/50 bg-card shadow-md transition-shadow duration-500 hover:shadow-xl"
                  >
                    <div
                      className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${testimonial.gradient}`}
                    />
                    <HCardContent className="p-5">
                      <div className="mb-4">
                        <svg
                          className="w-10 h-10 text-emerald-500/20"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                        </svg>
                      </div>
                      <div className="mb-4 flex gap-1">
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <Star
                            key={i}
                            className="h-5 w-5 fill-amber-400 text-amber-400"
                          />
                        ))}
                      </div>
                      <p className="mb-6 text-sm leading-7 text-foreground/90">
                        &ldquo;{testimonial.content}&rdquo;
                      </p>
                      <div className="flex items-center gap-3 border-t border-border/50 pt-4">
                        <div
                          className={cn(
                            "h-10 w-10 rounded-full flex-shrink-0 items-center justify-center bg-gradient-to-br text-sm font-bold text-white",
                            testimonial.gradient
                          )}
                        >
                          {testimonial.initials}
                        </div>
                        <div>
                          <div className="font-semibold text-foreground">
                            {testimonial.name}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {testimonial.role}
                          </div>
                        </div>
                      </div>
                    </HCardContent>
                  </HCard>
                </motion.div>
              ))}
            </div>
            <div className="mt-6 flex justify-center">
              <Pagination
                currentPage={testimonialPage}
                totalPages={Math.ceil(testimonials.length / testimonialPerPage)}
                onPageChange={setTestimonialPage}
                size="sm"
              />
            </div>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="px-4 py-12 sm:py-14">
          <div className="container mx-auto max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="mb-10 text-center"
            >
              <Chip variant="flat" color="secondary" className="mb-4">
                Въпроси
              </Chip>
              <h2 className="mt-3 mb-4 text-3xl font-bold sm:text-4xl">
                Често задавани въпроси
              </h2>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="space-y-4"
            >
              {[
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
              ].map((faq, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.07 }}
                >
                  <HCard className="border border-border/50 bg-card shadow-sm transition-shadow hover:shadow-md">
                    <HCardContent className="p-5">
                      <h3 className="font-semibold text-base mb-2 flex items-center gap-2">
                        <span className="h-5 w-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold flex-shrink-0">
                          {index + 1}
                        </span>
                        {faq.q}
                      </h3>
                      <p className="text-muted-foreground text-sm leading-relaxed pl-7">
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
        <section className="px-4 py-12 sm:py-14">
          <div className="container mx-auto max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <HCard className="relative overflow-hidden border-2 border-emerald-500/20 bg-card shadow-2xl">
                {/* Decorative gradient background */}
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-teal-500/5 to-cyan-500/5 pointer-events-none" />
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />
                <HCardContent className="relative z-10 p-8 text-center md:p-10">
                  <h2 className="mb-4 text-3xl font-bold sm:text-4xl">
                    Готови ли сте да започнете?
                  </h2>
                  <p className="mx-auto mb-8 max-w-xl text-base text-muted-foreground sm:text-lg">
                    Присъединете се към хилядите бизнеси, които вече използват{" "}
                    {APP_NAME} за професионално фактуриране.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button
                      size="default"
                      asChild
                      className="h-11 px-6 gradient-primary hover:opacity-90 text-white border-0 shadow-lg"
                    >
                      <Link
                        href="/signup"
                        className="flex items-center whitespace-nowrap"
                      >
                        Започнете безплатно
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </Link>
                    </Button>
                    <Button
                      size="default"
                      variant="outline"
                      asChild
                      className="h-11 px-6"
                    >
                      <Link
                        href="/signin"
                        className="flex items-center whitespace-nowrap"
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

        {/* ── Footer ── */}
        <footer className="mt-auto border-t px-4 py-12 glass-card rounded-none! border-l-0! border-r-0! border-b-0!">
          <div className="container mx-auto max-w-6xl">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-8 w-8 rounded-lg gradient-primary flex items-center justify-center">
                    <FileText className="h-4 w-4 text-white" />
                  </div>
                  <span className="font-bold text-xl">{APP_NAME}</span>
                </div>
                <p className="text-muted-foreground text-sm">
                  Софтуер за издаване на фактури за български бизнеси. Не
                  обработваме плащания.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-4">Продукт</h4>
                <ul className="space-y-3 text-sm">
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
                <h4 className="font-semibold mb-4">Компания</h4>
                <ul className="space-y-3 text-sm">
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
                <h4 className="font-semibold mb-4">Правна информация</h4>
                <ul className="space-y-3 text-sm">
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
            <div className="pt-8 border-t flex flex-col sm:flex-row justify-between items-center gap-4">
              <p className="text-sm text-muted-foreground">
                © {new Date().getFullYear()} {APP_NAME}. Всички права запазени.
              </p>
              <div className="flex items-center gap-4">
                <Link
                  href="https://www.facebook.com/invoicy.bg"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Facebook"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </Link>
                <Link
                  href="https://twitter.com/invoicy_bg"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Twitter"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                  </svg>
                </Link>
                <Link
                  href="https://www.linkedin.com/company/invoicy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="LinkedIn"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}

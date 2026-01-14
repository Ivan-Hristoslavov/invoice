"use client";

import { useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { 
  ChevronRight, 
  Check, 
  Sparkles, 
  Zap, 
  Shield, 
  BarChart3,
  FileText,
  Users,
  Building,
  ArrowRight,
  Star
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { APP_NAME } from "@/config/constants";
import { CheckoutButton } from "@/components/subscription/CheckoutButton";
import { useSession } from "next-auth/react";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { useRouter } from "next/navigation";

const fadeInUp = {
  initial: { opacity: 0, y: 60 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: "easeOut" }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

const floatingAnimation = {
  animate: {
    y: [0, -20, 0],
    transition: {
      duration: 6,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
};

export default function HomePage() {
  const { status } = useSession();
  const isAuthenticated = status === "authenticated";
  const router = useRouter();
  
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
      description: "Създавайте елегантни фактури с персонализиран дизайн, автоматично номериране и PDF експорт.",
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: Zap,
      title: "Бързо и лесно",
      description: "Интуитивен интерфейс за създаване на фактури за минути. Спестете време с шаблони.",
      color: "from-amber-500 to-orange-500"
    },
    {
      icon: Shield,
      title: "НАП съвместимост",
      description: "Пълна съвместимост с българските данъчни изисквания и автоматично генериране на номера.",
      color: "from-emerald-500 to-teal-500"
    },
    {
      icon: BarChart3,
      title: "Финансови анализи",
      description: "Подробни отчети и статистики за вашия бизнес в реално време.",
      color: "from-slate-500 to-slate-600"
    },
    {
      icon: Users,
      title: "Управление на клиенти",
      description: "Централизирана база данни с клиенти, история на фактури и бързо търсене.",
      color: "from-slate-500 to-slate-600"
    },
    {
      icon: Building,
      title: "Мулти-компании",
      description: "Управлявайте множество фирми от един акаунт с различни настройки.",
      color: "from-indigo-500 to-blue-500"
    }
  ];

  const pricingPlans = [
    {
      name: "Безплатен",
      price: "0",
      period: "завинаги",
      description: "Перфектен за стартиращи бизнеси",
      features: [
        "До 3 фактури месечно",
        "1 компания",
        "Основен PDF експорт",
        "Имейл поддръжка"
      ],
      cta: "Започни безплатно",
      popular: false,
      plan: "FREE" as const
    },
    {
      name: "Професионален",
      price: "29",
      period: "месец",
      description: "За растящи бизнеси",
      features: [
        "Неограничени фактури",
        "1 компания",
        "Персонализирано лого",
        "PDF & CSV експорт",
        "Кредитни известия",
        "Приоритетна поддръжка"
      ],
      cta: "Започни 14-дневен пробен период",
      popular: true,
      plan: "PRO" as const
    },
    {
      name: "Бизнес",
      price: "79",
      period: "месец",
      description: "За утвърдени компании",
      features: [
        "Всичко от Про плана",
        "До 5 компании",
        "До 5 потребителя",
        "API достъп",
        "Разширена аналитика",
        "Персонален мениджър"
      ],
      cta: "Свържете се с нас",
      popular: false,
      plan: "BUSINESS" as const
    }
  ];

  const testimonials = [
    {
      name: "Иван Петров",
      role: "Управител, ИТ Консулт ЕООД",
      content: "Спестих над 10 часа седмично от административни задачи. Фактурите са професионални и клиентите са доволни.",
      avatar: "ИП",
      rating: 5
    },
    {
      name: "Мария Георгиева",
      role: "Счетоводител",
      content: "Най-добрата система за фактуриране, която съм използвала. НАП съвместимостта е безупречна.",
      avatar: "МГ",
      rating: 5
    },
    {
      name: "Георги Димитров",
      role: "Фрийлансър",
      content: "Простичко и ефективно. Създавам фактури за минути и ги изпращам директно на клиентите.",
      avatar: "ГД",
      rating: 5
    }
  ];

  return (
    <>
      {/* Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "name": APP_NAME,
            "applicationCategory": "BusinessApplication",
            "operatingSystem": "Web",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "BGN",
              "description": "Безплатен план с ограничени функции"
            },
            "aggregateRating": {
              "@type": "AggregateRating",
              "ratingValue": "4.8",
              "ratingCount": "150",
              "bestRating": "5",
              "worstRating": "1"
            },
            "description": "Професионална система за фактуриране за български бизнеси с пълна НАП съвместимост",
            "url": process.env.NEXT_PUBLIC_APP_URL || 'https://facturapro.bg',
            "inLanguage": "bg-BG",
            "featureList": [
              "Създаване на професионални фактури",
              "НАП съвместимост",
              "Управление на клиенти",
              "Проследяване на плащания",
              "Експорт в PDF",
              "Мулти-компании",
              "Автоматично номериране на фактури",
              "Български данъчни изисквания"
            ],
            "screenshot": process.env.NEXT_PUBLIC_APP_URL + "/screenshot.png",
            "softwareVersion": "1.0.0"
          })
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": APP_NAME,
            "url": process.env.NEXT_PUBLIC_APP_URL || 'https://facturapro.bg',
            "logo": process.env.NEXT_PUBLIC_APP_URL + "/logo.png",
            "description": "Професионална система за фактуриране за български бизнеси",
            "address": {
              "@type": "PostalAddress",
              "addressCountry": "BG"
            },
            "sameAs": [
              "https://www.facebook.com/facturapro",
              "https://twitter.com/facturapro",
              "https://www.linkedin.com/company/facturapro"
            ]
          })
        }}
      />
      <div className="min-h-screen bg-background overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-background" />
        <motion.div 
          className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-br from-emerald-500/10 to-transparent rounded-full blur-3xl"
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
            rotate: [0, 90, 0]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        />
        <motion.div 
          className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-blue-500/10 to-transparent rounded-full blur-3xl"
          animate={{ 
            scale: [1.2, 1, 1.2],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
        />
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8882_1px,transparent_1px),linear-gradient(to_bottom,#8882_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)]" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-xl">
          <div className="container mx-auto flex items-center justify-between h-16 px-4 md:px-6">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2"
          >
            <div className="h-8 w-8 rounded-lg bg-emerald-600 flex items-center justify-center">
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
            <Button size="sm" asChild className="bg-emerald-600 hover:bg-emerald-700 text-white">
              <Link href="/signup">
                Започнете безплатно
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-32 px-4">
        <div className="container mx-auto max-w-6xl">
          <motion.div 
            initial="initial"
            animate="animate"
            variants={staggerContainer}
            className="flex flex-col items-center text-center"
          >
            {/* Badge */}
            <motion.div 
              variants={fadeInUp}
              className="mb-6"
            >
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-sm font-medium text-primary">
                <Sparkles className="h-4 w-4" />
                Ново: Автоматично генериране на НАП номера
              </span>
            </motion.div>

            {/* Main Heading */}
            <motion.h1 
              variants={fadeInUp}
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6"
            >
              Фактурирайте{" "}
              <span className="bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-500 bg-clip-text text-transparent">
                професионално
              </span>
              <br />
              за минути
            </motion.h1>

            {/* Subtitle */}
            <motion.p 
              variants={fadeInUp}
              className="text-lg sm:text-xl text-muted-foreground max-w-2xl mb-10"
            >
              Модерна платформа за фактуриране, създадена за български бизнеси. 
              Създавайте, изпращайте и проследявайте фактури с лекота.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div 
              variants={fadeInUp}
              className="flex flex-col sm:flex-row gap-4 mb-16"
            >
              <Button size="lg" asChild className="text-base h-12 px-8 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20">
                <Link href="/signup">
                  Започнете безплатно
                  <ChevronRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="text-base h-12 px-8 border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800">
                <Link href="/signin">
                  Вече имам акаунт
              </Link>
            </Button>
            </motion.div>

            {/* Stats */}
            <motion.div 
              variants={fadeInUp}
              className="grid grid-cols-3 gap-8 md:gap-16"
            >
              {[
                { value: "1000+", label: "Активни потребители" },
                { value: "50K+", label: "Създадени фактури" },
                { value: "99.9%", label: "Uptime" }
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-emerald-600">
                    {stat.value}
                  </div>
                  <div className="text-xs sm:text-sm text-muted-foreground mt-1">
                    {stat.label}
          </div>
        </div>
              ))}
            </motion.div>
          </motion.div>

          {/* Floating Elements */}
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

      {/* Features Section */}
      <section className="py-24 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <span className="text-primary font-semibold text-sm uppercase tracking-wider">Функции</span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mt-3 mb-4">
              Всичко необходимо за вашия бизнес
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Пълен набор от инструменти за професионално фактуриране и управление на финансите
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card className="h-full border-0 shadow-lg hover:shadow-xl transition-all duration-300 group hover:-translate-y-1 bg-card/50 backdrop-blur">
                  <CardContent className="p-6">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                      <feature.icon className="h-6 w-6 text-white" />
              </div>
                    <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
            </CardContent>
          </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 px-4">
        <div className="container mx-auto max-w-6xl">
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <span className="text-primary font-semibold text-sm uppercase tracking-wider">Ценообразуване</span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mt-3 mb-4">
              Прозрачни цени без изненади
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Изберете плана, който отговаря на нуждите на вашия бизнес
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {pricingPlans.map((plan, index) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="relative"
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                    <span className="px-4 py-1.5 rounded-full bg-emerald-600 text-white text-sm font-medium shadow-lg">
                      Най-популярен
                    </span>
                  </div>
                )}
                <Card className={`h-full ${plan.popular ? 'border-2 border-emerald-500 shadow-xl shadow-emerald-500/10' : 'border shadow-lg'} hover:shadow-xl transition-all duration-300`}>
                  <CardContent className="p-8">
                    <h3 className="text-xl font-semibold mb-2">{plan.name}</h3>
                    <p className="text-muted-foreground text-sm mb-6">{plan.description}</p>
                    <div className="mb-6">
                      <span className="text-5xl font-bold">{plan.price}</span>
                      <span className="text-muted-foreground ml-2">лв/{plan.period}</span>
              </div>
                    <ul className="space-y-3 mb-8">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-3">
                          <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Check className="h-3 w-3 text-primary" />
                </div>
                          <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                    <CheckoutButton 
                      plan={plan.plan} 
                      className={`w-full ${plan.popular ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''}`}
                      variant={plan.popular ? "default" : "outline"}
                    >
                      {plan.cta}
                </CheckoutButton>
              </CardContent>
            </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <span className="text-primary font-semibold text-sm uppercase tracking-wider">Отзиви</span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mt-3 mb-4">
              Доволни клиенти
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Вижте какво казват нашите потребители за {APP_NAME}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card className="h-full border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-card/50 backdrop-blur">
                  <CardContent className="p-6">
                    <div className="flex gap-1 mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <p className="text-muted-foreground mb-6 italic">"{testimonial.content}"</p>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-emerald-600 flex items-center justify-center text-white font-semibold text-sm">
                        {testimonial.avatar}
                      </div>
                    <div>
                        <div className="font-semibold text-sm">{testimonial.name}</div>
                        <div className="text-xs text-muted-foreground">{testimonial.role}</div>
                      </div>
                </div>
              </CardContent>
            </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative rounded-3xl bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 p-12 md:p-16 text-center text-white overflow-hidden"
          >
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff10_1px,transparent_1px),linear-gradient(to_bottom,#ffffff10_1px,transparent_1px)] bg-[size:24px_24px]" />
            <div className="relative z-10">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
                Готови ли сте да започнете?
              </h2>
              <p className="text-lg text-white/80 mb-8 max-w-xl mx-auto">
                Присъединете се към хилядите бизнеси, които вече използват {APP_NAME} за професионално фактуриране.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" asChild className="text-base h-12 px-8 bg-emerald-600 hover:bg-emerald-700 text-white">
                  <Link href="/signup">
                    Започнете безплатно
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="text-base h-12 px-8 border-slate-600 text-white hover:bg-slate-700">
                  <Link href="/signin">
                    Вход в системата
                  </Link>
                </Button>
              </div>
      </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-16 px-4 bg-muted/20">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
              <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-lg bg-emerald-600 flex items-center justify-center">
                  <FileText className="h-4 w-4 text-white" />
                </div>
                <span className="font-bold text-xl">{APP_NAME}</span>
              </div>
              <p className="text-muted-foreground text-sm">
                Професионална платформа за фактуриране, създадена за български бизнеси.
              </p>
              </div>
              <div>
                <h4 className="font-semibold mb-4">Продукт</h4>
              <ul className="space-y-3 text-sm">
                <li><Link href="/features" className="text-muted-foreground hover:text-foreground transition-colors">Функции</Link></li>
                <li><Link href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">Ценообразуване</Link></li>
                <li><Link href="/integrations" className="text-muted-foreground hover:text-foreground transition-colors">Интеграции</Link></li>
                <li><Link href="/api" className="text-muted-foreground hover:text-foreground transition-colors">API</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-4">Компания</h4>
              <ul className="space-y-3 text-sm">
                <li><Link href="/about" className="text-muted-foreground hover:text-foreground transition-colors">За нас</Link></li>
                <li><Link href="/blog" className="text-muted-foreground hover:text-foreground transition-colors">Блог</Link></li>
                <li><Link href="/careers" className="text-muted-foreground hover:text-foreground transition-colors">Кариери</Link></li>
                <li><Link href="/contact" className="text-muted-foreground hover:text-foreground transition-colors">Контакти</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-4">Правна информация</h4>
              <ul className="space-y-3 text-sm">
                <li><Link href="/terms" className="text-muted-foreground hover:text-foreground transition-colors">Условия за ползване</Link></li>
                <li><Link href="/privacy" className="text-muted-foreground hover:text-foreground transition-colors">Политика за поверителност</Link></li>
                <li><Link href="/cookies" className="text-muted-foreground hover:text-foreground transition-colors">Бисквитки</Link></li>
                <li><Link href="/gdpr" className="text-muted-foreground hover:text-foreground transition-colors">GDPR</Link></li>
                </ul>
              </div>
            </div>
          <div className="pt-8 border-t flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} {APP_NAME}. Всички права запазени.
            </p>
            <div className="flex items-center gap-4">
              <Link href="https://www.facebook.com/facturapro" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors" aria-label="Facebook">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              </Link>
              <Link href="https://twitter.com/facturapro" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors" aria-label="Twitter">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>
              </Link>
              <Link href="https://www.linkedin.com/company/facturapro" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors" aria-label="LinkedIn">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
              </Link>
            </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
} 

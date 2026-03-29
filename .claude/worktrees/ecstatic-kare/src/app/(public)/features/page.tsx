import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, FileText, Zap, Shield, BarChart3, Users, Building, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { generateMetadata as genMeta } from "@/lib/seo";
import { APP_NAME } from "@/config/constants";

export const metadata: Metadata = genMeta({
  title: "Функции",
  description: "Разгледайте всички функции на Invoicy - професионална система за фактуриране с НАП съвместимост",
});

const features = [
  {
    icon: FileText,
    title: "Професионални фактури",
    description: "Създавайте елегантни фактури с персонализиран дизайн, автоматично номериране и PDF експорт. Пълна НАП съвместимост с българските данъчни изисквания.",
    details: [
      "Автоматично генериране на номера по НАП формат",
      "Персонализирани шаблони",
      "PDF експорт с високо качество",
      "Мулти-валутна поддръжка"
    ]
  },
  {
    icon: Zap,
    title: "Бързо и лесно",
    description: "Интуитивен интерфейс за създаване на фактури за минути. Спестете време с шаблони и автоматизация.",
    details: [
      "Създаване на фактури за под 2 минути",
      "Шаблони за често използвани продукти",
      "Автоматично изчисляване на ДДС",
      "Бързо копиране на предишни фактури"
    ]
  },
  {
    icon: Shield,
    title: "НАП съвместимост",
    description: "Пълна съвместимост с българските данъчни изисквания и автоматично генериране на номера.",
    details: [
      "Формат на номера: YYCCCCNNNNNNИ",
      "Автоматично генериране на кредитни известия",
      "Пълна аудитна история",
      "Съответствие с ЗДДС"
    ]
  },
  {
    icon: BarChart3,
    title: "Финансови анализи",
    description: "Подробни отчети и статистики за вашия бизнес в реално време.",
    details: [
      "Dashboard с ключови метрики",
      "Месечни и годишни отчети",
      "Анализ на продажбите",
      "Проследяване на плащания"
    ]
  },
  {
    icon: Users,
    title: "Управление на клиенти",
    description: "Централизирана база данни с клиенти, история на фактури и бързо търсене.",
    details: [
      "Централизирана база данни",
      "История на всички фактури",
      "Бързо търсене и филтриране",
      "Импорт/експорт на данни"
    ]
  },
  {
    icon: Building,
    title: "Мулти-компании",
    description: "Управлявайте множество фирми от един акаунт с различни настройки.",
    details: [
      "Неограничен брой компании",
      "Разделни настройки за всяка компания",
      "Единен dashboard",
      "Лесно превключване между компании"
    ]
  }
];

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16 max-w-6xl">
        {/* Header */}
        <div className="mb-12">
          <Button variant="ghost" size="sm" asChild className="mb-6">
            <Link href="/" className="flex items-center whitespace-nowrap">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Назад към началната страница
            </Link>
          </Button>
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            Функции на {APP_NAME}
          </h1>
          <p className="text-xl text-muted-foreground">
            Всичко необходимо за професионално фактуриране на едно място
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid gap-8 md:grid-cols-2">
          {features.map((feature, index) => (
            <Card key={feature.title} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader>
                <div className="flex items-center gap-4 mb-4">
                  <div className={`h-12 w-12 rounded-xl bg-linear-to-br ${feature.icon === FileText ? 'from-blue-500 to-cyan-500' : feature.icon === Zap ? 'from-amber-500 to-orange-500' : feature.icon === Shield ? 'from-emerald-500 to-teal-500' : feature.icon === BarChart3 ? 'from-slate-500 to-slate-600' : feature.icon === Users ? 'from-slate-500 to-slate-600' : 'from-slate-500 to-slate-600'} flex items-center justify-center`}>
                    <feature.icon className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-2xl">{feature.title}</CardTitle>
                </div>
                <CardDescription className="text-base">
                  {feature.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {feature.details.map((detail, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">{detail}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <h2 className="text-3xl font-bold mb-4">Готови да започнете?</h2>
          <p className="text-muted-foreground mb-8">
            Регистрирайте се безплатно и опитайте всички функции
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/signup" className="flex items-center whitespace-nowrap">
                Започнете безплатно
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/#pricing" className="flex items-center whitespace-nowrap">
                Вижте цените
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Zap, CreditCard, Mail, FileText, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { generateMetadata as genMeta } from "@/lib/seo";
import { APP_NAME } from "@/config/constants";
import { paymentMessage } from "@/config/public-business";

export const metadata: Metadata = genMeta({
  title: "Интеграции",
  description: "Интегрирайте Invoicy с вашите любими инструменти за по-ефективна работа",
});

const integrations = [
  {
    icon: CreditCard,
    title: "Stripe",
    description: "Сигурно процесиране на абонаментни плащания за Invoicy чрез Stripe Checkout.",
    status: "Достъпно",
    comingSoon: false
  },
  {
    icon: Mail,
    title: "Имейл",
    description: "Изпращайте фактури директно по имейл на клиентите си. Автоматични напомняния за плащане.",
    status: "Достъпно",
    comingSoon: false
  },
  {
    icon: FileText,
    title: "PDF Експорт",
    description: "Експортирайте фактури в PDF формат с професионален дизайн. Персонализирани шаблони.",
    status: "Достъпно",
    comingSoon: false
  },
  {
    icon: BarChart3,
    title: "API",
    description: "Интегрирайте Invoicy във вашите собствени системи чрез RESTful API.",
    status: "Скоро",
    comingSoon: true
  },
  {
    icon: Zap,
    title: "Zapier",
    description: "Автоматизирайте работните процеси с хиляди приложения чрез Zapier интеграция.",
    status: "Скоро",
    comingSoon: true
  }
];

export default function IntegrationsPage() {
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
            Интеграции
          </h1>
          <p className="text-xl text-muted-foreground">
            Какво вече работи с {APP_NAME} и какво предстои — накратко и ясно
          </p>
        </div>

        <Card className="mb-10 border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Как работят плащанията</CardTitle>
            <CardDescription>
              Ясно и последователно за всички клиенти.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>{paymentMessage.short}</p>
            <p>{paymentMessage.subscription}</p>
            <p>{paymentMessage.clientInvoices}</p>
          </CardContent>
        </Card>

        {/* Integrations Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {integrations.map((integration) => (
            <Card key={integration.title} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader>
                <div className="flex items-center justify-between mb-4">
                  <div className="h-12 w-12 rounded-xl bg-linear-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                    <integration.icon className="h-6 w-6 text-white" />
                  </div>
                  {integration.comingSoon ? (
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400">
                      Скоро
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400">
                      Достъпно
                    </span>
                  )}
                </div>
                <CardTitle>{integration.title}</CardTitle>
                <CardDescription>{integration.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>

        {/* API Section */}
        <div className="mt-16">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl">API Документация</CardTitle>
              <CardDescription>
                Използвайте нашия RESTful API за интеграция с вашите собствени системи
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                API документацията ще бъде достъпна скоро. Засега можете да използвате всички функции чрез уеб интерфейса.
              </p>
              <Button variant="outline" disabled>
                API Документация (Скоро)
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <h2 className="text-3xl font-bold mb-4">Имате нужда от специфична интеграция?</h2>
          <p className="text-muted-foreground mb-8">
            Свържете се с нас и ще обсъдим как можем да помогнем
          </p>
          <Button size="lg" asChild>
            <Link href="/contact" className="flex items-center whitespace-nowrap">
              Свържете се с нас
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Code, Book, Key, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { generateMetadata as genMeta } from "@/lib/seo";
import { APP_NAME } from "@/config/constants";
import { paymentMessage } from "@/config/public-business";

export const metadata: Metadata = genMeta({
  title: "API Документация",
  description: "Интегрирайте Invoicy във вашите собствени системи чрез RESTful API",
});

export default function APIPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        {/* Header */}
        <div className="mb-12">
          <Button variant="ghost" size="sm" asChild className="mb-6">
              <Link href="/" className="flex items-center whitespace-nowrap">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Назад към началната страница
              </Link>
          </Button>
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            API Документация
          </h1>
          <p className="text-xl text-muted-foreground">
            Интегрирайте {APP_NAME} във вашите собствени системи чрез RESTful API
          </p>
        </div>

        {/* Coming Soon Notice */}
        <Card className="border-0 shadow-lg mb-8">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <Zap className="h-6 w-6 text-amber-500" />
              <CardTitle>API в разработка</CardTitle>
            </div>
            <CardDescription>
              Нашият RESTful API е в процес на разработка и ще бъде достъпен скоро.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              API-то ще ви позволи да:
            </p>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-emerald-500">•</span>
                <span>Създавате и управлявате фактури програмно</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500">•</span>
                <span>Синхронизирате данни с вашите собствени системи</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500">•</span>
                <span>Автоматизирате работните процеси</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500">•</span>
                <span>Извличате отчети и статистики</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg mb-8">
          <CardHeader>
            <CardTitle>Плащания и отговорност</CardTitle>
            <CardDescription>
              Прозрачност за начина, по който работим.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>{paymentMessage.short}</p>
            <p>{paymentMessage.subscription}</p>
            <p>{paymentMessage.clientInvoices}</p>
          </CardContent>
        </Card>

        {/* Features */}
        <div className="grid gap-6 md:grid-cols-2 mb-12">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <Code className="h-8 w-8 text-emerald-500 mb-2" />
              <CardTitle>RESTful API</CardTitle>
              <CardDescription>
                Стандартен REST API с JSON формат за лесно интегриране
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <Key className="h-8 w-8 text-emerald-500 mb-2" />
              <CardTitle>API Keys</CardTitle>
              <CardDescription>
                Безопасна автентикация чрез API ключове
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <Book className="h-8 w-8 text-emerald-500 mb-2" />
              <CardTitle>Пълна документация</CardTitle>
              <CardDescription>
                Подробна документация с примери за всички endpoints
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <Zap className="h-8 w-8 text-emerald-500 mb-2" />
              <CardTitle>Webhooks</CardTitle>
              <CardDescription>
                Получавайте нотификации за важни събития в реално време
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* CTA */}
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-4">Искате да бъдете уведомени?</h2>
          <p className="text-muted-foreground mb-8">
            Регистрирайте се, за да получите известие когато API-то стане достъпно
          </p>
          <Button size="lg" asChild>
            <Link href="/signup">
              Регистрирайте се безплатно
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

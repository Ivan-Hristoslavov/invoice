"use client";

import { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { APP_NAME } from "@/config/constants";
import { CheckoutButton } from "@/components/subscription/CheckoutButton";
import { useSession } from "next-auth/react";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const { status } = useSession();
  const isAuthenticated = status === "authenticated";
  const router = useRouter();
  
  // Редирект към дашборда ако потребителят е логнат
  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, router]);

  // Ако потребителят е логнат, показваме само лоудър (редиректът ще се погрижи)
  if (isAuthenticated) {
    return null;
  }

  return (
    <div>
      {/* Header for unauthenticated users */}
      {!isAuthenticated && (
        <header className="sticky top-0 z-20 w-full bg-background/95 backdrop-blur border-b">
          <div className="container mx-auto flex items-center justify-between h-16 px-4 md:px-6">
            <div className="font-bold text-xl">
              <Link href="/">{APP_NAME}</Link>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button variant="ghost" size="sm" asChild>
                <Link href="/signin">Вход</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/signup">Регистрация</Link>
              </Button>
            </div>
          </div>
        </header>
      )}

      <div className="container mx-auto px-4 py-12 md:py-24">
        <div className="flex flex-col items-center text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Опростете вашето фактуриране с {APP_NAME}
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mb-8">
            Професионално решение за фактуриране за бизнеси от всякакъв размер.
            Създавайте, управлявайте и проследявайте вашите фактури с лекота.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button size="lg" asChild>
              <Link href="/signup">
                Започнете сега
                <ChevronRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/dashboard">
                Преглед на демо
              </Link>
            </Button>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24">
          <Card>
            <CardContent className="pt-6">
              <div className="p-2 w-10 h-10 rounded-full bg-primary/10 text-primary mb-4 flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Професионални фактури</h3>
              <p className="text-muted-foreground">
                Създавайте красиви, персонализирани фактури, които отразяват вашата марка и впечатляват вашите клиенти.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="p-2 w-10 h-10 rounded-full bg-primary/10 text-primary mb-4 flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Спестяване на време</h3>
              <p className="text-muted-foreground">
                Спестете време с автоматично генериране на фактури, повтарящи се фактури и напомняния за плащане.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="p-2 w-10 h-10 rounded-full bg-primary/10 text-primary mb-4 flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Финансови анализи</h3>
              <p className="text-muted-foreground">
                Получете ценни анализи за финансите на вашия бизнес с подробни отчети и аналитика.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Pricing */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Просто, прозрачно ценообразуване</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-12">
            Изберете плана, който е подходящ за вашия бизнес.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Basic Plan */}
            <Card className="border border-muted">
              <CardContent className="pt-6">
                <h3 className="text-xl font-semibold mb-2">Базов</h3>
                <div className="mb-4">
                  <span className="text-4xl font-bold">$10</span>
                  <span className="text-muted-foreground">/месец</span>
                </div>
                <p className="text-muted-foreground mb-6">
                  Перфектен за фрийлансъри и малки бизнеси, които тепърва започват.
                </p>
                <ul className="space-y-3 mb-6">
                  {["Достъп до основни функции за фактуриране", "До 10 клиента", "До 50 фактури на месец"].map((feature) => (
                    <li key={feature} className="flex items-center">
                      <Check className="text-green-500 mr-2 h-5 w-5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <CheckoutButton plan="BASIC" className="w-full" variant="outline">
                  Абонирай се
                </CheckoutButton>
              </CardContent>
            </Card>

            {/* Pro Plan */}
            <Card className="border-2 border-primary relative">
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium">
                Най-популярен
              </div>
              <CardContent className="pt-6">
                <h3 className="text-xl font-semibold mb-2">Про</h3>
                <div className="mb-4">
                  <span className="text-4xl font-bold">$20</span>
                  <span className="text-muted-foreground">/месец</span>
                </div>
                <p className="text-muted-foreground mb-6">
                  Идеален за развиващи се бизнеси с редовни нужди от фактуриране.
                </p>
                <ul className="space-y-3 mb-6">
                  {[
                    "Всички функции от Базов план",
                    "До 50 клиента",
                    "Неограничени фактури",
                    "Персонализиран брандинг"
                  ].map((feature) => (
                    <li key={feature} className="flex items-center">
                      <Check className="text-green-500 mr-2 h-5 w-5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <CheckoutButton plan="PRO" className="w-full">
                  Абонирай се
                </CheckoutButton>
              </CardContent>
            </Card>

            {/* Enterprise Plan */}
            <Card className="border border-muted">
              <CardContent className="pt-6">
                <h3 className="text-xl font-semibold mb-2">Ентърпрайз</h3>
                <div className="mb-4">
                  <span className="text-4xl font-bold">$50</span>
                  <span className="text-muted-foreground">/месец</span>
                </div>
                <p className="text-muted-foreground mb-6">
                  За по-големи организации с комплексни нужди от фактуриране.
                </p>
                <ul className="space-y-3 mb-6">
                  {[
                    "Всички функции от Про план",
                    "Неограничени клиенти",
                    "Приоритетна поддръжка",
                    "API достъп",
                    "Разширена аналитика"
                  ].map((feature) => (
                    <li key={feature} className="flex items-center">
                      <Check className="text-green-500 mr-2 h-5 w-5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <CheckoutButton plan="ENTERPRISE" className="w-full" variant="outline">
                  Абонирай се
                </CheckoutButton>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Testimonials */}
        <div className="mb-24">
          <h2 className="text-3xl font-bold text-center mb-12">Доволни клиенти</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="font-semibold text-primary">ИД</span>
                    </div>
                    <div>
                      <h4 className="font-semibold">Иван Димитров</h4>
                      <p className="text-sm text-muted-foreground">Фрийлансър</p>
                    </div>
                  </div>
                  <p className="italic">
                    "{APP_NAME} промени начина, по който управлявам фактурите си. Лесно е за използване и спестява толкова много време!"
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="font-semibold text-primary">МГ</span>
                    </div>
                    <div>
                      <h4 className="font-semibold">Мария Георгиева</h4>
                      <p className="text-sm text-muted-foreground">Собственик на малък бизнес</p>
                    </div>
                  </div>
                  <p className="italic">
                    "Професионалните фактури и автоматизираните напомняния подобриха паричния ни поток. Напълно препоръчвам {APP_NAME} на всеки малък бизнес."
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-4">Готови ли сте да опитате {APP_NAME}?</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Започнете безплатно днес и вижте как можем да ви помогнем да управлявате вашите фактури по-ефективно.
          </p>
          <Button size="lg" asChild>
            <Link href="/signup">Започнете безплатен пробен период</Link>
          </Button>
        </div>
      </div>

      {/* Footer for unauthenticated users */}
      {!isAuthenticated && (
        <footer className="mt-24 border-t py-12">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div>
                <h3 className="font-bold text-lg mb-4">{APP_NAME}</h3>
                <p className="text-muted-foreground">
                  Опростяваме фактурирането за бизнеси по целия свят.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-4">Продукт</h4>
                <ul className="space-y-2">
                  <li>
                    <Link href="#" className="text-muted-foreground hover:text-foreground">
                      Функции
                    </Link>
                  </li>
                  <li>
                    <Link href="#" className="text-muted-foreground hover:text-foreground">
                      Ценообразуване
                    </Link>
                  </li>
                  <li>
                    <Link href="#" className="text-muted-foreground hover:text-foreground">
                      Интеграции
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-4">Компания</h4>
                <ul className="space-y-2">
                  <li>
                    <Link href="#" className="text-muted-foreground hover:text-foreground">
                      За нас
                    </Link>
                  </li>
                  <li>
                    <Link href="#" className="text-muted-foreground hover:text-foreground">
                      Блог
                    </Link>
                  </li>
                  <li>
                    <Link href="#" className="text-muted-foreground hover:text-foreground">
                      Кариери
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-4">Правна информация</h4>
                <ul className="space-y-2">
                  <li>
                    <Link href="#" className="text-muted-foreground hover:text-foreground">
                      Условия за ползване
                    </Link>
                  </li>
                  <li>
                    <Link href="#" className="text-muted-foreground hover:text-foreground">
                      Политика за поверителност
                    </Link>
                  </li>
                  <li>
                    <Link href="#" className="text-muted-foreground hover:text-foreground">
                      Бисквитки
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
            <div className="mt-12 pt-8 border-t text-center text-muted-foreground">
              <p>© {new Date().getFullYear()} {APP_NAME}. Всички права запазени.</p>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
} 
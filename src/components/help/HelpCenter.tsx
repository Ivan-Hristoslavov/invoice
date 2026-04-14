"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  HelpCircle,
  BookOpen,
  Video,
  MessageCircle,
  FileText,
  Users,
  Building,
  Package,
  Settings,
  CreditCard,
  ArrowRight,
  Search,
  Mail,
  ArrowDownCircle,
  ArrowUpCircle,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HelpFaqAccordion, type FaqCategory } from "@/components/help/HelpFaqAccordion";
import { APP_NAME } from "@/config/constants";
import { publicBusinessProfile } from "@/config/public-business";
import { cn } from "@/lib/utils";

type QuickLink = {
  title: string;
  description: string;
  icon: typeof FileText;
  href: string;
  color: string;
  keywords: string;
};

const quickLinks: QuickLink[] = [
  {
    title: "Как да създам фактура",
    description: "Стъпки за нова фактура, клиент и редове",
    icon: FileText,
    href: "/docs/guides/invoices",
    color: "from-emerald-500 to-teal-600",
    keywords: "фактура нова създаване",
  },
  {
    title: "Кредитни известия",
    description: "Отмяна и корекции след издаване",
    icon: ArrowDownCircle,
    href: "/credit-notes",
    color: "from-red-500 to-rose-600",
    keywords: "кредитно известие отмяна",
  },
  {
    title: "Дебитни известия",
    description: "Допълнителни суми към издадена фактура",
    icon: ArrowUpCircle,
    href: "/debit-notes",
    color: "from-emerald-600 to-teal-700",
    keywords: "дебитно известие",
  },
  {
    title: "Управление на клиенти",
    description: "Добавяне, импорт и редакция на клиенти",
    icon: Users,
    href: "/docs/guides",
    color: "from-amber-500 to-orange-600",
    keywords: "клиенти импорт csv",
  },
  {
    title: "Компании и издател",
    description: "Данни на фирмата издател и лого",
    icon: Building,
    href: "/settings/company",
    color: "from-slate-500 to-slate-600",
    keywords: "компания еик настройки",
  },
  {
    title: "Каталог продукти",
    description: "Артикули и услуги за бързо добавяне",
    icon: Package,
    href: "/products",
    color: "from-cyan-500 to-blue-600",
    keywords: "продукти услуги каталог",
  },
  {
    title: "Абонамент и плащания",
    description: "Планове, Stripe и фактури от нас",
    icon: CreditCard,
    href: "/settings/subscription",
    color: "from-violet-500 to-purple-600",
    keywords: "абонамент план stripe",
  },
  {
    title: "Настройки на приложението",
    description: "Фактури, НАП, профил и одит",
    icon: Settings,
    href: "/settings/company",
    color: "from-indigo-500 to-blue-600",
    keywords: "настройки номерация нап",
  },
  {
    title: "Екип и покани",
    description: "Членове, роли и покани за компанията",
    icon: Users,
    href: "/settings/team",
    color: "from-rose-500 to-pink-600",
    keywords: "екип покана роля",
  },
];

const faqCategories: FaqCategory[] = [
  {
    title: "Основни въпроси",
    questions: [
      {
        q: `Какво е ${APP_NAME}?`,
        a: `${APP_NAME} е софтуер за издаване и управление на фактури. Създавате PDF, следите статуси и изпращате към клиенти. Не сме платежна система — плащанията са между вас и клиента (банка, наложен платеж и т.н.).`,
      },
      {
        q: "Мога ли да приемам плащания през приложението?",
        a: "Не. Платформата не обработва плащания от вашите клиенти. Абонаментът за самия софтуер се плаща отделно (напр. чрез Stripe), а сумите по фактури — по договорен с клиента начин.",
      },
      {
        q: "За кого е подходящ?",
        a: "Фрийлансъри, МСП, счетоводители и екипи, които трябва да издават фактури и известия в ежедневната си работа.",
      },
    ],
  },
  {
    title: "Фактуриране",
    questions: [
      {
        q: "Как да създам фактура?",
        a: "От менюто „Фактури“ → „Нова фактура“. Изберете компания издател и клиент, добавете редове от каталога или ръчно, проверете данъците и запазете или издайте.",
      },
      {
        q: "Мога ли да редактирам издадена фактура?",
        a: "Издадените (ISSUED) фактури не се редактират. За корекции използвайте кредитно или дебитно известие според случая.",
      },
      {
        q: "Как работи номерирането?",
        a: "Задава се в Настройки → Фактури: префикс, нулиране по година, начален номер при миграция. Кредитни и дебитни известия имат отделна логика според настройките ви.",
      },
    ],
  },
  {
    title: "Акаунт и екип",
    questions: [
      {
        q: "Как да променя паролата?",
        a: "Настройки → Сигурност → промяна на парола.",
      },
      {
        q: "Как да поканя колега?",
        a: "От страничното меню отворете „Екип“ (/settings/team). От там изпращате покана и управлявате ролите за текущата компания.",
      },
      {
        q: "Къде редактирам данните на фирмата издател?",
        a: "Настройки → Компания — данни за ДДС, адрес, лого и реквизити за фактури.",
      },
    ],
  },
  {
    title: "Импорт и експорт",
    questions: [
      {
        q: "В какви формати експортирам?",
        a: "PDF за изпращане към клиенти и CSV за отчети или външни системи, когато функцията е налична за вашия план.",
      },
      {
        q: "Как да импортирам клиенти?",
        a: "В секция „Клиенти“ ползвайте импорт с шаблон CSV — колоните са описани в интерфейса.",
      },
    ],
  },
];

function normalizeSearch(s: string) {
  return s.trim().toLowerCase();
}

export function HelpCenter() {
  const [query, setQuery] = useState("");
  const q = normalizeSearch(query);

  const filteredQuickLinks = useMemo(() => {
    if (!q) return quickLinks;
    return quickLinks.filter(
      (link) =>
        normalizeSearch(link.title).includes(q) ||
        normalizeSearch(link.description).includes(q) ||
        normalizeSearch(link.keywords).includes(q)
    );
  }, [q]);

  const filteredFaq = useMemo((): FaqCategory[] => {
    if (!q) return faqCategories;
    return faqCategories
      .map((cat) => ({
        ...cat,
        questions: cat.questions.filter(
          (item) =>
            normalizeSearch(item.q).includes(q) || normalizeSearch(item.a).includes(q)
        ),
      }))
      .filter((cat) => cat.questions.length > 0);
  }, [q]);

  const supportMail = publicBusinessProfile.supportEmail;
  const supportPhone = publicBusinessProfile.supportPhone?.trim();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="mb-2 text-3xl font-bold tracking-tight">Помощ и поддръжка</h1>
        <p className="text-muted-foreground">
          Отговори по работа с {APP_NAME}, настройки и документация
        </p>
      </div>

      <Card className="border-2 border-amber-500/30 bg-linear-to-br from-amber-50/50 to-orange-50/30 dark:from-amber-950/20 dark:to-orange-950/10">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-amber-500 to-orange-500">
              <FileText className="h-5 w-5 text-white" aria-hidden />
            </div>
            <div>
              <h2 className="mb-1 text-lg font-semibold">Какво прави {APP_NAME}?</h2>
              <p className="text-muted-foreground">
                <strong>Софтуер за фактури и известия</strong>, не платежен оператор. Вие издаваме
                документите; клиентите ви плащат по банка или друг договорен канал.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <label className="relative block">
            <span className="sr-only">Търсене в помощта</span>
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Търсене в препоръки и въпроси…"
              className="w-full rounded-lg border border-input bg-background py-3 pl-10 pr-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              autoComplete="off"
            />
          </label>
          {q && (
            <p className="mt-3 text-sm text-muted-foreground">
              {filteredQuickLinks.length + filteredFaq.reduce((n, c) => n + c.questions.length, 0) ===
              0 ? (
                <>Няма съвпадения — опитайте с друга дума или вижте </>
              ) : (
                <>
                  Намерени {filteredQuickLinks.length} връзки и{" "}
                  {filteredFaq.reduce((n, c) => n + c.questions.length, 0)} отговора. Пълна база:{" "}
                </>
              )}
              <Link href="/docs/faq" className="font-medium text-primary hover:underline">
                документация FAQ
              </Link>
              .
            </p>
          )}
        </CardContent>
      </Card>

      <section aria-labelledby="help-quick">
        <h2 id="help-quick" className="mb-4 text-2xl font-semibold tracking-tight">
          Бързи връзки
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredQuickLinks.map((link, index) => (
            <Link key={`${link.href}-${index}`} href={link.href}>
              <Card
                className={cn(
                  "h-full cursor-pointer transition-shadow duration-300 hover:shadow-lg",
                  q && "ring-1 ring-primary/20"
                )}
              >
                <CardHeader>
                  <div
                    className={`mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br ${link.color}`}
                  >
                    <link.icon className="h-6 w-6 text-white" aria-hidden />
                  </div>
                  <CardTitle className="text-lg">{link.title}</CardTitle>
                  <CardDescription>{link.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center text-sm font-medium text-primary">
                    Отвори
                    <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
        {q && filteredQuickLinks.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">Няма бързи връзки за тази заявка.</p>
        ) : null}
      </section>

      <section aria-labelledby="help-faq">
        <h2 id="help-faq" className="mb-4 text-2xl font-semibold tracking-tight">
          Често задавани въпроси
        </h2>
        {filteredFaq.length > 0 ? (
          <HelpFaqAccordion categories={filteredFaq} />
        ) : (
          <p className="text-sm text-muted-foreground">Няма въпроси за тази заявка.</p>
        )}
      </section>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-linear-to-br from-blue-500 to-indigo-600">
              <BookOpen className="h-5 w-5 text-white" aria-hidden />
            </div>
            <CardTitle>Документация</CardTitle>
            <CardDescription>Ръководства и списъци с полета</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link href="/docs" className="flex items-center whitespace-nowrap">
                Към документацията
                <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-linear-to-br from-purple-500 to-pink-600">
              <Video className="h-5 w-5 text-white" aria-hidden />
            </div>
            <CardTitle>Видео материали</CardTitle>
            <CardDescription>Кратки уроци (когато са налични)</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link href="/docs/video-tutorials" className="flex items-center whitespace-nowrap">
                Видео страница
                <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-linear-to-br from-emerald-500 to-teal-600">
              <MessageCircle className="h-5 w-5 text-white" aria-hidden />
            </div>
            <CardTitle>Контакт</CardTitle>
            <CardDescription>Имейл и форма за запитване</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button asChild variant="outline" className="w-full">
              <Link href="/contact" className="flex items-center whitespace-nowrap">
                <Mail className="mr-2 h-4 w-4" aria-hidden />
                Страница за контакт
              </Link>
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Имейл:{" "}
              <a href={`mailto:${supportMail}`} className="text-primary hover:underline">
                {supportMail}
              </a>
            </p>
            {supportPhone ? (
              <p className="text-center text-sm text-muted-foreground">
                Телефон:{" "}
                <a href={`tel:${supportPhone.replace(/\s/g, "")}`} className="text-primary hover:underline">
                  {supportPhone}
                </a>
              </p>
            ) : null}
            <p className="text-center text-xs text-muted-foreground">
              Отговор: {publicBusinessProfile.supportResponseHours}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Правна информация и клавиши</CardTitle>
          <CardDescription>GDPR, условия и клавишни комбинации в приложението</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="outline" size="sm">
              <Link href="/gdpr">GDPR</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/terms">Условия</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/privacy">Поверителност</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/cookies">Бисквитки</Link>
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Натиснете{" "}
            <kbd className="rounded border border-border/80 bg-muted/60 px-1.5 py-0.5 font-mono text-xs">
              ?
            </kbd>{" "}
            в приложението за списък с клавишни комбинации. Командната палитра:{" "}
            <kbd className="rounded border border-border/80 bg-muted/60 px-1.5 py-0.5 font-mono text-xs">
              Cmd+K
            </kbd>{" "}
            /{" "}
            <kbd className="rounded border border-border/80 bg-muted/60 px-1.5 py-0.5 font-mono text-xs">
              Ctrl+K
            </kbd>
            .
          </p>
        </CardContent>
      </Card>

      <Card className="bg-linear-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20">
        <CardContent className="p-8 text-center">
          <HelpCircle className="mx-auto mb-4 h-12 w-12 text-emerald-600 dark:text-emerald-400" aria-hidden />
          <h2 className="mb-2 text-2xl font-semibold">Още въпроси?</h2>
          <p className="mx-auto mb-6 max-w-2xl text-muted-foreground">
            Пишете ни от контактната форма или прегледайте разширените отговори в документацията.
          </p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/contact" className="flex items-center whitespace-nowrap">
                <MessageCircle className="mr-2 h-5 w-5" aria-hidden />
                Свържете се
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/docs/faq" className="flex items-center whitespace-nowrap">
                <BookOpen className="mr-2 h-5 w-5" aria-hidden />
                FAQ в документацията
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

import { Metadata } from "next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HelpFaqAccordion } from "@/components/help/HelpFaqAccordion";
import {
  HelpCircle,
  BookOpen,
  Video,
  MessageCircle,
  FileText,
  Users,
  Building,
  Package,
  CreditCard,
  Settings,
  ArrowRight,
  Search,
  Mail
} from "lucide-react";
import Link from "next/link";
import { APP_NAME } from "@/config/constants";

export const metadata: Metadata = {
  title: `Помощ и поддръжка | ${APP_NAME}`,
  description: "Намерете помощ и документация за използването на InvoicyPro",
};

const quickLinks = [
  {
    title: "Как да създам фактура",
    description: "Научете как да създадете вашата първа фактура",
    icon: FileText,
    href: "/docs/guides/invoices",
    color: "from-emerald-500 to-teal-600"
  },
  {
    title: "Управление на клиенти",
    description: "Добавяне и управление на клиенти",
    icon: Users,
    href: "/docs/guides",
    color: "from-amber-500 to-orange-600"
  },
  {
    title: "Управление на компании",
    description: "Работа с множество компании",
    icon: Building,
    href: "/docs/guides",
    color: "from-slate-500 to-slate-600"
  },
  {
    title: "Каталог продукти",
    description: "Създаване и управление на продукти",
    icon: Package,
    href: "/docs/guides",
    color: "from-cyan-500 to-blue-600"
  },
  {
    title: "Абонамент и плащания",
    description: "Информация за плановете и фактурирането",
    icon: CreditCard,
    href: "/settings/subscription",
    color: "from-violet-500 to-purple-600"
  },
  {
    title: "Настройки на системата",
    description: "Конфигуриране на приложението",
    icon: Settings,
    href: "/settings",
    color: "from-indigo-500 to-blue-600"
  },
  {
    title: "Екип и покани",
    description: "Членове на екипа, роли и покани за компания",
    icon: Users,
    href: "/settings/team",
    color: "from-rose-500 to-pink-600"
  }
];

const faqCategories = [
  {
    title: "Основни въпроси",
    questions: [
      {
        q: "Какво е InvoicyPro?",
        a: "InvoicyPro е софтуер за издаване на фактури. Помагаме ви да създавате професионални фактури, да ги изпращате по имейл и да следите кой ви дължи пари."
      },
      {
        q: "Мога ли да приемам плащания чрез InvoicyPro?",
        a: "Не, InvoicyPro не е платежна система и не обработва плащания. Плащанията се извършват директно между вас и клиентите ви - чрез банков превод, в брой или друг метод по ваш избор."
      },
      {
        q: "За кого е подходящ InvoicyPro?",
        a: "InvoicyPro е идеален за фрийлансъри, малки и средни предприятия, счетоводители, консултанти и всеки, който трябва да издава фактури на клиенти."
      }
    ]
  },
  {
    title: "Фактуриране",
    questions: [
      {
        q: "Как да създам фактура?",
        a: "Отидете в секцията 'Фактури' и кликнете на бутона 'Нова фактура'. Попълнете необходимите данни за клиента, добавете продукти или услуги и запазете."
      },
      {
        q: "Мога ли да редактирам издадена фактура?",
        a: "Не, издадените (ISSUED) фактури не могат да се редактират. Можете само да създадете кредитно известие за отмяна на фактурата."
      },
      {
        q: "Как работи автоматичното номериране?",
        a: "Системата присвоява последователни цифрови номера на новите фактури. По желание може да добавите буквен префикс (напр. Ф-, ФАК-); може и без префикс. От същото място се задава дали номерацията да се нулира всяка година и начален номер при преход от друга система — Настройки → Фактури."
      }
    ]
  },
  {
    title: "Акаунт и настройки",
    questions: [
      {
        q: "Как да променя паролата си?",
        a: "Отидете в Настройки > Сигурност и използвайте опцията за промяна на парола."
      },
      {
        q: "Как да добавя нов член на екипа?",
        a: "Отидете в Настройки > Членове на екипа и използвайте бутона 'Покани потребител'."
      },
      {
        q: "Как да променя данните на компанията?",
        a: "Отидете в Настройки > Компания и редактирайте информацията там."
      }
    ]
  },
  {
    title: "Импорт и експорт",
    questions: [
      {
        q: "В какви формати мога да експортирам фактури?",
        a: "Можете да експортирате фактури в PDF и CSV формат. PDF е подходящ за изпращане на клиенти, а CSV за импорт в други системи."
      },
      {
        q: "Как да импортирам клиенти?",
        a: "Отидете в секцията 'Клиенти' и използвайте опцията 'Импорт'. Качете CSV файл с необходимите колони."
      }
    ]
  }
];

export default function HelpPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">Помощ и поддръжка</h1>
          <p className="text-muted-foreground">
            Намерете отговори на вашите въпроси и научете как да използвате {APP_NAME}
          </p>
        </div>

        {/* Important Notice */}
        <Card className="border-2 border-amber-500/30 bg-linear-to-br from-amber-50/50 to-orange-50/30 dark:from-amber-950/20 dark:to-orange-950/10">
          <CardContent className="p-6">
            <div className="flex gap-4 items-start">
              <div className="h-10 w-10 rounded-lg bg-linear-to-br from-amber-500 to-orange-500 flex items-center justify-center shrink-0">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Какво е {APP_NAME}?</h3>
                <p className="text-muted-foreground">
                  {APP_NAME} е <strong>софтуер за издаване на фактури</strong>, а не платежна система. 
                  Помагаме ви да създавате професионални фактури и да ги изпращате на клиентите си. 
                  Плащанията се извършват директно между вас и вашите клиенти чрез банков превод или друг метод по ваш избор.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Search */}
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Търсене в документацията..."
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-input bg-background focus:outline-hidden focus:ring-2 focus:ring-ring"
              />
            </div>
          </CardContent>
        </Card>

        {/* Quick Links */}
        <div>
          <h2 className="text-2xl font-semibold mb-4">Бързи линкове</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {quickLinks.map((link, index) => (
              <Link key={index} href={link.href}>
                <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer h-full">
                  <CardHeader>
                    <div className={`h-12 w-12 rounded-xl bg-linear-to-br ${link.color} flex items-center justify-center mb-3`}>
                      <link.icon className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle className="text-lg">{link.title}</CardTitle>
                    <CardDescription>{link.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center text-sm text-primary font-medium">
                      Научете повече
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* FAQ – HeroUI Accordion */}
        <div>
          <h2 className="text-2xl font-semibold mb-4">Често задавани въпроси</h2>
          <HelpFaqAccordion categories={faqCategories} />
        </div>

        {/* Additional Resources */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <div className="h-10 w-10 rounded-lg bg-linear-to-br from-blue-500 to-indigo-600 flex items-center justify-center mb-3">
                <BookOpen className="h-5 w-5 text-white" />
              </div>
              <CardTitle>Документация</CardTitle>
              <CardDescription>Пълна документация и ръководства</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full">
                <Link href="/docs" className="flex items-center whitespace-nowrap">
                  Преглед на документацията
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <div className="h-10 w-10 rounded-lg bg-linear-to-br from-purple-500 to-pink-600 flex items-center justify-center mb-3">
                <Video className="h-5 w-5 text-white" />
              </div>
              <CardTitle>Видео уроци</CardTitle>
              <CardDescription>Научете с видео инструкции</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full">
                <Link href="/docs/video-tutorials" className="flex items-center whitespace-nowrap">
                  Гледайте уроците
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <div className="h-10 w-10 rounded-lg bg-linear-to-br from-emerald-500 to-teal-600 flex items-center justify-center mb-3">
                <MessageCircle className="h-5 w-5 text-white" />
              </div>
              <CardTitle>Свържете се с нас</CardTitle>
              <CardDescription>Нуждаете се от помощ? Свържете се с нас</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button asChild variant="outline" className="w-full">
                <Link href="/contact" className="flex items-center whitespace-nowrap">
                  <Mail className="mr-2 h-4 w-4" />
                  Изпратете имейл
                </Link>
              </Button>
              <div className="text-sm text-muted-foreground text-center">
                или звъннете на <a href="tel:+359888123456" className="text-primary hover:underline">+359 888 123 456</a>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Legal & shortcuts */}
        <Card className="border border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Правна информация и бързи клавиши</CardTitle>
            <CardDescription>
              Документи за поверителност, условия и подсказки за използване
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <Button asChild variant="outline" size="sm">
                <Link href="/gdpr">GDPR</Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href="/terms">Условия за ползване</Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href="/privacy">Поверителност</Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href="/cookies">Бисквитки</Link>
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Натиснете <kbd className="rounded border border-border/80 bg-muted/60 px-1.5 py-0.5 font-mono text-xs">?</kbd> в приложението за списък с клавишни комбинации.
            </p>
          </CardContent>
        </Card>

        {/* Contact Support CTA */}
        <Card className="border-0 shadow-lg bg-linear-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20">
          <CardContent className="p-8 text-center">
            <HelpCircle className="h-12 w-12 text-emerald-600 mx-auto mb-4" />
            <h3 className="text-2xl font-semibold mb-2">Нуждаете се от допълнителна помощ?</h3>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Нашият екип за поддръжка е на разположение да ви помогне с всички ваши въпроси и проблеми.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg">
                <Link href="/contact" className="flex items-center whitespace-nowrap">
                  <MessageCircle className="mr-2 h-5 w-5" />
                  Свържете се с поддръжката
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/docs/faq" className="flex items-center whitespace-nowrap">
                  <BookOpen className="mr-2 h-5 w-5" />
                  Вижте FAQ
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Shield, Cookie } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { generateMetadata as genMeta } from "@/lib/seo";
import { APP_NAME } from "@/config/constants";

const LEGAL_UPDATED = "14 март 2026";

export const metadata: Metadata = genMeta({
  title: "Политика за поверителност",
  description: "Как InvoicyPro събира, използва и защитава вашата лична информация",
});

function LegalLinks() {
  return (
    <nav className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground border-t border-border/60 pt-6 mt-8">
      <Link href="/gdpr" className="hover:underline">GDPR</Link>
      <span aria-hidden>·</span>
      <Link href="/terms" className="hover:underline">Условия за ползване</Link>
      <span aria-hidden>·</span>
      <Link href="/privacy" className="font-medium text-foreground hover:underline">
        Поверителност
      </Link>
      <span aria-hidden>·</span>
      <Link href="/contact" className="hover:underline">Контакт</Link>
    </nav>
  );
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 sm:py-16 max-w-4xl">
        <Button variant="ghost" size="sm" asChild className="mb-6">
          <Link href="/" className="flex items-center whitespace-nowrap">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Назад към началната страница
          </Link>
        </Button>

        <Card className="border border-border/60 shadow-lg rounded-2xl overflow-hidden">
          <CardHeader className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-2xl sm:text-3xl">Политика за поверителност</CardTitle>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Последна актуализация: {LEGAL_UPDATED}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="prose prose-slate dark:prose-invert max-w-none space-y-8 text-muted-foreground">
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">1. Въведение</h2>
              <p>
                {APP_NAME} се ангажира да защитава вашата поверителност. Тази политика описва как събираме,
                използваме, съхраняваме и защитаваме вашата лична информация в съответствие с GDPR и приложимото
                законодателство.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">2. Информация, която събираме</h2>
              <p className="mb-2">Събираме следните видове информация:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li><strong>Лична информация</strong> — име, имейл, телефон при регистрация и профил</li>
                <li><strong>Бизнес информация</strong> — данни за компании (име, адрес, ЕИК/Булстат, ДДС номер, МОЛ и др.) и клиенти</li>
                <li><strong>Данни за фактури и документи</strong> — съдържание на фактури, кредитни и дебитни известия, които създавате</li>
                <li><strong>Информация за използване</strong> — логоване на действия за сигурност и поддръжка (напр. аудит логове)</li>
                <li><strong>Техническа информация</strong> — IP адрес, тип браузър, устройство при достъп до услугата</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">3. Как използваме информацията</h2>
              <p className="mb-2">Използваме събраната информация за:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Предоставяне и подобряване на услугата за фактуриране</li>
                <li>Комуникация с вас относно акаунта и важни промени</li>
                <li>Изпращане на известия за екип (покани, магически линкове) при използване на съответните функции</li>
                <li>Осигуряване на сигурност, предотвратяване на злоупотреби и спазване на правни задължения</li>
                <li>Анализ на използването в обобщен вид за подобряване на продукта (без идентифициране на отделни потребители)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">4. Споделяне на информация</h2>
              <p>
                Не продаваме вашата лична информация на трети страни. Може да споделяме данни само в следните случаи:
                с вашето съгласие; с доставчици на услуги (хостинг, имейл, плащания), които работят от наше име и са
                задължени да ги пазят поверителни; когато законът изисква това; за защита на правата и сигурността на
                {APP_NAME} и потребителите.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">5. Защита на данните</h2>
              <p>
                Използваме индустриални стандарти за сигурност: криптиране при пренос (HTTPS), защитено съхранение,
                контрол на достъпа и регулярен преглед на мерките. Данните се съхраняват в Европейския съюз при
                доставчици, съобразени с GDPR.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">5а. Срок на съхранение</h2>
              <p>
                Фактурите, кредитните и дебитните известия, Протокол по чл. 117 ЗДДС и придружаващите ги данни
                се пазят <strong>10 години</strong> след годината на издаване съгласно чл. 12, ал. 1 от Закона за
                счетоводството. При изтриване на акаунт личните ви данни (име, имейл, телефон, парола, OAuth
                токени) се премахват или анонимизират незабавно, а историческите счетоводни документи остават
                непроменени до изтичане на законовия срок. IP адреси и User-Agent в одитния лог се премахват при
                анонимизация на акаунта.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">6. Вашите права</h2>
              <p className="mb-2">Имате право на достъп, коригиране, изтриване, ограничаване на обработката, преносимост и възражение. Подробности за упражняването им са описани в нашата <Link href="/gdpr" className="text-primary font-medium hover:underline">GDPR страница</Link>. Можете също да изтриете акаунта си от Настройки → Профил.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">7. Бисквитки и подобни технологии</h2>
              <p>
                Използваме бисквитки и подобни технологии за функционирането на входа (сесии), за запазване на
                предпочитанията ви и за подобряване на изживяването и сигурността. Подробности са в нашата{" "}
                <Link href="/cookies" className="text-primary font-medium hover:underline">Политика за бисквитки</Link>.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">8. Съответствие с GDPR</h2>
              <p>
                Спазваме Общия регламент за защита на данните (GDPR). За повече информация относно правата ви и
                обработката на данните вижте <Link href="/gdpr" className="text-primary font-medium hover:underline">GDPR Съответствие</Link>.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">9. Контакт</h2>
              <p>
                За въпроси относно тази политика или личните ви данни моля свържете се с нас на{" "}
                <Link href="/contact" className="text-primary font-medium hover:underline">страницата за контакт</Link>.
              </p>
            </section>

            <LegalLinks />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { generateMetadata as genMeta } from "@/lib/seo";
import { APP_NAME } from "@/config/constants";

const LEGAL_UPDATED = "14 март 2026";

export const metadata: Metadata = genMeta({
  title: "Условия за ползване",
  description: "Условията за ползване на услугата InvoicyPro",
});

function LegalLinks() {
  return (
    <nav className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground border-t border-border/60 pt-6 mt-8">
      <Link href="/gdpr" className="hover:underline">GDPR</Link>
      <span aria-hidden>·</span>
      <Link href="/terms" className="font-medium text-foreground hover:underline">
        Условия за ползване
      </Link>
      <span aria-hidden>·</span>
      <Link href="/privacy" className="hover:underline">Поверителност</Link>
      <span aria-hidden>·</span>
      <Link href="/contact" className="hover:underline">Контакт</Link>
    </nav>
  );
}

export default function TermsPage() {
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
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-2xl sm:text-3xl">Условия за ползване</CardTitle>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Последна актуализация: {LEGAL_UPDATED}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="prose prose-slate dark:prose-invert max-w-none space-y-8 text-muted-foreground">
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">1. Приемане на условията</h2>
              <p>
                Като използвате {APP_NAME}, вие приемате и се съгласявате да бъдете обвързани с тези Условия за ползване.
                Ако не приемате някоя част от условията, не трябва да използвате услугата.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">2. Описание на услугата</h2>
              <p>
                {APP_NAME} е софтуерна услуга за фактуриране, създадена за български бизнеси. Позволява ви да създавате
                и управлявате фактури, кредитни и дебитни известия, клиенти, компании и продукти, да експортирате документи
                (PDF, CSV) и при по-високи планове — да изпращате фактури по имейл и да работите в екип. Услугата се
                предоставя „както е“ и „както е налична“.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">3. Регистрация и акаунт</h2>
              <p>
                За да използвате {APP_NAME}, трябва да създадете акаунт. Вие сте отговорни за поддържането на
                конфиденциалността на вашата парола и за всички дейности, извършени под вашия акаунт. Съобщете ни
                незабавно при предполагаема неоторизирана употреба.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">4. Използване на услугата</h2>
              <p>
                Съгласявате се да използвате услугата само за законни цели и по начин, който не нарушава правата на
                трети страни и не възпрепятства използването й от други потребители. Забранено е неоторизирано
                копиране, разпространяване или извличане на данни от системата за цели, несъвместими с тези условия.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">5. Интелектуална собственост</h2>
              <p>
                Всички права върху {APP_NAME} — софтуер, дизайн, текст, графика и други материали — са собственост на
                доставчика на услугата и са защитени от законите за авторско право и сродни права.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">6. Отказ от отговорност</h2>
              <p>
                {APP_NAME} се предоставя „както е“ без гаранции от всякакъв вид. Не гарантираме, че услугата ще бъде
                непрекъсната, безгрешна или безпроблемна. Вие носите отговорност за съдържанието на издаваните от вас
                документи и за съответствието им с приложимото законодателство.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">7. Ограничение на отговорността</h2>
              <p>
                В максималната степен, разрешена от приложимото законодателство, доставчикът на {APP_NAME} не носи
                отговорност за преки, непряки, случайни или последващи щети, произтичащи от използването или
                невъзможността за използване на услугата.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">8. Промени в условията</h2>
              <p>
                Запазваме си правото да променяме тези условия. При съществени промени ще уведомим потребителите
                (напр. чрез имейл или съобщение в приложението). Продължавайки да използвате услугата след влизането
                в сила на промените, вие приемате новите условия.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">9. Контакт</h2>
              <p>
                За въпроси относно тези условия моля свържете се с нас на{" "}
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

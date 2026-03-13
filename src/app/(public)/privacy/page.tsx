import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { generateMetadata as genMeta } from "@/lib/seo";
import { APP_NAME } from "@/config/constants";

export const metadata: Metadata = genMeta({
  title: "Политика за поверителност",
  description: "Политиката за поверителност на Invoicy",
});

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <Button variant="ghost" size="sm" asChild className="mb-6">
          <Link href="/" className="flex items-center whitespace-nowrap">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Назад към началната страница
          </Link>
        </Button>

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-3xl">Политика за поверителност</CardTitle>
            <p className="text-sm text-muted-foreground">Последна актуализация: {new Date().toLocaleDateString('bg-BG')}</p>
          </CardHeader>
          <CardContent className="prose prose-slate dark:prose-invert max-w-none space-y-6">
            <section>
              <h2 className="text-2xl font-semibold mb-4">1. Въведение</h2>
              <p className="text-muted-foreground">
                {APP_NAME} се ангажира да защитава вашата поверителност. Тази политика обяснява как събираме, 
                използваме и защитаваме вашата лична информация.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">2. Информация, която събираме</h2>
              <p className="text-muted-foreground mb-2">Събираме следните видове информация:</p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                <li>Лична информация (име, имейл, телефон) при регистрация</li>
                <li>Бизнес информация (име на компанията, адрес, данъчен номер)</li>
                <li>Информация за използване на услугата</li>
                <li>Техническа информация (IP адрес, тип браузър, устройство)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">3. Как използваме информацията</h2>
              <p className="text-muted-foreground mb-2">Използваме събраната информация за:</p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                <li>Предоставяне и подобряване на услугата</li>
                <li>Комуникация с вас относно услугата</li>
                <li>Изпращане на важни известия и актуализации</li>
                <li>Осигуряване на сигурност и предотвратяване на измами</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">4. Споделяне на информация</h2>
              <p className="text-muted-foreground">
                Не продаваме вашата лична информация на трети страни. Може да споделяме информация само в 
                следните случаи: с вашето съгласие, за да изпълним правни задължения, или с доставчици на услуги, 
                които работят от наше име.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">5. Защита на данните</h2>
              <p className="text-muted-foreground">
                Използваме индустриални стандарти за сигурност, за да защитим вашата информация. Всички данни 
                се предават по криптиран канал и се съхраняват в защитени сървъри.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">6. Вашите права</h2>
              <p className="text-muted-foreground mb-2">Имате право да:</p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                <li>Достъп до вашата лична информация</li>
                <li>Коригиране на неточна информация</li>
                <li>Изтриване на вашата информация</li>
                <li>Възражение срещу обработката на вашите данни</li>
                <li>Портабилност на данните</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">7. Бисквитки</h2>
              <p className="text-muted-foreground">
                Използваме бисквитки и подобни технологии за подобряване на вашето изживяване, анализиране на 
                използването и персонализиране на съдържанието.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">8. GDPR съответствие</h2>
              <p className="text-muted-foreground">
                Спазваме Общия регламент за защита на данните (GDPR) и гарантираме, че вашите права са защитени.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">9. Контакт</h2>
              <p className="text-muted-foreground">
                За въпроси относно тази политика, моля свържете се с нас на <Link href="/contact" className="text-emerald-600 hover:underline">страницата за контакти</Link>.
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

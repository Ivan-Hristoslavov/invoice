import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { generateMetadata as genMeta } from "@/lib/seo";
import { APP_NAME } from "@/config/constants";

export const metadata: Metadata = genMeta({
  title: "GDPR Съответствие",
  description: "Информация за GDPR съответствието на FacturaPro",
});

export default function GDPRPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <Button variant="ghost" size="sm" asChild className="mb-6">
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Назад към началната страница
          </Link>
        </Button>

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <Shield className="h-8 w-8 text-emerald-500" />
              <CardTitle className="text-3xl">GDPR Съответствие</CardTitle>
            </div>
            <p className="text-sm text-muted-foreground">Последна актуализация: {new Date().toLocaleDateString('bg-BG')}</p>
          </CardHeader>
          <CardContent className="prose prose-slate dark:prose-invert max-w-none space-y-6">
            <section>
              <h2 className="text-2xl font-semibold mb-4">Нашето ангажиране</h2>
              <p className="text-muted-foreground">
                {APP_NAME} е ангажиран да спазва Общия регламент за защита на данните (GDPR) и да защитава 
                правата на всички наши потребители. Ние обработваме личните ви данни прозрачно, законно и справедливо.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">Вашите права по GDPR</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-semibold mb-2">Право на достъп</h3>
                  <p className="text-muted-foreground">
                    Имате право да получите копие от личните данни, които обработваме за вас.
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Право на коригиране</h3>
                  <p className="text-muted-foreground">
                    Можете да поискате корекция на неточни или непълни лични данни.
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Право на изтриване</h3>
                  <p className="text-muted-foreground">
                    Можете да поискате изтриване на вашите лични данни в определени обстоятелства.
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Право на ограничаване</h3>
                  <p className="text-muted-foreground">
                    Можете да поискате ограничаване на обработката на вашите данни.
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Право на преносимост</h3>
                  <p className="text-muted-foreground">
                    Можете да получите вашите данни в структуриран формат и да ги прехвърлите към друг доставчик.
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Право на възражение</h3>
                  <p className="text-muted-foreground">
                    Можете да възразите срещу обработката на вашите данни за определени цели.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">Как да упражните правата си</h2>
              <p className="text-muted-foreground">
                За да упражните някое от вашите права, моля свържете се с нас на <Link href="/contact" className="text-emerald-600 hover:underline">страницата за контакти</Link>. 
                Ще отговорим на вашето искане в рамките на 30 дни.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">Защита на данните</h2>
              <p className="text-muted-foreground">
                Използваме индустриални стандарти за сигурност, включително криптиране, за да защитим вашите данни. 
                Регулярно проверяваме и актуализираме нашите мерки за сигурност.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">Прехвърляне на данни</h2>
              <p className="text-muted-foreground">
                Вашите данни се съхраняват в Европейския съюз. Ако се наложи да прехвърлим данни извън ЕС, 
                ще гарантираме адекватна защита в съответствие с GDPR.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">Контактен лице за защита на данните</h2>
              <p className="text-muted-foreground">
                За въпроси относно обработката на лични данни, моля свържете се с нас на <Link href="/contact" className="text-emerald-600 hover:underline">страницата за контакти</Link>.
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

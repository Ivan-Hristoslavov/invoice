import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { generateMetadata as genMeta } from "@/lib/seo";
import { APP_NAME } from "@/config/constants";

const LEGAL_UPDATED = "14 март 2026";

export const metadata: Metadata = genMeta({
  title: "GDPR Съответствие",
  description: "Информация за GDPR съответствието и правата ви върху личните данни при използване на InvoicyPro",
});

function LegalLinks() {
  return (
    <nav className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground border-t border-border/60 pt-6 mt-8">
      <Link href="/gdpr" className="font-medium text-foreground hover:underline">
        GDPR
      </Link>
      <span aria-hidden>·</span>
      <Link href="/terms" className="hover:underline">Условия за ползване</Link>
      <span aria-hidden>·</span>
      <Link href="/privacy" className="hover:underline">Поверителност</Link>
      <span aria-hidden>·</span>
      <Link href="/contact" className="hover:underline">Контакт</Link>
    </nav>
  );
}

export default function GDPRPage() {
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
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-2xl sm:text-3xl">GDPR Съответствие</CardTitle>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Последна актуализация: {LEGAL_UPDATED}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="prose prose-slate dark:prose-invert max-w-none space-y-8 text-muted-foreground">
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">Нашето ангажиране</h2>
              <p>
                {APP_NAME} е ангажиран да спазва Общия регламент за защита на данните (ЕС 2016/679 – GDPR) и
                да защитава правата на всички потребители. Обработваме личните ви данни прозрачно, на законни
                основания и по справедлив начин. Данните ви се съхраняват в Европейския съюз при доставчици,
                съобразени с GDPR.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">Вашите права по GDPR</h2>
              <ul className="space-y-3 list-none pl-0">
                <li className="flex gap-2">
                  <span className="text-primary font-medium">Право на достъп</span>
                  — да получите копие от личните данни, които обработваме за вас.
                </li>
                <li className="flex gap-2">
                  <span className="text-primary font-medium">Право на коригиране</span>
                  — да поискате поправка на неточни или непълни лични данни.
                </li>
                <li className="flex gap-2">
                  <span className="text-primary font-medium">Право на изтриване</span>
                  — да поискате изтриване на вашите данни при наличието на законни основания („право да бъдете забравени“).
                </li>
                <li className="flex gap-2">
                  <span className="text-primary font-medium">Право на ограничаване</span>
                  — да поискате ограничаване на обработката в определени случаи.
                </li>
                <li className="flex gap-2">
                  <span className="text-primary font-medium">Право на преносимост</span>
                  — да получите данните си в структуриран, машиночетим формат и да ги прехвърлите към друг доставчик.
                </li>
                <li className="flex gap-2">
                  <span className="text-primary font-medium">Право на възражение</span>
                  — да възразите срещу обработката за определени цели, включително за директен маркетинг.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">Как да упражните правата си</h2>
              <p>
                За да подадете искане за достъп, коригиране, изтриване или друго от горните права, моля свържете се с нас
                на <Link href="/contact" className="text-primary font-medium hover:underline">страницата за контакт</Link>.
                Ще отговорим в рамките на <strong>30 дни</strong> от получаване на искането. Можете също да изтриете
                акаунта си от Настройки → Профил в приложението, като това води до изтриване на свързаните с акаунта данни
                в рамките на нашата политика за съхранение.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">Защита на данните</h2>
              <p>
                Използваме индустриални стандарти за сигурност: криптиране при пренос (HTTPS), защитено съхранение
                на данни и контрол на достъпа. Регулярно преглеждаме и актуализираме мерките за сигурност и
                обработката на лични данни.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">Прехвърляне на данни извън ЕС</h2>
              <p>
                Вашите данни се съхраняват в Европейския съюз. Ако наложи да използваме подпроцесори извън ЕС,
                ще гарантираме подходящи гаранции в съответствие с GDPR (например стандартни договорни клаузи,
                одобрени от Комисията).
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">Контактен лице за защита на данните</h2>
              <p>
                За въпроси относно обработката на лични данни и упражняване на правата си можете да се свържете с нас
                на <Link href="/contact" className="text-primary font-medium hover:underline">страницата за контакт</Link>.
              </p>
            </section>

            <LegalLinks />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

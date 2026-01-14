import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Cookie } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { generateMetadata as genMeta } from "@/lib/seo";
import { APP_NAME } from "@/config/constants";

export const metadata: Metadata = genMeta({
  title: "Политика за бисквитки",
  description: "Информация за използването на бисквитки в FacturaPro",
});

export default function CookiesPage() {
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
              <Cookie className="h-8 w-8 text-amber-500" />
              <CardTitle className="text-3xl">Политика за бисквитки</CardTitle>
            </div>
            <p className="text-sm text-muted-foreground">Последна актуализация: {new Date().toLocaleDateString('bg-BG')}</p>
          </CardHeader>
          <CardContent className="prose prose-slate dark:prose-invert max-w-none space-y-6">
            <section>
              <h2 className="text-2xl font-semibold mb-4">Какво са бисквитките?</h2>
              <p className="text-muted-foreground">
                Бисквитките са малки текстови файлове, които се съхраняват на вашето устройство, когато посещавате уебсайт. 
                Те помагат на уебсайта да запомни вашите предпочитания и да подобри вашето изживяване.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">Как използваме бисквитките?</h2>
              <p className="text-muted-foreground mb-2">Използваме бисквитки за:</p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                <li>Запазване на вашите предпочитания и настройки</li>
                <li>Автентикация и сигурност</li>
                <li>Анализиране на използването на сайта</li>
                <li>Подобряване на функционалността</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">Видове бисквитки</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-semibold mb-2">Необходими бисквитки</h3>
                  <p className="text-muted-foreground">
                    Тези бисквитки са необходими за основното функциониране на сайта и не могат да бъдат деактивирани.
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Функционални бисквитки</h3>
                  <p className="text-muted-foreground">
                    Позволяват на сайта да запомни вашите избори и да предостави подобрени функции.
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Аналитични бисквитки</h3>
                  <p className="text-muted-foreground">
                    Помагат ни да разберем как посетителите използват сайта, за да го подобрим.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">Управление на бисквитките</h2>
              <p className="text-muted-foreground">
                Можете да контролирате и управлявате бисквитките чрез настройките на вашия браузър. 
                Имайте предвид, че деактивирането на някои бисквитки може да повлияе на функционалността на сайта.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">Контакт</h2>
              <p className="text-muted-foreground">
                За въпроси относно използването на бисквитки, моля свържете се с нас на <Link href="/contact" className="text-emerald-600 hover:underline">страницата за контакти</Link>.
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

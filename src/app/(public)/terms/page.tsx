import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { generateMetadata as genMeta } from "@/lib/seo";
import { APP_NAME } from "@/config/constants";

export const metadata: Metadata = genMeta({
  title: "Условия за ползване",
  description: "Условията за ползване на Invoicy",
});

export default function TermsPage() {
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
            <CardTitle className="text-3xl">Условия за ползване</CardTitle>
            <p className="text-sm text-muted-foreground">Последна актуализация: {new Date().toLocaleDateString('bg-BG')}</p>
          </CardHeader>
          <CardContent className="prose prose-slate dark:prose-invert max-w-none space-y-6">
            <section>
              <h2 className="text-2xl font-semibold mb-4">1. Приемане на условията</h2>
              <p className="text-muted-foreground">
                Като използвате {APP_NAME}, вие приемате и се съгласявате да бъдете обвързани с тези Условия за ползване. 
                Ако не се съгласявате с някоя част от условията, не трябва да използвате услугата.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">2. Описание на услугата</h2>
              <p className="text-muted-foreground">
                {APP_NAME} е софтуерна услуга за фактуриране, която позволява на потребителите да създават, 
                управляват и проследяват фактури. Услугата се предоставя "както е" и "както е налична".
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">3. Регистрация и акаунт</h2>
              <p className="text-muted-foreground">
                За да използвате {APP_NAME}, трябва да създадете акаунт. Вие сте отговорни за поддържането 
                на конфиденциалността на вашата парола и за всички дейности, които се извършват под вашия акаунт.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">4. Използване на услугата</h2>
              <p className="text-muted-foreground">
                Вие се съгласявате да използвате услугата само за законни цели и по начин, който не нарушава 
                правата на трети страни или не ограничава или възпрепятства използването на услугата от други потребители.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">5. Интелектуална собственост</h2>
              <p className="text-muted-foreground">
                Всички права върху {APP_NAME}, включително софтуер, дизайн, текст, графика и други материали, 
                са собственост на {APP_NAME} и са защитени от законите за авторско право и други закони.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">6. Отказ от отговорност</h2>
              <p className="text-muted-foreground">
                {APP_NAME} се предоставя "както е" без гаранции от всякакъв вид. Не гарантираме, че услугата 
                ще бъде непрекъсната, безгрешна или безпроблемна.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">7. Ограничение на отговорността</h2>
              <p className="text-muted-foreground">
                В максималната степен, разрешена от закона, {APP_NAME} не носи отговорност за каквито и да било 
                преки, непряки, случайни или последващи щети, произтичащи от използването на услугата.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">8. Промени в условията</h2>
              <p className="text-muted-foreground">
                Запазваме си правото да променяме тези условия по всяко време. Продължавайки да използвате 
                услугата след промените, вие приемате новите условия.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">9. Контакт</h2>
              <p className="text-muted-foreground">
                За въпроси относно тези условия, моля свържете се с нас на <Link href="/contact" className="text-emerald-600 hover:underline">страницата за контакти</Link>.
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

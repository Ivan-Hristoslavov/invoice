import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Mail, Phone, MapPin, CalendarClock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { generateMetadata as genMeta } from "@/lib/seo";
import { APP_NAME } from "@/config/constants";
import { publicBusinessProfile } from "@/config/public-business";
import { ContactRequestForm } from "@/components/marketing/ContactRequestForm";

export const metadata: Metadata = genMeta({
  title: "Контакти",
  description: "Свържете се с екипа на Invoicy. Отговаряме на всички ваши въпроси",
});

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16 max-w-6xl">
        {/* Header */}
        <div className="mb-12">
          <Button variant="ghost" size="sm" asChild className="mb-6">
              <Link href="/" className="flex items-center whitespace-nowrap">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Назад към началната страница
              </Link>
          </Button>
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            Свържете се с нас
          </h1>
          <p className="text-xl text-muted-foreground">
            Пишете ни — отговаряме в посочените работни часове
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {/* Contact Form */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Изпратете запитване</CardTitle>
              <CardDescription>
                Попълнете формата и ще отговорим {publicBusinessProfile.supportResponseHours}.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ContactRequestForm />
            </CardContent>
          </Card>

          {/* Contact Info */}
          <div className="space-y-6">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Контактна информация</CardTitle>
                <CardDescription>
                  Свържете се с нас по удобен за вас начин
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/20 flex items-center justify-center shrink-0">
                    <Mail className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <div className="font-semibold mb-1">Имейл</div>
                    <a href={`mailto:${publicBusinessProfile.supportEmail}`} className="text-muted-foreground hover:text-emerald-600 transition-colors">
                      {publicBusinessProfile.supportEmail}
                    </a>
                  </div>
                </div>
                {publicBusinessProfile.supportPhone ? (
                  <div className="flex items-start gap-4">
                    <div className="h-10 w-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/20 flex items-center justify-center shrink-0">
                      <Phone className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <div className="font-semibold mb-1">Телефон</div>
                      <a href={`tel:${publicBusinessProfile.supportPhone.replace(/\s+/g, "")}`} className="text-muted-foreground hover:text-emerald-600 transition-colors">
                        {publicBusinessProfile.supportPhone}
                      </a>
                    </div>
                  </div>
                ) : null}
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/20 flex items-center justify-center shrink-0">
                    <MapPin className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <div className="font-semibold mb-1">Адрес</div>
                    <p className="text-muted-foreground">
                      {publicBusinessProfile.legalAddress || "България"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Поддръжка и демо</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Понеделник - Петък</span>
                    <span className="font-medium">09:00 - 18:00</span>
                  </div>
                  <div className="flex items-start gap-2 pt-2">
                    <CalendarClock className="h-4 w-4 mt-0.5 text-emerald-600" />
                    <div>
                      <p className="text-muted-foreground">
                        Отговор на запитвания: {publicBusinessProfile.supportResponseHours}
                      </p>
                      {publicBusinessProfile.calendlyDemoUrl ? (
                        <Button size="sm" variant="outline" asChild className="mt-3">
                          <Link href={publicBusinessProfile.calendlyDemoUrl} target="_blank" rel="noopener noreferrer">
                            Заяви 15-мин демо
                          </Link>
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

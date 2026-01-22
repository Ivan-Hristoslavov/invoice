import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Mail, Phone, MapPin, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { generateMetadata as genMeta } from "@/lib/seo";
import { APP_NAME } from "@/config/constants";

export const metadata: Metadata = genMeta({
  title: "Контакти",
  description: "Свържете се с екипа на Invoicy. Отговорим на всички ваши въпроси",
});

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16 max-w-6xl">
        {/* Header */}
        <div className="mb-12">
          <Button variant="ghost" size="sm" asChild className="mb-6">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Назад към началната страница
            </Link>
          </Button>
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            Свържете се с нас
          </h1>
          <p className="text-xl text-muted-foreground">
            Имате въпрос? Ще се радваме да чуем от вас
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {/* Contact Form */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Изпратете ни съобщение</CardTitle>
              <CardDescription>
                Попълнете формата и ще се свържем с вас възможно най-скоро
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Име</Label>
                  <Input id="name" placeholder="Вашето име" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Имейл</Label>
                  <Input id="email" type="email" placeholder="vasheto@email.com" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject">Тема</Label>
                  <Input id="subject" placeholder="Тема на съобщението" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">Съобщение</Label>
                  <Textarea id="message" placeholder="Вашето съобщение..." rows={6} required />
                </div>
                <Button type="submit" className="w-full">
                  <Send className="mr-2 h-4 w-4" />
                  Изпрати съобщение
                </Button>
              </form>
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
                  <div className="h-10 w-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/20 flex items-center justify-center flex-shrink-0">
                    <Mail className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <div className="font-semibold mb-1">Имейл</div>
                    <a href="mailto:info@invoicy.bg" className="text-muted-foreground hover:text-emerald-600 transition-colors">
                      info@invoicy.bg
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/20 flex items-center justify-center flex-shrink-0">
                    <Phone className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <div className="font-semibold mb-1">Телефон</div>
                    <a href="tel:+359888123456" className="text-muted-foreground hover:text-emerald-600 transition-colors">
                      +359 888 123 456
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/20 flex items-center justify-center flex-shrink-0">
                    <MapPin className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <div className="font-semibold mb-1">Адрес</div>
                    <p className="text-muted-foreground">
                      София, България
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Работно време</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Понеделник - Петък</span>
                    <span className="font-medium">09:00 - 18:00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Събота - Неделя</span>
                    <span className="font-medium">Почивни дни</span>
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

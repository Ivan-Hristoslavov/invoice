import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Briefcase, MapPin, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { generateMetadata as genMeta } from "@/lib/seo";
import { APP_NAME } from "@/config/constants";

export const metadata: Metadata = genMeta({
  title: "Кариери",
  description: "Присъединете се към екипа на Invoicy и помогнете да опростим фактурирането за българските бизнеси",
});

const positions = [
  {
    title: "Senior Full Stack Developer",
    location: "София / Remote",
    type: "Пълен работен ден",
    description: "Търсим опитен разработчик за работа върху нашия Next.js стек."
  },
  {
    title: "Product Designer",
    location: "София / Remote",
    type: "Пълен работен ден",
    description: "Търсим креативен дизайнер, който да подобри потребителския опит."
  },
  {
    title: "Customer Success Manager",
    location: "София",
    type: "Пълен работен ден",
    description: "Помогнете на нашите клиенти да постигнат успех с Invoicy."
  }
];

export default function CareersPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        {/* Header */}
        <div className="mb-12">
          <Button variant="ghost" size="sm" asChild className="mb-6">
              <Link href="/" className="flex items-center whitespace-nowrap">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Назад към началната страница
              </Link>
          </Button>
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            Кариери в {APP_NAME}
          </h1>
          <p className="text-xl text-muted-foreground">
            Присъединете се към нашия екип и помогнете да опростим фактурирането за българските бизнеси
          </p>
        </div>

        {/* Why Join Us */}
        <Card className="border-0 shadow-lg mb-12">
          <CardHeader>
            <CardTitle className="text-2xl">Защо да се присъедините?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-muted-foreground">
            <p>
              В {APP_NAME} вярваме в създаването на отлични продукти, които наистина помагат на хората. 
              Нашият екип е страстен, иновативен и фокусиран върху успеха на клиентите.
            </p>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-emerald-500">•</span>
                <span>Работа върху интересни и предизвикателни проекти</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500">•</span>
                <span>Гъвкави работни условия и remote работа</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500">•</span>
                <span>Възможности за професионално развитие</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500">•</span>
                <span>Конкурентна заплата и бонуси</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Open Positions */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Отворени позиции</h2>
          <div className="space-y-4">
            {positions.map((position, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardHeader>
                  <CardTitle>{position.title}</CardTitle>
                  <CardDescription>{position.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      <span>{position.location}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{position.type}</span>
                    </div>
                  </div>
                  <Button variant="outline" asChild>
                    <Link href="/contact">
                      Кандидатствайте
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* No Open Positions */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <Briefcase className="h-8 w-8 text-emerald-500 mb-2" />
            <CardTitle>Не виждате подходяща позиция?</CardTitle>
            <CardDescription>
              Винаги търсим талантливи хора. Свържете се с нас и разкажете ни за себе си.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/contact">
                Свържете се с нас
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

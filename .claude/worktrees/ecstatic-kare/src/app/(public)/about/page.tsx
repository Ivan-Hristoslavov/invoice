import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Target, Users, Award, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { generateMetadata as genMeta } from "@/lib/seo";
import { APP_NAME } from "@/config/constants";

export const metadata: Metadata = genMeta({
  title: "За нас",
  description: "Научете повече за Invoicy и нашата мисия да опростим фактурирането за българските бизнеси",
});

const values = [
  {
    icon: Target,
    title: "Мисия",
    description:
      "По-малко време в таблици и файлове, повече във вашия бизнес — с ясни фактури и известия.",
  },
  {
    icon: Users,
    title: "Клиенти",
    description:
      "Слушаме обратната връзка и подобряваме нещата, които реално ви спъват в ежедневието.",
  },
  {
    icon: Award,
    title: "Качество",
    description:
      "Стабилна работа, предвидими екрани и внимание към дреболиите, които ви спестяват грешки.",
  },
  {
    icon: Heart,
    title: "Развитие",
    description:
      "Добавяме функции, които имат смисъл за български фирми и счетоводители — не за броя на менютата.",
  },
];

export default function AboutPage() {
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
            За {APP_NAME}
          </h1>
          <p className="text-xl text-muted-foreground">
            Фактури и документи в един инструмент — мислен за малки екипи и счетоводства в България
          </p>
        </div>

        {/* Story */}
        <Card className="border-0 shadow-lg mb-12">
          <CardHeader>
            <CardTitle className="text-2xl">Нашата история</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-muted-foreground">
            <p>
              {APP_NAME} помага да издавате фактури и известия без да се губите в сложни системи.
              Знаем колко е важно реквизитите да са наред пред счетоводството и клиента.
            </p>
            <p>
              От едно място управлявате клиенти, фирми и документи. Номерата и полетата са подредени
              според българската практика — за да не губите време в обяснения и поправки.
            </p>
          </CardContent>
        </Card>

        {/* Values */}
        <div className="grid gap-6 md:grid-cols-2 mb-12">
          {values.map((value) => (
            <Card key={value.title} className="border-0 shadow-lg">
              <CardHeader>
                <value.icon className="h-8 w-8 text-emerald-500 mb-2" />
                <CardTitle>{value.title}</CardTitle>
                <CardDescription>{value.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>

        {/* Trust Principles */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
          <div className="text-center">
            <div className="text-2xl font-bold text-emerald-600 mb-2">Прозрачност</div>
            <div className="text-sm text-muted-foreground">Ясни планове, условия и лимити</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-emerald-600 mb-2">Сигурност</div>
            <div className="text-sm text-muted-foreground">Надеждна платформа и GDPR съответствие</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-emerald-600 mb-2">Локален фокус</div>
            <div className="text-sm text-muted-foreground">Създадено за български бизнес и практика</div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-4">Присъединете се към нас</h2>
          <p className="text-muted-foreground mb-8">
            Станете част от общността на доволни клиенти
          </p>
          <Button size="lg" asChild>
            <Link href="/signup">
              Започнете безплатно
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

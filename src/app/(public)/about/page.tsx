import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Target, Users, Award, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { generateMetadata as genMeta } from "@/lib/seo";
import { APP_NAME } from "@/config/constants";

export const metadata: Metadata = genMeta({
  title: "За нас",
  description: "Научете повече за FacturaPro и нашата мисия да опростим фактурирането за българските бизнеси",
});

const values = [
  {
    icon: Target,
    title: "Нашата мисия",
    description: "Да направим фактурирането лесно и достъпно за всеки български бизнес, независимо от размера му."
  },
  {
    icon: Users,
    title: "Фокус върху клиентите",
    description: "Вашето удовлетворение е наш приоритет. Постоянно подобряваме продукта въз основа на вашите обратни връзки."
  },
  {
    icon: Award,
    title: "Качество",
    description: "Стремим се към най-високите стандарти за качество във всеки аспект на нашия продукт."
  },
  {
    icon: Heart,
    title: "Иновации",
    description: "Постоянно търсим нови начини да подобрим вашия опит и да направим работата ви по-лесна."
  }
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        {/* Header */}
        <div className="mb-12">
          <Button variant="ghost" size="sm" asChild className="mb-6">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Назад към началната страница
            </Link>
          </Button>
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            За {APP_NAME}
          </h1>
          <p className="text-xl text-muted-foreground">
            Професионална система за фактуриране, създадена специално за българските бизнеси
          </p>
        </div>

        {/* Story */}
        <Card className="border-0 shadow-lg mb-12">
          <CardHeader>
            <CardTitle className="text-2xl">Нашата история</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-muted-foreground">
            <p>
              {APP_NAME} е създаден с цел да опрости фактурирането за българските бизнеси. 
              Разбираме предизвикателствата, пред които сте изправени - от сложните данъчни изисквания 
              до необходимостта от професионални фактури, които да отговарят на всички стандарти.
            </p>
            <p>
              Нашата платформа комбинира лекотата на използване с мощни функции, които ви позволяват 
              да управлявате целия процес на фактуриране от едно място. С пълна НАП съвместимост и 
              автоматично генериране на номера, можете да се фокусирате върху това, което наистина 
              има значение - вашия бизнес.
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

        {/* Stats */}
        <div className="grid grid-cols-3 gap-6 mb-12">
          <div className="text-center">
            <div className="text-4xl font-bold text-emerald-600 mb-2">1000+</div>
            <div className="text-sm text-muted-foreground">Активни потребители</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-emerald-600 mb-2">50K+</div>
            <div className="text-sm text-muted-foreground">Създадени фактури</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-emerald-600 mb-2">99.9%</div>
            <div className="text-sm text-muted-foreground">Uptime</div>
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

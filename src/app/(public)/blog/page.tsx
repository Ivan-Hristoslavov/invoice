import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Calendar, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { generateMetadata as genMeta } from "@/lib/seo";
import { APP_NAME } from "@/config/constants";

export const metadata: Metadata = genMeta({
  title: "Блог",
  description: "Полезни статии и съвети за фактуриране, данъци и управление на бизнес",
});

const blogPosts = [
  {
    title: "Как да създадете професионална фактура",
    excerpt: "Научете основните стъпки за създаване на професионална фактура, която отговаря на всички изисквания.",
    date: "15 януари 2026",
    author: "Екип InvoicyPro",
    category: "Ръководства"
  },
  {
    title: "НАП изисквания за фактури - Пълно ръководство",
    excerpt: "Всичко, което трябва да знаете за изискванията на НАП за фактури в България.",
    date: "10 януари 2026",
    author: "Екип InvoicyPro",
    category: "Данъци"
  },
  {
    title: "10 начина да ускорите процеса на фактуриране",
    excerpt: "Практични съвети за оптимизиране на вашия процес на фактуриране и спестяване на време.",
    date: "5 януари 2026",
    author: "Екип InvoicyPro",
    category: "Продуктивност"
  }
];

export default function BlogPage() {
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
            Блог
          </h1>
          <p className="text-xl text-muted-foreground">
            Полезни статии и съвети за фактуриране, данъци и управление на бизнес
          </p>
        </div>

        {/* Blog Posts */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {blogPosts.map((post, index) => (
            <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-1 rounded text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400">
                    {post.category}
                  </span>
                </div>
                <CardTitle className="text-xl">{post.title}</CardTitle>
                <CardDescription>{post.excerpt}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>{post.date}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    <span>{post.author}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Coming Soon */}
        <Card className="mt-12 border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Още статии скоро</CardTitle>
            <CardDescription>
              Работим върху нови полезни статии и ръководства. Регистрирайте се, за да получавате известия за нови публикации.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/signup" className="flex items-center whitespace-nowrap">
                Регистрирайте се безплатно
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

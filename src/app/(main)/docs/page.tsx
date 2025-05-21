import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronRightIcon, BookOpenIcon, QuestionMarkCircleIcon, RocketIcon } from 'lucide-react';

export default function DocumentationPage() {
  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold mb-2">Документация на RapidFrame</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Научете как да използвате RapidFrame за управление на фактури, клиенти и плащания
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center">
              <BookOpenIcon className="mr-2 h-5 w-5 text-primary" />
              Ръководство
            </CardTitle>
            <CardDescription>
              Подробни инструкции за всички функционалности
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              <li className="flex">
                <ChevronRightIcon className="mr-1 h-4 w-4 text-muted-foreground" />
                <Link href="/docs/guides/invoices" className="hover:underline text-primary">
                  Управление на фактури
                </Link>
              </li>
              <li className="flex">
                <ChevronRightIcon className="mr-1 h-4 w-4 text-muted-foreground" />
                <Link href="/docs/guides/clients" className="hover:underline text-primary">
                  Управление на клиенти
                </Link>
              </li>
              <li className="flex">
                <ChevronRightIcon className="mr-1 h-4 w-4 text-muted-foreground" />
                <Link href="/docs/guides/payments" className="hover:underline text-primary">
                  Плащания и финанси
                </Link>
              </li>
              <li className="flex">
                <ChevronRightIcon className="mr-1 h-4 w-4 text-muted-foreground" />
                <Link href="/docs/guides/settings" className="hover:underline text-primary">
                  Настройки на профила
                </Link>
              </li>
            </ul>
            <Button asChild className="w-full mt-4" variant="outline">
              <Link href="/docs/guides">
                Преглед на всички ръководства
              </Link>
            </Button>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center">
              <QuestionMarkCircleIcon className="mr-2 h-5 w-5 text-primary" />
              Често задавани въпроси
            </CardTitle>
            <CardDescription>
              Бързи отговори на популярни въпроси
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              <li className="flex">
                <ChevronRightIcon className="mr-1 h-4 w-4 text-muted-foreground" />
                <Link href="/docs/faq#billing" className="hover:underline text-primary">
                  Въпроси за фактуриране
                </Link>
              </li>
              <li className="flex">
                <ChevronRightIcon className="mr-1 h-4 w-4 text-muted-foreground" />
                <Link href="/docs/faq#account" className="hover:underline text-primary">
                  Управление на акаунт
                </Link>
              </li>
              <li className="flex">
                <ChevronRightIcon className="mr-1 h-4 w-4 text-muted-foreground" />
                <Link href="/docs/faq#export" className="hover:underline text-primary">
                  Експорт и импорт
                </Link>
              </li>
              <li className="flex">
                <ChevronRightIcon className="mr-1 h-4 w-4 text-muted-foreground" />
                <Link href="/docs/faq#legal" className="hover:underline text-primary">
                  Правни въпроси
                </Link>
              </li>
            </ul>
            <Button asChild className="w-full mt-4" variant="outline">
              <Link href="/docs/faq">
                Преглед на всички въпроси
              </Link>
            </Button>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center">
              <RocketIcon className="mr-2 h-5 w-5 text-primary" />
              Бързо начало
            </CardTitle>
            <CardDescription>
              Започнете работа с RapidFrame за минути
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              <li className="flex">
                <ChevronRightIcon className="mr-1 h-4 w-4 text-muted-foreground" />
                <Link href="/docs/quickstart/setup" className="hover:underline text-primary">
                  Настройка на профил
                </Link>
              </li>
              <li className="flex">
                <ChevronRightIcon className="mr-1 h-4 w-4 text-muted-foreground" />
                <Link href="/docs/quickstart/first-invoice" className="hover:underline text-primary">
                  Създаване на първа фактура
                </Link>
              </li>
              <li className="flex">
                <ChevronRightIcon className="mr-1 h-4 w-4 text-muted-foreground" />
                <Link href="/docs/quickstart/client-management" className="hover:underline text-primary">
                  Управление на клиенти
                </Link>
              </li>
              <li className="flex">
                <ChevronRightIcon className="mr-1 h-4 w-4 text-muted-foreground" />
                <Link href="/docs/quickstart/tips" className="hover:underline text-primary">
                  Съвети и трикове
                </Link>
              </li>
            </ul>
            <Button asChild className="w-full mt-4" variant="outline">
              <Link href="/docs/quickstart">
                Започнете сега
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
      
      <div className="mt-12 text-center">
        <h2 className="text-2xl font-semibold mb-4">Нужна ли ви е допълнителна помощ?</h2>
        <div className="flex flex-wrap justify-center gap-4">
          <Button asChild variant="outline">
            <Link href="/support">
              Свържете се с поддръжка
            </Link>
          </Button>
          <Button asChild variant="default">
            <Link href="/docs/video-tutorials">
              Видео уроци
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
} 
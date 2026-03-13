import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronRightIcon, ArrowLeftIcon, FileTextIcon, UsersIcon, CreditCardIcon, SettingsIcon, BuildingIcon, LineChartIcon } from 'lucide-react';

// Данни за ръководствата
const guidesData = [
  {
    id: 'invoices',
    title: 'Управление на фактури',
    description: 'Научете как да създавате, изпращате и проследявате фактури',
    icon: FileTextIcon,
    topics: ['Създаване на фактура', 'Изпращане на фактура', 'Проследяване на плащания', 'Повтарящи се фактури'],
    difficulty: 'Начинаещи',
    timeToRead: '8 мин.'
  },
  {
    id: 'clients',
    title: 'Управление на клиенти',
    description: 'Научете как да управлявате информация за клиенти и контакти',
    icon: UsersIcon,
    topics: ['Добавяне на клиенти', 'Групиране на клиенти', 'Клиентски портал', 'Комуникация'],
    difficulty: 'Начинаещи',
    timeToRead: '6 мин.'
  },
  {
    id: 'payments',
    title: 'Плащания и финанси',
    description: 'Научете как да обработвате плащания и управлявате финанси',
    icon: CreditCardIcon,
    topics: ['Начини на плащане', 'Записване на плащания', 'Банкови сверки', 'Отчети'],
    difficulty: 'Средно',
    timeToRead: '10 мин.'
  },
  {
    id: 'settings',
    title: 'Настройки на профила',
    description: 'Научете как да персонализирате профила си и системните настройки',
    icon: SettingsIcon,
    topics: ['Данни за компания', 'Шаблони за фактури', 'Потребители и достъп', 'Интеграции'],
    difficulty: 'Начинаещи',
    timeToRead: '5 мин.'
  },
  {
    id: 'companies',
    title: 'Управление на компании',
    description: 'Научете как да управлявате множество компании в платформата',
    icon: BuildingIcon,
    topics: ['Добавяне на компания', 'Превключване между компании', 'Отделно счетоводство', 'Екипен достъп'],
    difficulty: 'Напреднали',
    timeToRead: '7 мин.'
  },
  {
    id: 'reports',
    title: 'Отчети и аналитика',
    description: 'Научете как да генерирате и интерпретирате отчети',
    icon: LineChartIcon,
    topics: ['Финансови отчети', 'Отчети за продажби', 'Данъчни отчети', 'Персонализирани отчети'],
    difficulty: 'Средно',
    timeToRead: '9 мин.'
  },
];

// Карта за ръководство
function GuideCard({ guide }) {
  const Icon = guide.icon;
  
  return (
    <Card className="h-full hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="p-2 bg-primary/10 rounded-lg mb-2">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div className="text-xs px-2 py-1 bg-muted rounded-full">
            {guide.difficulty}
          </div>
        </div>
        <CardTitle className="text-xl">{guide.title}</CardTitle>
        <CardDescription>{guide.description}</CardDescription>
      </CardHeader>
      <CardContent className="pb-4">
        <ul className="space-y-1">
          {guide.topics.map((topic, i) => (
            <li key={i} className="flex items-start text-sm">
              <ChevronRightIcon className="h-4 w-4 text-muted-foreground mr-1 mt-0.5 flex-shrink-0" />
              <span>{topic}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter className="flex justify-between pt-0">
        <div className="text-xs text-muted-foreground">
          Време за четене: {guide.timeToRead}
        </div>
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/docs/guides/${guide.id}`} className="flex items-center whitespace-nowrap">
            Прочети
            <ChevronRightIcon className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

export default function GuidesPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6 flex items-center">
          <Button variant="ghost" size="sm" asChild className="mr-2">
            <Link href="/docs" className="flex items-center whitespace-nowrap">
              <ArrowLeftIcon className="mr-2 h-4 w-4" />
              Документация
            </Link>
          </Button>
        </div>
        
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-3">Ръководства</h1>
          <p className="text-muted-foreground max-w-2xl">
            Подробни инструкции за използване на всички функционалности на RapidFrame. 
            Изберете тема, за да научите повече.
          </p>
        </div>
        
        <div className="mb-10">
          <input
            type="text"
            placeholder="Търсене в ръководства..."
            className="w-full md:w-2/3 px-4 py-2 border border-input rounded-md focus:outline-hidden focus:ring-2 focus:ring-primary"
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {guidesData.map((guide) => (
            <GuideCard key={guide.id} guide={guide} />
          ))}
        </div>
        
        <div className="mt-12 p-6 bg-muted/50 rounded-lg text-center">
          <h2 className="text-xl font-semibold mb-2">Нужна ли ви е допълнителна помощ?</h2>
          <p className="text-muted-foreground mb-4">
            Ако не можете да намерите отговор на вашия въпрос в ръководствата, 
            разгледайте често задаваните въпроси или се свържете с нашия екип за поддръжка.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button asChild variant="outline">
              <Link href="/docs/faq">
                Често задавани въпроси
              </Link>
            </Button>
            <Button asChild>
              <Link href="/support">
                Свържете се с поддръжка
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 
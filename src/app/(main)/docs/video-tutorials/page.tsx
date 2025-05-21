import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ArrowLeftIcon, PlayIcon, ClockIcon, BookmarkIcon } from 'lucide-react';

// Тип за видео урок
type VideoTutorial = {
  id: string;
  title: string;
  description: string;
  duration: string;
  thumbnailUrl: string;
  videoUrl: string;
  category: 'basics' | 'invoices' | 'clients' | 'payments' | 'settings';
  tags: string[];
};

// Примерни данни за видео уроците
const videoTutorials: VideoTutorial[] = [
  {
    id: 'getting-started',
    title: 'Първи стъпки с RapidFrame',
    description: 'Запознайте се с основните функции и интерфейса на RapidFrame',
    duration: '3:45',
    thumbnailUrl: '/images/tutorials/getting-started.jpg',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    category: 'basics',
    tags: ['начало', 'основи', 'интерфейс']
  },
  {
    id: 'create-invoice',
    title: 'Как да създадете фактура',
    description: 'Научете как да създадете и изпратите професионална фактура',
    duration: '5:20',
    thumbnailUrl: '/images/tutorials/create-invoice.jpg',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    category: 'invoices',
    tags: ['фактури', 'създаване', 'изпращане']
  },
  {
    id: 'recurring-invoices',
    title: 'Настройка на повтарящи се фактури',
    description: 'Как да автоматизирате процеса на издаване на фактури',
    duration: '4:15',
    thumbnailUrl: '/images/tutorials/recurring-invoices.jpg',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    category: 'invoices',
    tags: ['фактури', 'автоматизация', 'повтарящи се']
  },
  {
    id: 'add-clients',
    title: 'Управление на клиенти',
    description: 'Как да добавяте и организирате клиенти в системата',
    duration: '3:50',
    thumbnailUrl: '/images/tutorials/add-clients.jpg',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    category: 'clients',
    tags: ['клиенти', 'контакти', 'организация']
  },
  {
    id: 'client-portal',
    title: 'Клиентски портал',
    description: 'Как клиентите могат да достъпват своите фактури онлайн',
    duration: '4:30',
    thumbnailUrl: '/images/tutorials/client-portal.jpg',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    category: 'clients',
    tags: ['клиенти', 'портал', 'достъп']
  },
  {
    id: 'payment-methods',
    title: 'Настройка на начини за плащане',
    description: 'Научете как да интегрирате различни методи за плащане',
    duration: '6:10',
    thumbnailUrl: '/images/tutorials/payment-methods.jpg',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    category: 'payments',
    tags: ['плащане', 'интеграция', 'методи']
  },
  {
    id: 'track-payments',
    title: 'Проследяване на плащания',
    description: 'Как да следите и управлявате получените плащания',
    duration: '4:05',
    thumbnailUrl: '/images/tutorials/track-payments.jpg',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    category: 'payments',
    tags: ['плащане', 'следене', 'управление']
  },
  {
    id: 'company-settings',
    title: 'Настройки на компанията',
    description: 'Как да конфигурирате профила на вашата компания',
    duration: '3:30',
    thumbnailUrl: '/images/tutorials/company-settings.jpg',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    category: 'settings',
    tags: ['настройки', 'компания', 'профил']
  },
];

function VideoCard({ video }: { video: VideoTutorial }) {
  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <div className="relative aspect-video bg-muted">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-black/60 rounded-full p-3">
            <PlayIcon className="h-6 w-6 text-white" />
          </div>
        </div>
        <div 
          className="absolute inset-0 bg-center bg-cover" 
          style={{ 
            backgroundImage: `url(${video.thumbnailUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        />
        <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-md flex items-center">
          <ClockIcon className="h-3 w-3 mr-1" />
          {video.duration}
        </div>
      </div>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{video.title}</CardTitle>
        <CardDescription>{video.description}</CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex flex-wrap gap-1">
          {video.tags.map((tag, i) => (
            <span 
              key={i} 
              className="bg-muted text-xs px-2 py-0.5 rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>
        <div className="mt-4 flex justify-between items-center">
          <Button size="sm" asChild>
            <Link href={`/docs/video-tutorials/${video.id}`}>
              Гледай видео
            </Link>
          </Button>
          <Button size="sm" variant="ghost">
            <BookmarkIcon className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function VideoTutorialsPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 flex items-center">
          <Button variant="ghost" size="sm" asChild className="mr-2">
            <Link href="/docs">
              <ArrowLeftIcon className="mr-2 h-4 w-4" />
              Документация
            </Link>
          </Button>
        </div>
        
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-3">Видео уроци</h1>
          <p className="text-muted-foreground max-w-2xl">
            Гледайте видео ръководства, които показват как да използвате различните 
            функции на RapidFrame. Изберете категория или потърсете конкретен урок.
          </p>
        </div>
        
        <div className="mb-8 flex flex-col sm:flex-row gap-4 items-start justify-between">
          <input
            type="text"
            placeholder="Търсене на видео урок..."
            className="w-full sm:w-1/2 px-4 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              Най-нови
            </Button>
            <Button variant="outline" size="sm">
              Най-гледани
            </Button>
          </div>
        </div>
        
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="mb-8">
            <TabsTrigger value="all">Всички</TabsTrigger>
            <TabsTrigger value="basics">Основи</TabsTrigger>
            <TabsTrigger value="invoices">Фактури</TabsTrigger>
            <TabsTrigger value="clients">Клиенти</TabsTrigger>
            <TabsTrigger value="payments">Плащания</TabsTrigger>
            <TabsTrigger value="settings">Настройки</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {videoTutorials.map((video) => (
                <VideoCard key={video.id} video={video} />
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="basics">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {videoTutorials
                .filter(video => video.category === 'basics')
                .map((video) => (
                  <VideoCard key={video.id} video={video} />
                ))
              }
            </div>
          </TabsContent>
          
          <TabsContent value="invoices">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {videoTutorials
                .filter(video => video.category === 'invoices')
                .map((video) => (
                  <VideoCard key={video.id} video={video} />
                ))
              }
            </div>
          </TabsContent>
          
          <TabsContent value="clients">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {videoTutorials
                .filter(video => video.category === 'clients')
                .map((video) => (
                  <VideoCard key={video.id} video={video} />
                ))
              }
            </div>
          </TabsContent>
          
          <TabsContent value="payments">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {videoTutorials
                .filter(video => video.category === 'payments')
                .map((video) => (
                  <VideoCard key={video.id} video={video} />
                ))
              }
            </div>
          </TabsContent>
          
          <TabsContent value="settings">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {videoTutorials
                .filter(video => video.category === 'settings')
                .map((video) => (
                  <VideoCard key={video.id} video={video} />
                ))
              }
            </div>
          </TabsContent>
        </Tabs>
        
        <div className="mt-12 border-t pt-6">
          <h2 className="text-xl font-semibold mb-4">Не намерихте това, което търсите?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Заявете нов видео урок</CardTitle>
                <CardDescription>
                  Ако имате нужда от урок по конкретна тема, можете да го заявите
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild>
                  <Link href="/support">
                    Заявете видео
                  </Link>
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Разгледайте писмените ръководства</CardTitle>
                <CardDescription>
                  Подробни инструкции за всички функционалности в текстов формат
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild variant="outline">
                  <Link href="/docs/guides">
                    Вижте ръководствата
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
} 
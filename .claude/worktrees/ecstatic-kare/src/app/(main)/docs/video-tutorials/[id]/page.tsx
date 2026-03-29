"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { HelpSection } from '@/components/ui/context-help';
import { ArrowLeftIcon, ThumbsUpIcon, ThumbsDownIcon, ShareIcon, BookmarkIcon, ClockIcon, CalendarIcon } from 'lucide-react';
import { useParams } from 'next/navigation';

// Примерни данни за видео уроците
const videoTutorials = [
  {
    id: 'getting-started',
    title: 'Първи стъпки с RapidFrame',
    description: 'Запознайте се с основните функции и интерфейса на RapidFrame',
    longDescription: `
      В това ръководство ще разгледаме основните функции на RapidFrame и как да ги използвате ефективно.
      
      Ще научите как да навигирате в системата, да настроите вашия профил и да започнете работа с основните модули.
      
      Това видео е идеално за нови потребители, които искат бързо да се запознаят с платформата.
    `,
    duration: '3:45',
    uploadDate: '2023-11-15',
    thumbnailUrl: '/images/tutorials/getting-started.jpg',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    category: 'basics',
    tags: ['начало', 'основи', 'интерфейс'],
    views: 1245,
    relatedVideos: ['create-invoice', 'add-clients', 'company-settings']
  },
  {
    id: 'create-invoice',
    title: 'Как да създадете фактура',
    description: 'Научете как да създадете и изпратите професионална фактура',
    longDescription: `
      Това видео ръководство показва стъпка по стъпка процеса на създаване на фактура в RapidFrame.
      
      Ще научите как да добавяте клиенти, продукти и услуги към фактурата, как да прилагате данъци и отстъпки,
      и най-накрая как да изпращате фактурата на клиентите по различни начини.
      
      След този урок ще можете да създавате професионални фактури бързо и лесно.
    `,
    duration: '5:20',
    uploadDate: '2023-11-20',
    thumbnailUrl: '/images/tutorials/create-invoice.jpg',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    category: 'invoices',
    tags: ['фактури', 'създаване', 'изпращане'],
    views: 2130,
    relatedVideos: ['recurring-invoices', 'payment-methods', 'track-payments']
  },
  {
    id: 'recurring-invoices',
    title: 'Настройка на повтарящи се фактури',
    description: 'Как да автоматизирате процеса на издаване на фактури',
    longDescription: `
      Автоматизирайте процеса на фактуриране с повтарящи се фактури. Това видео показва как да:
      
      1. Създадете шаблон за повтаряща се фактура
      2. Зададете график за повторение
      3. Настроите автоматично изпращане на фактурите
      4. Проследявате статуса на всички повтарящи се фактури
      
      Тази функция е особено полезна за абонаментни услуги или редовни месечни плащания.
    `,
    duration: '4:15',
    uploadDate: '2023-12-05',
    thumbnailUrl: '/images/tutorials/recurring-invoices.jpg',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    category: 'invoices',
    tags: ['фактури', 'автоматизация', 'повтарящи се'],
    views: 1876,
    relatedVideos: ['create-invoice', 'track-payments', 'payment-methods']
  },
];

export default function VideoDetailPage() {
  const params = useParams();
  const videoId = params.id as string;
  const [feedback, setFeedback] = useState<'helpful' | 'not-helpful' | null>(null);
  
  // Намиране на видеото по ID
  const video = videoTutorials.find(v => v.id === videoId);
  
  // Ако видеото не съществува, показваме грешка
  if (!video) {
    return (
      <div className="container mx-auto py-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4">Видеото не е намерено</h1>
          <p className="text-muted-foreground mb-6">
            Съжаляваме, но видеото, което търсите, не съществува или е премахнато.
          </p>
          <Button asChild>
            <Link href="/docs/video-tutorials">
              <ArrowLeftIcon className="mr-2 h-4 w-4" />
              Обратно към всички видеа
            </Link>
          </Button>
        </div>
      </div>
    );
  }
  
  // Намиране на свързаните видеа
  const relatedVideos = video.relatedVideos
    .map(id => videoTutorials.find(v => v.id === id))
    .filter(Boolean);
  
  return (
    <div className="container mx-auto py-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/docs/video-tutorials">
              <ArrowLeftIcon className="mr-2 h-4 w-4" />
              Всички видео уроци
            </Link>
          </Button>
        </div>
        
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">{video.title}</h1>
          <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
            <span className="flex items-center">
              <ClockIcon className="mr-1 h-4 w-4" />
              {video.duration}
            </span>
            <span className="flex items-center">
              <CalendarIcon className="mr-1 h-4 w-4" />
              {video.uploadDate}
            </span>
            <span>{video.views} гледания</span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Видео плейър */}
            <div className="aspect-video bg-black rounded-lg overflow-hidden">
              <iframe
                src={video.videoUrl}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            
            {/* Действия */}
            <div className="flex flex-wrap justify-between items-center">
              <div className="flex space-x-2">
                <Button 
                  variant={feedback === 'helpful' ? 'default' : 'outline-solid'} 
                  size="sm"
                  onClick={() => setFeedback('helpful')}
                >
                  <ThumbsUpIcon className="mr-1 h-4 w-4" />
                  Полезно
                </Button>
                <Button 
                  variant={feedback === 'not-helpful' ? 'default' : 'outline-solid'} 
                  size="sm"
                  onClick={() => setFeedback('not-helpful')}
                >
                  <ThumbsDownIcon className="mr-1 h-4 w-4" />
                  Не е полезно
                </Button>
              </div>
              <div className="flex space-x-2">
                <Button variant="ghost" size="sm">
                  <BookmarkIcon className="mr-1 h-4 w-4" />
                  Запази
                </Button>
                <Button variant="ghost" size="sm">
                  <ShareIcon className="mr-1 h-4 w-4" />
                  Сподели
                </Button>
              </div>
            </div>
            
            {/* Описание */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Описание</h2>
              <div className="text-muted-foreground whitespace-pre-line">
                {video.longDescription}
              </div>
            </div>
            
            {/* Тагове */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Тагове</h3>
              <div className="flex flex-wrap gap-2">
                {video.tags.map((tag, i) => (
                  <Link 
                    key={i} 
                    href={`/docs/video-tutorials?tag=${tag}`}
                    className="bg-muted hover:bg-muted/80 px-3 py-1 rounded-full text-xs"
                  >
                    {tag}
                  </Link>
                ))}
              </div>
            </div>
          </div>
          
          <div className="space-y-6">
            {/* Свързани видеа */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Свързани видеа</h2>
              <div className="space-y-4">
                {relatedVideos.map((relatedVideo, i) => (
                  <Link key={i} href={`/docs/video-tutorials/${relatedVideo?.id}`} className="block group">
                    <Card className="overflow-hidden hover:shadow-md transition-shadow">
                      <CardContent className="p-0">
                        <div className="grid grid-cols-3 gap-3">
                          <div className="relative aspect-video bg-muted">
                            <div 
                              className="absolute inset-0 bg-center bg-cover" 
                              style={{ 
                                backgroundImage: `url(${relatedVideo?.thumbnailUrl})`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center'
                              }}
                            />
                            <div className="absolute bottom-1 right-1 bg-black/70 text-white text-[10px] px-1 py-0.5 rounded">
                              {relatedVideo?.duration}
                            </div>
                          </div>
                          <div className="col-span-2 p-3">
                            <h3 className="text-sm font-medium line-clamp-2 group-hover:text-primary transition-colors">
                              {relatedVideo?.title}
                            </h3>
                            <p className="text-xs text-muted-foreground mt-1">
                              {relatedVideo?.views} гледания
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
            
            {/* Помощна секция */}
            <HelpSection />
          </div>
        </div>
      </div>
    </div>
  );
} 
"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ArrowLeftIcon, FileTextIcon, UsersIcon, HelpCircleIcon, BookIcon } from 'lucide-react';
import { ContextHelp, HelpSection } from '@/components/ui/context-help';
import { DocOnboarding, TaskProgress } from '@/components/ui/doc-onboarding';

export default function DocumentationIntegrationPage() {
  const [tasks, setTasks] = useState([
    {
      title: 'Прегледайте въведението',
      completed: false,
      icon: BookIcon
    },
    {
      title: 'Изпробвайте контекстната помощ',
      completed: false,
      icon: HelpCircleIcon
    },
    {
      title: 'Стартирайте onboarding',
      completed: false,
      icon: UsersIcon
    },
    {
      title: 'Прегледайте提醒大家 за интеграция',
      completed: false,
      icon: FileTextIcon
    }
  ]);
  
  const completeTask = (index: number) => {
    const newTasks = [...tasks];
    newTasks[index].completed = true;
    setTasks(newTasks);
  };
  
  const handleAllTasksCompleted = () => {
    alert('Поздравления! Вие завършихте всички задачи!');
  };
  
  return (
    <div className="container mx-auto py-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6 flex items-center">
          <Button variant="ghost" size="sm" asChild className="mr-2">
            <Link href="/docs">
              <ArrowLeftIcon className="mr-2 h-4 w-4" />
              Документация
            </Link>
          </Button>
        </div>
        
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-3">Интеграция на документацията</h1>
          <p className="text-muted-foreground max-w-2xl">
            Тази демонстрационна страница показва различни начини за интегриране на документацията 
            директно във вашето приложение, подобрявайки потребителското изживяване.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-8">
            <Tabs defaultValue="context-help">
              <TabsList className="mb-4">
                <TabsTrigger value="context-help" onClick={() => completeTask(1)}>Контекстна помощ</TabsTrigger>
                <TabsTrigger value="onboarding" onClick={() => completeTask(2)}>Онбординг</TabsTrigger>
                <TabsTrigger value="integration" onClick={() => completeTask(3)}>Интеграция</TabsTrigger>
              </TabsList>
              
              <TabsContent value="context-help" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      Контекстна помощ
                      <ContextHelp
                        title="Използване на контекстна помощ"
                        tooltipContent="Кликнете за повече информация за контекстната помощ"
                        description="Контекстната помощ позволява на потребителите да получат информация за конкретен елемент от интерфейса, без да напускат текущия екран."
                        relatedLinks={[
                          { title: 'Ръководство за контекстна помощ', href: '/docs/guides' },
                          { title: 'FAQ за контекстна помощ', href: '/docs/faq' }
                        ]}
                      />
                    </CardTitle>
                    <CardDescription>
                      Контекстната помощ предоставя информация, когато потребителят се нуждае от нея, 
                      без да прекъсва работния процес.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="mb-4">
                      Контекстната помощ може да бъде интегрирана по различни начини:
                    </p>
                    
                    <div className="space-y-4">
                      <div className="flex items-center border p-3 rounded-md justify-between">
                        <span>Полета за въвеждане с помощ</span>
                        <ContextHelp
                          title="Помощ за полета"
                          tooltipContent="Подава контекстуална информация за полето"
                          tooltipSide="left"
                        />
                      </div>
                      
                      <div className="flex items-center border p-3 rounded-md justify-between">
                        <span>Бутони с подсказки</span>
                        <ContextHelp
                          title="Помощ за бутони"
                          tooltipContent="Обяснява функцията на бутона"
                          tooltipSide="left"
                          asButton
                        />
                      </div>
                      
                      <div className="flex items-center border p-3 rounded-md justify-between">
                        <span>Секции с видео ръководства</span>
                        <ContextHelp
                          title="Видео ръководства"
                          tooltipContent="Гледайте как се използва тази функция"
                          tooltipSide="left"
                          videoUrl="https://www.youtube.com/embed/dQw4w9WgXcQ"
                          videoTitle="Как да използвате контекстна помощ"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Секции за помощ</CardTitle>
                    <CardDescription>
                      Добавете цели секции за помощ в различни части на приложението
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <HelpSection 
                      title="Нуждаете се от повече информация?" 
                      description="Намерете подробни ръководства и отговори на въпроси."
                    />
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="onboarding" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Интерактивен онбординг</CardTitle>
                    <CardDescription>
                      Насочвайте потребителите в интерфейса с интерактивен онбординг
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="mb-4">
                      Онбордингът е ефективен начин за запознаване на новите потребители с вашето приложение.
                      Той може да включва:
                    </p>
                    
                    <ul className="list-disc pl-6 space-y-2 mb-4">
                      <li>Стъпки за основните функции</li>
                      <li>Автоматично насочване към важни елементи от интерфейса</li>
                      <li>Интеграция с документация за допълнителна информация</li>
                    </ul>
                    
                    <div className="flex justify-center">
                      <Button 
                        id="start-onboarding-button" 
                        onClick={() => {
                          const onboardingButton = document.querySelector('.fixed.bottom-6.right-6');
                          if (onboardingButton) {
                            (onboardingButton as HTMLButtonElement).click();
                            completeTask(2);
                          }
                        }}
                      >
                        Стартирайте демо онбординг
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Проследяване на прогреса</CardTitle>
                    <CardDescription>
                      Мотивирайте потребителите с проследяване на прогреса
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="mb-4">
                      Проследяването на прогреса помага на потребителите да разберат кои задачи са изпълнили 
                      и какво им предстои, като същевременно ги мотивира да завършат всички стъпки.
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="integration" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Интеграция на документацията в приложението</CardTitle>
                    <CardDescription>
                      Научете как да интегрирате документация в различните части на вашето приложение
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <p>
                        Интеграцията на документацията директно в приложението значително подобрява потребителското изживяване.
                        Ето някои подходи:
                      </p>
                      
                      <div className="border rounded-md p-4 space-y-2">
                        <h3 className="font-medium">1. Контекстуална документация</h3>
                        <p className="text-sm text-muted-foreground">
                          Покажете съответната документация в зависимост от контекста, в който се намира потребителят.
                          Например, когато потребителят e на страницата за фактури, покажете документация за фактури.
                        </p>
                      </div>
                      
                      <div className="border rounded-md p-4 space-y-2">
                        <h3 className="font-medium">2. Отваряне на документация в панел</h3>
                        <p className="text-sm text-muted-foreground">
                          Добавете бутон, който отваря документацията в страничен панел, 
                          позволявайки на потребителя да чете документацията, докато използва приложението.
                        </p>
                      </div>
                      
                      <div className="border rounded-md p-4 space-y-2">
                        <h3 className="font-medium">3. Директни линкове към документация</h3>
                        <p className="text-sm text-muted-foreground">
                          Добавете директни линкове към съответните секции от документацията до функциите,
                          които могат да бъдат по-сложни за разбиране.
                        </p>
                      </div>
                      
                      <div className="border rounded-md p-4 space-y-2">
                        <h3 className="font-medium">4. Интегриране на видео ръководства</h3>
                        <p className="text-sm text-muted-foreground">
                          Вградете видео ръководства директно в приложението, за да демонстрирате как се 
                          използват по-сложни функции.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
          
          <div className="space-y-6">
            <TaskProgress 
              tasks={tasks} 
              onAllCompleted={handleAllTasksCompleted} 
            />
            
            <Card>
              <CardHeader>
                <CardTitle>Въведение</CardTitle>
                <CardDescription>
                  Кратко въведение в интеграцията на документация
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Интеграцията на документация директно в потребителския интерфейс подобрява 
                  потребителското изживяване и намалява необходимостта от външна поддръжка.
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  asChild
                  onClick={() => completeTask(0)}
                >
                  <Link href="/docs/guides">
                    <BookIcon className="mr-2 h-4 w-4" />
                    Научете повече
                  </Link>
                </Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Полезни ресурси</CardTitle>
                <CardDescription>
                  Допълнителни ресурси за интеграция на документация
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="text-sm">
                    <Link href="/docs/guides" className="text-primary hover:underline flex items-center">
                      <FileTextIcon className="mr-2 h-4 w-4" />
                      Ръководства
                    </Link>
                  </li>
                  <li className="text-sm">
                    <Link href="/docs/video-tutorials" className="text-primary hover:underline flex items-center">
                      <FileTextIcon className="mr-2 h-4 w-4" />
                      Видео уроци
                    </Link>
                  </li>
                  <li className="text-sm">
                    <Link href="/docs/faq" className="text-primary hover:underline flex items-center">
                      <FileTextIcon className="mr-2 h-4 w-4" />
                      Често задавани въпроси
                    </Link>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      
      {/* Компонент за онбординг - ще се активира при клик на бутона */}
      <DocOnboarding featureKey="invoices" />
    </div>
  );
} 
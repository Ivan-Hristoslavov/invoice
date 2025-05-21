"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Onboarding, OnboardingStep } from '@/components/ui/onboarding';
import { CheckCircle2Icon, BookIcon, FileTextIcon, UsersIcon, InfoIcon } from 'lucide-react';

// Интегрира onboarding с документацията
export function DocOnboarding({ 
  showInitially = false,
  featureKey = 'invoices' 
}) {
  const [isActive, setIsActive] = useState(showInitially);
  
  // Стъпки за различни функционалности
  const onboardingStepsMap = {
    invoices: [
      {
        id: 'invoice-intro',
        title: 'Добре дошли във фактурите',
        description: (
          <div className="space-y-2">
            <p>Тук създавате и управлявате всички ваши фактури.</p>
            <p>Нека да ви покажем основните функции.</p>
          </div>
        ),
        tooltipPosition: 'center',
        completionTrigger: 'button',
      },
      {
        id: 'create-invoice',
        title: 'Създаване на фактура',
        description: (
          <div className="space-y-2">
            <p>Натиснете този бутон, за да създадете нова фактура.</p>
            <p>Можете също да използвате клавишната комбинация <strong>Ctrl+N</strong>.</p>
          </div>
        ),
        targetElement: '#create-invoice-button',
        tooltipPosition: 'bottom',
        completionTrigger: 'button',
      },
      {
        id: 'invoice-filters',
        title: 'Филтриране на фактури',
        description: (
          <div className="space-y-2">
            <p>Използвайте тези филтри, за да намерите конкретни фактури бързо.</p>
            <p>Можете да филтрирате по статус, дата, клиент и други.</p>
          </div>
        ),
        targetElement: '#invoice-filters',
        tooltipPosition: 'bottom',
        completionTrigger: 'button',
      },
      {
        id: 'invoice-more',
        title: 'Научете повече',
        description: (
          <div className="space-y-2">
            <p>За да научите повече за фактурите, посетете нашата документация.</p>
            <Button
              size="sm"
              variant="outline"
              className="mt-2"
              onClick={() => window.open('/docs/guides/invoices', '_blank')}
            >
              <BookIcon className="mr-2 h-4 w-4" />
              Ръководство за фактури
            </Button>
          </div>
        ),
        tooltipPosition: 'center',
        completionTrigger: 'button',
      },
    ],
    clients: [
      {
        id: 'clients-intro',
        title: 'Управление на клиенти',
        description: (
          <div className="space-y-2">
            <p>Тук управлявате всички ваши клиенти и техните данни.</p>
            <p>Нека да ви покажем основните функции.</p>
          </div>
        ),
        tooltipPosition: 'center',
        completionTrigger: 'button',
      },
      {
        id: 'add-client',
        title: 'Добавяне на клиент',
        description: (
          <div className="space-y-2">
            <p>Натиснете този бутон, за да добавите нов клиент.</p>
            <p>Попълнете необходимите данни в появилата се форма.</p>
          </div>
        ),
        targetElement: '#add-client-button',
        tooltipPosition: 'bottom',
        completionTrigger: 'button',
      },
      {
        id: 'client-more',
        title: 'Научете повече',
        description: (
          <div className="space-y-2">
            <p>За да научите повече за управлението на клиенти, посетете нашата документация.</p>
            <Button
              size="sm"
              variant="outline"
              className="mt-2"
              onClick={() => window.open('/docs/guides/clients', '_blank')}
            >
              <BookIcon className="mr-2 h-4 w-4" />
              Ръководство за клиенти
            </Button>
          </div>
        ),
        tooltipPosition: 'center',
        completionTrigger: 'button',
      },
    ]
  };
  
  // Избираме правилните стъпки според featureKey
  const steps = onboardingStepsMap[featureKey] || onboardingStepsMap.invoices;
  
  // Проверяваме дали потребителят е виждал onboarding-a преди
  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem(`hasSeenOnboarding-${featureKey}`);
    if (showInitially && !hasSeenOnboarding) {
      setIsActive(true);
    }
  }, [featureKey, showInitially]);
  
  const handleComplete = () => {
    setIsActive(false);
    // Запазваме информация, че потребителят е видял onboarding-a
    localStorage.setItem(`hasSeenOnboarding-${featureKey}`, 'true');
  };
  
  return (
    <>
      {/* Бутон за показване на onboarding */}
      <Button
        variant="outline"
        size="sm"
        className="fixed bottom-6 right-6 z-40 shadow-md"
        onClick={() => setIsActive(true)}
      >
        <InfoIcon className="mr-1 h-4 w-4" />
        Помощ за страницата
      </Button>
      
      {/* Компонент за onboarding */}
      <Onboarding
        steps={steps}
        isActive={isActive}
        onComplete={handleComplete}
        showOverlay={true}
        showIntroDialog={true}
      />
    </>
  );
}

// Компонент, показващ прогрес при изпълнение на задачи в документацията
interface TaskProgressProps {
  /** Масив от задачи със заглавие и статус */
  tasks: {
    title: string;
    completed: boolean;
    icon?: React.ElementType;
  }[];
  /** Какво се случва, когато всички задачи са изпълнени */
  onAllCompleted?: () => void;
}

export function TaskProgress({ tasks, onAllCompleted }: TaskProgressProps) {
  const completedTasks = tasks.filter(task => task.completed).length;
  const progress = (completedTasks / tasks.length) * 100;
  
  useEffect(() => {
    if (completedTasks === tasks.length && onAllCompleted) {
      onAllCompleted();
    }
  }, [completedTasks, tasks.length, onAllCompleted]);
  
  return (
    <div className="rounded-lg border p-4 bg-card">
      <div className="mb-4">
        <h3 className="font-medium text-lg mb-1">Вашият прогрес</h3>
        <p className="text-sm text-muted-foreground">
          Изпълнете всички задачи, за да разберете как работи системата
        </p>
      </div>
      
      <div className="space-y-2">
        {tasks.map((task, index) => {
          const Icon = task.icon || FileTextIcon;
          return (
            <div 
              key={index} 
              className={`flex items-start p-2 rounded-md ${
                task.completed ? 'bg-primary/10' : 'bg-muted/50'
              }`}
            >
              <div className={`mr-3 ${task.completed ? 'text-primary' : 'text-muted-foreground'}`}>
                {task.completed ? (
                  <CheckCircle2Icon className="h-5 w-5" />
                ) : (
                  <Icon className="h-5 w-5" />
                )}
              </div>
              <div>
                <p className={`text-sm font-medium ${task.completed ? 'text-primary' : ''}`}>
                  {task.title}
                </p>
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="mt-4">
        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary" 
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-sm text-right mt-1 text-muted-foreground">
          {completedTasks} от {tasks.length} изпълнени
        </p>
      </div>
    </div>
  );
} 
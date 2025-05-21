"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { 
  XIcon, 
  ChevronRightIcon, 
  ChevronLeftIcon,
  CheckIcon,
  ArrowRightIcon
} from 'lucide-react';

// Тип за стъпки в onboarding-а
export type OnboardingStep = {
  id: string;
  title: string;
  description: React.ReactNode;
  image?: string; 
  completed?: boolean;
  /** CSS селектор на елемент, който трябва да се хайлайтне */
  targetElement?: string;
  /** Положение на подсказката спрямо елемента */
  tooltipPosition?: 'top' | 'right' | 'bottom' | 'left' | 'center';
  /** Кога стъпката се маркира като завършена */
  completionTrigger?: 'button' | 'action'; 
};

interface OnboardingTooltipProps {
  /** Стъпка от onboarding-а */
  step: OnboardingStep;
  /** Дали е последна стъпка */
  isLastStep: boolean;
  /** Функция при натискане на бутона за следваща стъпка */
  onNext: () => void;
  /** Функция при натискане на бутона за предишна стъпка */
  onPrevious?: () => void;
  /** Функция при затваряне на подсказка */
  onClose: () => void;
  /** Функция за маркиране на стъпка като завършена */
  onComplete?: () => void;
  /** Дали да показва стрелка от подсказката към елемента */
  showArrow?: boolean;
}

// Компонент за подсказка при onboarding
export function OnboardingTooltip({
  step,
  isLastStep,
  onNext,
  onPrevious,
  onClose,
  onComplete,
  showArrow = true,
}: OnboardingTooltipProps) {
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [arrowStyle, setArrowStyle] = useState({});

  useEffect(() => {
    if (step.targetElement) {
      const targetEl = document.querySelector(step.targetElement);
      if (targetEl) {
        const rect = targetEl.getBoundingClientRect();
        const tooltipPosition = step.tooltipPosition || 'bottom';
        
        // Позициониране на подсказката според подадената позиция
        let newPosition = { top: 0, left: 0 };
        let newArrowStyle = {};
        
        switch (tooltipPosition) {
          case 'top':
            newPosition = { 
              top: rect.top - 120, 
              left: rect.left + rect.width / 2 - 150 
            };
            newArrowStyle = { 
              bottom: '-8px', 
              left: '50%', 
              transform: 'translateX(-50%)',
              borderLeft: '8px solid transparent',
              borderRight: '8px solid transparent',
              borderTop: '8px solid white',
            };
            break;
          case 'right':
            newPosition = { 
              top: rect.top + rect.height / 2 - 60, 
              left: rect.right + 10 
            };
            newArrowStyle = { 
              left: '-8px', 
              top: '50%', 
              transform: 'translateY(-50%)',
              borderTop: '8px solid transparent',
              borderBottom: '8px solid transparent',
              borderRight: '8px solid white',
            };
            break;
          case 'bottom':
            newPosition = { 
              top: rect.bottom + 10, 
              left: rect.left + rect.width / 2 - 150 
            };
            newArrowStyle = { 
              top: '-8px', 
              left: '50%', 
              transform: 'translateX(-50%)',
              borderLeft: '8px solid transparent',
              borderRight: '8px solid transparent',
              borderBottom: '8px solid white',
            };
            break;
          case 'left':
            newPosition = { 
              top: rect.top + rect.height / 2 - 60, 
              left: rect.left - 310 
            };
            newArrowStyle = { 
              right: '-8px', 
              top: '50%', 
              transform: 'translateY(-50%)',
              borderTop: '8px solid transparent',
              borderBottom: '8px solid transparent',
              borderLeft: '8px solid white',
            };
            break;
          case 'center':
            newPosition = { 
              top: window.innerHeight / 2 - 120, 
              left: window.innerWidth / 2 - 150 
            };
            // Няма стрелка при централна позиция
            break;
        }
        
        setPosition(newPosition);
        if (showArrow && tooltipPosition !== 'center') {
          setArrowStyle(newArrowStyle);
        }
        
        // Добавяме визуално акцентиране на елемента
        targetEl.classList.add('ring-2', 'ring-primary', 'ring-offset-2');
        
        // Cleanup функция за премахване на акцентирането
        return () => {
          targetEl.classList.remove('ring-2', 'ring-primary', 'ring-offset-2');
        };
      }
    }
  }, [step, showArrow]);

  return (
    <div 
      className={cn(
        "fixed z-50 bg-white shadow-lg rounded-lg p-5 w-[300px]",
        !step.targetElement && "top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
      )}
      style={step.targetElement ? position : undefined}
    >
      {showArrow && step.targetElement && step.tooltipPosition !== 'center' && (
        <div 
          className="absolute w-0 h-0"
          style={arrowStyle}
        />
      )}
      
      <button 
        className="absolute top-2 right-2 text-muted-foreground hover:text-foreground" 
        onClick={onClose}
      >
        <XIcon size={16} />
      </button>
      
      <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
      <div className="text-sm text-muted-foreground mb-4">{step.description}</div>
      
      {step.image && (
        <div className="mb-4">
          <img 
            src={step.image} 
            alt={step.title} 
            className="rounded-md w-full" 
          />
        </div>
      )}
      
      <div className="flex justify-between items-center">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onPrevious}
          disabled={!onPrevious}
        >
          <ChevronLeftIcon className="mr-1 h-4 w-4" />
          Назад
        </Button>
        
        <Button 
          size="sm" 
          onClick={() => {
            if (step.completionTrigger === 'button') {
              onComplete?.();
            }
            onNext();
          }}
        >
          {isLastStep ? (
            <>
              Завърши
              <CheckIcon className="ml-1 h-4 w-4" />
            </>
          ) : (
            <>
              Напред
              <ChevronRightIcon className="ml-1 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

interface OnboardingProps {
  /** Списък със стъпки за onboarding-а */
  steps: OnboardingStep[];
  /** Дали onboarding-а е активен */
  isActive: boolean;
  /** Функция при завършване или пропускане на onboarding-а */
  onComplete: () => void;
  /** Дали да показва overlay */
  showOverlay?: boolean;
  /** Дали да показва модален диалог при старт */
  showIntroDialog?: boolean;
}

// Основен компонент за onboarding
export function Onboarding({
  steps,
  isActive,
  onComplete,
  showOverlay = true,
  showIntroDialog = true,
}: OnboardingProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [showDialog, setShowDialog] = useState(showIntroDialog);
  
  const currentStep = steps[currentStepIndex];
  const isLastStep = currentStepIndex === steps.length - 1;
  
  // Изчисляване на прогрес
  const progress = Math.round((completedSteps.length / steps.length) * 100);
  
  // Функция за преминаване към следваща стъпка
  const handleNext = () => {
    if (isLastStep) {
      handleComplete();
    } else {
      setCurrentStepIndex(prev => prev + 1);
    }
  };
  
  // Функция за връщане към предишна стъпка
  const handlePrevious = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };
  
  // Функция за маркиране на стъпка като завършена
  const handleStepComplete = () => {
    if (!completedSteps.includes(currentStep.id)) {
      setCompletedSteps(prev => [...prev, currentStep.id]);
    }
  };
  
  // Функция при завършване на целия onboarding
  const handleComplete = () => {
    onComplete();
  };
  
  // Ако onboarding-а не е активен, не показваме нищо
  if (!isActive) {
    return null;
  }
  
  return (
    <>
      {/* Стартов диалог */}
      {showDialog && (
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogTitle>Добре дошли в RapidFrame</DialogTitle>
            <div className="py-4">
              <p className="text-muted-foreground mb-4">
                Нека ви покажем как да използвате основните функции на платформата. 
                Това ще отнеме само няколко минути.
              </p>
              
              <div className="space-y-2 mb-4">
                <p className="font-medium">Ще научите как да:</p>
                <ul className="ml-4 space-y-1">
                  {steps.map(step => (
                    <li key={step.id} className="flex items-center">
                      <ArrowRightIcon className="mr-2 h-3 w-3 text-primary" />
                      {step.title}
                    </li>
                  ))}
                </ul>
              </div>
              
              <p className="text-sm text-muted-foreground">
                Можете да прекъснете обучението по всяко време и да го подновите от менюто за помощ.
              </p>
            </div>
            
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowDialog(false);
                  onComplete();
                }}
              >
                Пропусни
              </Button>
              <Button 
                onClick={() => setShowDialog(false)}
              >
                Започни обучението
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      
      {!showDialog && (
        <>
          {/* Полупрозрачен overlay */}
          {showOverlay && (
            <div className="fixed inset-0 bg-black/30 z-40" />
          )}
          
          {/* Индикатор за прогрес */}
          <div className="fixed top-4 right-4 z-50 bg-white shadow-md rounded-md p-3 w-48">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Прогрес</span>
              <span className="text-sm text-muted-foreground">
                {currentStepIndex + 1}/{steps.length}
              </span>
            </div>
            <Progress value={progress} className="h-2" />
            <button 
              onClick={onComplete}
              className="text-xs text-primary mt-2 hover:underline"
            >
              Пропусни обучението
            </button>
          </div>
          
          {/* Текуща подсказка */}
          <OnboardingTooltip 
            step={currentStep}
            isLastStep={isLastStep}
            onNext={handleNext}
            onPrevious={currentStepIndex > 0 ? handlePrevious : undefined}
            onClose={onComplete}
            onComplete={handleStepComplete}
          />
        </>
      )}
    </>
  );
} 
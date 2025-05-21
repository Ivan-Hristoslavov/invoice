"use client"

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { CheckIcon } from 'lucide-react';

interface SuccessAnimationProps {
  /** Текстово съобщение за успешното действие */
  message?: string;
  /** Колко секунди да се показва анимацията (0 за постоянно) */
  duration?: number;
  /** Действие след приключване на анимацията */
  onComplete?: () => void;
  /** Стил на анимацията */
  variant?: 'checkmark' | 'pulse' | 'fade';
  /** Дали да се показва като известие */
  toast?: boolean;
  /** Допълнителни CSS класове */
  className?: string;
}

export function SuccessAnimation({
  message = 'Успешно запазено!',
  duration = 2,
  onComplete,
  variant = 'checkmark',
  toast = false,
  className,
}: SuccessAnimationProps) {
  const [visible, setVisible] = useState(true);
  
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setVisible(false);
        if (onComplete) {
          onComplete();
        }
      }, duration * 1000);
      
      return () => clearTimeout(timer);
    }
  }, [duration, onComplete]);

  if (!visible) return null;

  const renderAnimation = () => {
    switch (variant) {
      case 'checkmark':
        return (
          <div className="rounded-full bg-success p-2 text-success-foreground">
            <CheckIcon className="w-6 h-6 animate-scale-in" />
          </div>
        );
      case 'pulse':
        return (
          <div className="rounded-full bg-success p-2 text-success-foreground animate-pulse-once">
            <CheckIcon className="w-6 h-6" />
          </div>
        );
      case 'fade':
        return (
          <div className="rounded-full bg-success p-2 text-success-foreground animate-fade-in">
            <CheckIcon className="w-6 h-6" />
          </div>
        );
      default:
        return null;
    }
  };

  if (toast) {
    return (
      <div 
        className={cn(
          "fixed top-4 right-4 z-50 py-2 px-4 rounded-md shadow-md animate-slide-down bg-card border",
          className
        )}
      >
        <div className="flex items-center space-x-2">
          {renderAnimation()}
          <span>{message}</span>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={cn(
        "success-animation flex items-center justify-center space-x-2",
        className
      )}
    >
      {renderAnimation()}
      {message && <span className="text-sm font-medium">{message}</span>}
    </div>
  );
}

// Компонент за успешно действие в диалогов прозорец
export function SuccessDialog({
  title = 'Успешно!',
  message = 'Действието беше успешно изпълнено.',
  buttonText = 'Разбрано',
  onClose,
  open = true
}: {
  title?: string;
  message?: string;
  buttonText?: string;
  onClose?: () => void;
  open?: boolean;
}) {
  if (!open) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-card rounded-lg shadow-lg max-w-md w-full p-6 animate-scale-in">
        <div className="flex flex-col items-center text-center">
          <div className="rounded-full bg-success p-4 mb-4">
            <CheckIcon className="w-8 h-8 text-success-foreground" />
          </div>
          
          <h3 className="text-xl font-semibold mb-2">{title}</h3>
          <p className="text-muted-foreground mb-6">{message}</p>
          
          <button 
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium"
          >
            {buttonText}
          </button>
        </div>
      </div>
    </div>
  );
} 
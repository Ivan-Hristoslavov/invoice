"use client"

import React from 'react';
import { cn } from '@/lib/utils';
import { AlertTriangleIcon, XCircleIcon, RefreshCwIcon, InfoIcon } from 'lucide-react';
import { Button } from './button';

interface ErrorMessageProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Заглавие на грешката */
  title?: string;
  /** Описание на грешката */
  message?: string;
  /** Тип на грешката */
  type?: 'error' | 'warning' | 'info';
  /** Функция, която да се извика при повторен опит */
  onRetry?: () => void;
  /** Текст на бутона за повторен опит */
  retryText?: string;
  /** Дали грешката е inline (без фон и рамка) */
  inline?: boolean;
  /** Дали да се покаже иконата */
  showIcon?: boolean;
  /** Допълнителни действия */
  actions?: React.ReactNode;
}

export function ErrorMessage({
  title,
  message,
  type = 'error',
  onRetry,
  retryText = 'Опитайте отново',
  inline = false,
  showIcon = true,
  actions,
  className,
  children,
  ...props
}: ErrorMessageProps) {
  const getIcon = () => {
    switch (type) {
      case 'error':
        return <XCircleIcon className="w-5 h-5 text-destructive" />;
      case 'warning':
        return <AlertTriangleIcon className="w-5 h-5 text-warning" />;
      case 'info':
        return <InfoIcon className="w-5 h-5 text-primary" />;
      default:
        return null;
    }
  };
  
  const getBgColor = () => {
    if (inline) return '';
    
    switch (type) {
      case 'error':
        return 'bg-destructive/10';
      case 'warning':
        return 'bg-warning/10';
      case 'info':
        return 'bg-primary/10';
      default:
        return 'bg-destructive/10';
    }
  };
  
  const getBorderColor = () => {
    if (inline) return '';
    
    switch (type) {
      case 'error':
        return 'border-destructive/30';
      case 'warning':
        return 'border-warning/30';
      case 'info':
        return 'border-primary/30';
      default:
        return 'border-destructive/30';
    }
  };
  
  const getTextColor = () => {
    switch (type) {
      case 'error':
        return 'text-destructive';
      case 'warning':
        return 'text-warning-foreground';
      case 'info':
        return 'text-primary';
      default:
        return 'text-destructive';
    }
  };

  return (
    <div
      className={cn(
        "rounded-md",
        !inline && "border p-4",
        getBgColor(),
        getBorderColor(),
        className
      )}
      {...props}
    >
      <div className="flex">
        {showIcon && (
          <div className="flex-shrink-0 mr-3">
            {getIcon()}
          </div>
        )}
        <div className="flex-1">
          {title && (
            <h3 className={cn("text-sm font-medium mb-1", getTextColor())}>
              {title}
            </h3>
          )}
          {message && (
            <div className="text-sm">
              {message}
            </div>
          )}
          {children}
          
          {(onRetry || actions) && (
            <div className="mt-3 flex flex-wrap gap-3">
              {onRetry && (
                <Button 
                  size="sm"
                  variant="outline"
                  onClick={onRetry}
                  className="inline-flex items-center"
                >
                  <RefreshCwIcon className="mr-1 h-3 w-3" />
                  {retryText}
                </Button>
              )}
              {actions}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function ErrorBoundary({
  error,
  resetErrorBoundary,
}: {
  error: Error;
  resetErrorBoundary: () => void;
}) {
  return (
    <div className="p-6 max-w-2xl mx-auto">
      <ErrorMessage
        title="Възникна грешка"
        message={`${error.message || 'Нещо се обърка при зареждането на тази страница.'}`}
        type="error"
        onRetry={resetErrorBoundary}
      />
    </div>
  );
} 
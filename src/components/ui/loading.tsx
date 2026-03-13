"use client"

import React from 'react';
import { cn } from '@/lib/utils';

interface LoadingProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Вид на индикатора - може да бъде 'spinner', 'dots', или 'pulse' */
  variant?: 'spinner' | 'dots' | 'pulse';
  /** Размер на индикатора */
  size?: 'sm' | 'md' | 'lg';
  /** Дали да показва текст под индикатора */
  showText?: boolean;
  /** Текстът, който да се показва (по подразбиране "Зареждане...") */
  text?: string;
  /** Дали индикаторът да се показва на цял екран с overlay */
  fullScreen?: boolean;
}

export function Loading({
  variant = 'spinner',
  size = 'md',
  showText = false,
  text = 'Зареждане...',
  fullScreen = false,
  className,
  ...props
}: LoadingProps) {
  
  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };
  
  const renderIndicator = () => {
    switch(variant) {
      case 'spinner':
        return (
          <div 
            className={cn(
              "animate-spin rounded-full border-2 border-t-transparent", 
              sizeClasses[size],
              size === 'sm' ? 'border-2' : size === 'md' ? 'border-3' : 'border-4',
              "border-primary"
            )}
          />
        );
      case 'dots':
        return (
          <div className="flex space-x-1">
            {[...Array(3)].map((_, i) => (
              <div 
                key={i} 
                className={cn(
                  "rounded-full bg-primary animate-pulse", 
                  size === 'sm' ? 'w-1.5 h-1.5' : size === 'md' ? 'w-2 h-2' : 'w-3 h-3',
                  `animation-delay-${i * 100}`
                )}
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        );
      case 'pulse':
        return (
          <div 
            className={cn(
              "rounded-full bg-primary animate-pulse", 
              sizeClasses[size]
            )}
          />
        );
      default:
        return null;
    }
  };
  
  const content = (
    <div 
      className={cn(
        "flex flex-col items-center justify-center",
        className
      )} 
      {...props}
    >
      {renderIndicator()}
      {showText && (
        <p className="mt-2 text-sm text-muted-foreground">{text}</p>
      )}
    </div>
  );
  
  if (fullScreen) {
    return (
      <div className="loading-overlay">
        {content}
      </div>
    );
  }
  
  return content;
}

export function LoadingButton({
  isLoading,
  children,
  disabled,
  className,
  loadingText = "Обработка...",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  isLoading?: boolean;
  loadingText?: string;
}) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors",
        "bg-primary text-primary-foreground hover:bg-primary/90",
        "focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring",
        "disabled:opacity-50 disabled:pointer-events-none",
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <span className="mr-2 inline-block w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin"></span>
          {loadingText}
        </>
      ) : (
        children
      )}
    </button>
  );
} 
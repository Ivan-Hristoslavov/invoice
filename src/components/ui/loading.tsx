"use client";

import React from "react";
import { Spinner } from "@heroui/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { FullPageLoader, LoadingSpinner } from "@/components/ui/loading-spinner";

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
  variant = 'pulse',
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
        return <LoadingSpinner size={size === 'sm' ? 'small' : size === 'lg' ? 'large' : 'medium'} />;
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
    if (variant === 'spinner' || variant === 'pulse') {
      return <FullPageLoader title={text} subtitle={showText ? undefined : "Подготвяме съдържанието за вас..."} />;
    }

    return (
      <div className="loading-overlay">
        {content}
      </div>
    );
  }
  
  return content;
}

type LoadingButtonProps = React.ComponentProps<typeof Button> & {
  isLoading?: boolean;
  loadingText?: string;
};

export function LoadingButton({
  isLoading,
  children,
  disabled,
  className,
  loadingText = "Обработка...",
  ...props
}: LoadingButtonProps) {
  return (
    <Button disabled={disabled || isLoading} className={cn("inline-flex items-center gap-2", className)} {...props}>
      {isLoading ? (
        <>
          <Spinner size="sm" color="current" className="shrink-0" />
          {loadingText}
        </>
      ) : (
        children
      )}
    </Button>
  );
} 
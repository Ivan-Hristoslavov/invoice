import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from './button';

interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Иконата, която да се показва */
  icon?: React.ReactNode;
  /** Заглавие на празното състояние */
  title?: string;
  /** Описание на празното състояние */
  description?: string;
  /** Текст на бутона за действие */
  actionText?: string;
  /** Callback функция при натискане на бутона */
  onAction?: () => void;
  /** Дали да има илюстрация вместо икона */
  illustration?: React.ReactNode;
  /** Върху каква повърхност се показва (за фона) */
  surface?: 'card' | 'page' | 'muted';
  /** Дали е компактен вид */
  compact?: boolean;
}

export function EmptyState({
  icon,
  title,
  description,
  actionText,
  onAction,
  illustration,
  surface = 'muted',
  compact = false,
  className,
  children,
  ...props
}: EmptyStateProps) {
  const backgroundClasses = {
    card: 'bg-card',
    page: 'bg-background',
    muted: 'bg-muted/50',
  };

  return (
    <div
      className={cn(
        'empty-state',
        backgroundClasses[surface],
        compact ? 'py-6' : 'py-10',
        className
      )}
      {...props}
    >
      {illustration ? (
        <div className="mb-6">{illustration}</div>
      ) : icon ? (
        <div className="empty-state-icon text-muted-foreground">
          {icon}
        </div>
      ) : null}
      
      {title && (
        <h3 className={cn(
          "font-semibold",
          compact ? "text-base" : "text-lg"
        )}>
          {title}
        </h3>
      )}
      
      {description && (
        <p className="empty-state-text max-w-md mx-auto">
          {description}
        </p>
      )}
      
      {children}
      
      {actionText && onAction && (
        <Button 
          onClick={onAction}
          variant="outline"
          className="mt-4"
        >
          {actionText}
        </Button>
      )}
    </div>
  );
}

// Пример за използване за списък с фактури
export function EmptyInvoicesList({
  onCreateNew,
  className,
  ...props
}: Omit<EmptyStateProps, 'title' | 'description' | 'actionText' | 'onAction'> & {
  onCreateNew?: () => void;
}) {
  return (
    <EmptyState
      title="Нямате фактури"
      description="Създайте първата си фактура, за да започнете да следите вашите плащания."
      actionText="Създаване на фактура"
      onAction={onCreateNew}
      className={className}
      {...props}
    />
  );
}

// Пример за използване за списък с клиенти
export function EmptyClientsList({
  onCreateNew,
  className,
  ...props
}: Omit<EmptyStateProps, 'title' | 'description' | 'actionText' | 'onAction'> & {
  onCreateNew?: () => void;
}) {
  return (
    <EmptyState
      title="Нямате клиенти"
      description="Добавете клиенти, за да можете да издавате фактури към тях."
      actionText="Добавяне на клиент"
      onAction={onCreateNew}
      className={className}
      {...props}
    />
  );
}

// Пример за използване за списък с продукти
export function EmptyProductsList({
  onCreateNew,
  className,
  ...props
}: Omit<EmptyStateProps, 'title' | 'description' | 'actionText' | 'onAction'> & {
  onCreateNew?: () => void;
}) {
  return (
    <EmptyState
      title="Нямате продукти"
      description="Добавете продукти и услуги, които предлагате на вашите клиенти."
      actionText="Добавяне на продукт"
      onAction={onCreateNew}
      className={className}
      {...props}
    />
  );
} 
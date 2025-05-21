"use client"

import React from 'react';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { ErrorMessage } from '@/components/ui/error-message';

interface FormLayoutProps extends React.FormHTMLAttributes<HTMLFormElement> {
  children: React.ReactNode;
}

export function FormLayout({ children, className, ...props }: FormLayoutProps) {
  return (
    <form className={cn("form-container", className)} {...props}>
      {children}
    </form>
  );
}

interface FormSectionProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function FormSection({ title, description, children, className }: FormSectionProps) {
  return (
    <div className={cn("form-section", className)}>
      {title && (
        <div className="mb-4">
          <h3 className="text-lg font-medium">{title}</h3>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
      )}
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
}

interface FormFieldProps {
  label?: string;
  error?: string;
  required?: boolean;
  htmlFor?: string;
  children: React.ReactNode;
  className?: string;
  helpText?: string;
  labelClassName?: string;
}

export function FormField({
  label,
  error,
  required,
  htmlFor,
  children,
  className,
  helpText,
  labelClassName,
}: FormFieldProps) {
  const id = React.useId();
  const fieldId = htmlFor || id;

  return (
    <div className={cn("form-group", className)}>
      {label && (
        <Label 
          htmlFor={fieldId} 
          className={cn("mb-2 flex items-center", labelClassName)}
        >
          {label}
          {required && <span className="ml-1 text-destructive">*</span>}
        </Label>
      )}
      
      {React.isValidElement(children) && (
        React.cloneElement(children as React.ReactElement, {
          id: fieldId,
          "aria-invalid": !!error,
          "aria-describedby": error ? `${fieldId}-error` : undefined,
        })
      )}
      
      {helpText && (
        <p className="mt-1 text-xs text-muted-foreground">{helpText}</p>
      )}
      
      {error && (
        <ErrorMessage 
          id={`${fieldId}-error`}
          message={error} 
          type="error" 
          inline
          showIcon
          className="mt-1 text-xs"
        />
      )}
    </div>
  );
}

interface FormActionsProps {
  children: React.ReactNode;
  className?: string;
  align?: 'start' | 'end' | 'center' | 'between';
}

export function FormActions({ 
  children, 
  className,
  align = 'end'
}: FormActionsProps) {
  const alignmentClasses = {
    start: 'justify-start',
    end: 'justify-end',
    center: 'justify-center',
    between: 'justify-between',
  };

  return (
    <div className={cn(
      "flex items-center mt-6 pt-4 border-t",
      alignmentClasses[align],
      className
    )}>
      {children}
    </div>
  );
} 
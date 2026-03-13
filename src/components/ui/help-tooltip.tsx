"use client"

import React from 'react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { HelpCircle } from "lucide-react"
import { cn } from '@/lib/utils'

interface HelpTooltipProps {
  /** Съдържание на tooltip-а */
  content: React.ReactNode;
  /** Размер на иконата */
  iconSize?: 'sm' | 'md' | 'lg';
  /** Дали да показва икона */
  showIcon?: boolean;
  /** Допълнителни CSS класове */
  className?: string;
  /** Допълнителни CSS класове за tooltip-а */
  tooltipClassName?: string;
  /** Странично съдържание (ако не искате да показвате иконата) */
  children?: React.ReactNode;
  /** Странична позиция на tooltip-а */
  side?: 'top' | 'right' | 'bottom' | 'left';
  /** Допълнителен клас за иконата */
  iconClassName?: string;
}

export function HelpTooltip({
  content,
  iconSize = 'sm',
  showIcon = true,
  className,
  tooltipClassName,
  children,
  side = 'top',
  iconClassName,
}: HelpTooltipProps) {
  const iconSizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  }

  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger className={cn('inline-flex items-center', className)}>
          {children || (showIcon && (
            <HelpCircle 
              className={cn(
                iconSizeClasses[iconSize],
                'text-muted-foreground hover:text-foreground transition-colors',
                iconClassName
              )} 
            />
          ))}
        </TooltipTrigger>
        <TooltipContent 
          side={side} 
          className={cn(
            'bg-popover text-popover-foreground px-3 py-2 text-sm max-w-xs wrap-break-word',
            tooltipClassName
          )}
        >
          {content}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
} 
"use client"

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { HelpTooltip } from '@/components/ui/help-tooltip';
import { HelpCircleIcon, ExternalLinkIcon } from 'lucide-react';
import Link from 'next/link';

interface ContextHelpProps {
  /** Заглавие на помощния диалог */
  title: string;
  /** Кратко описание - показва се в tooltip */
  tooltipContent: React.ReactNode;
  /** Пълно описание - показва се в диалога */
  description?: React.ReactNode;
  /** Списък с линкове към свързана документация */
  relatedLinks?: {
    title: string;
    href: string;
  }[];
  /** Видео ръководство URL (ако има) */
  videoUrl?: string;
  /** Заглавие на видео提醒大家 */
  videoTitle?: string;
  /** Дали да показва бутон вместо икона */
  asButton?: boolean;
  /** Позиция на tooltip-а */
  tooltipSide?: 'top' | 'right' | 'bottom' | 'left';
  /** Клас на иконата */
  iconClassName?: string;
  /** Допълнителен клас за контейнера */
  className?: string;
}

export function ContextHelp({
  title,
  tooltipContent,
  description,
  relatedLinks = [],
  videoUrl,
  videoTitle,
  asButton = false,
  tooltipSide = 'top',
  iconClassName,
  className,
}: ContextHelpProps) {
  const [isOpen, setIsOpen] = useState(false);

  const trigger = asButton ? (
    <Button variant="ghost" size="sm" className="text-muted-foreground">
      <HelpCircleIcon className="mr-1 h-4 w-4" />
      Помощ
    </Button>
  ) : (
    <HelpTooltip
      content={tooltipContent}
      side={tooltipSide}
      iconSize="md"
      iconClassName={iconClassName}
    />
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <div className={className}>
        {/* Използваме HelpTooltip за малки съвети, но с възможност за отваряне на пълния диалог */}
        <DialogTrigger asChild>
          {trigger}
        </DialogTrigger>
      </div>
      
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && (
            <DialogDescription>
              {description}
            </DialogDescription>
          )}
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {videoUrl && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Видео ръководство: {videoTitle}</h4>
              <div className="relative aspect-video overflow-hidden rounded-lg border bg-muted">
                <iframe
                  src={videoUrl}
                  className="absolute inset-0 h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          )}
          
          {relatedLinks.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Свързани ресурси</h4>
              <div className="rounded-md border">
                <div className="divide-y">
                  {relatedLinks.map((link, i) => (
                    <div key={i} className="flex items-center justify-between p-3">
                      <span className="text-sm">{link.title}</span>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={link.href} className="flex items-center whitespace-nowrap" onClick={() => setIsOpen(false)}>
                          Преглед
                          <ExternalLinkIcon className="ml-1 h-3 w-3" />
                        </Link>
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="flex justify-end">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Затвори
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Компонент за показване на секция "Нужна ли ви е помощ?"
export function HelpSection({ 
  title = "Нужна ли ви е помощ?",
  description = "Изберете от предложените ресурси или се свържете с нашия екип за поддръжка."
}) {
  return (
    <div className="border rounded-lg p-4 bg-muted/20">
      <h3 className="text-lg font-medium mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground mb-4">{description}</p>
      
      <div className="grid grid-cols-2 gap-3">
        <Button variant="outline" asChild className="justify-start">
          <Link href="/docs/guides" className="flex items-center whitespace-nowrap">
            <HelpCircleIcon className="mr-2 h-4 w-4" />
            Ръководства
          </Link>
        </Button>
        <Button variant="outline" asChild className="justify-start">
          <Link href="/docs/faq" className="flex items-center whitespace-nowrap">
            <HelpCircleIcon className="mr-2 h-4 w-4" />
            Често задавани въпроси
          </Link>
        </Button>
        <Button variant="outline" asChild className="justify-start">
          <Link href="/docs/video-tutorials" className="flex items-center whitespace-nowrap">
            <HelpCircleIcon className="mr-2 h-4 w-4" />
            Видео уроци
          </Link>
        </Button>
        <Button variant="outline" asChild className="justify-start">
          <Link href="/support" className="flex items-center whitespace-nowrap">
            <HelpCircleIcon className="mr-2 h-4 w-4" />
            Свържете се с нас
          </Link>
        </Button>
      </div>
    </div>
  );
} 
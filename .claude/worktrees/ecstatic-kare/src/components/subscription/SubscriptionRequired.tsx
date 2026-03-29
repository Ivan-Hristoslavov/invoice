"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useSubscription } from '@/hooks/useSubscription';
import { ShieldAlert, CheckCheck } from 'lucide-react';

interface SubscriptionRequiredProps {
  title?: string;
  description?: string;
  message?: string;
  feature?: string;
}

export function SubscriptionRequired({
  title = 'Тази функция е част от платения план',
  description = 'С по-висок план отключвате още възможности: повече фактури, изпращане по имейл, лого и др.',
  message,
  feature,
}: SubscriptionRequiredProps) {
  const { subscription } = useSubscription();
  
  const currentPlan = subscription?.plan || 'БЕЗПЛАТЕН';
  
  return (
    <Card className="mx-auto max-w-md">
      <CardHeader>
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-amber-600" />
          <CardTitle>{title}</CardTitle>
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {message && (
            <p className="text-sm text-muted-foreground">{message}</p>
          )}
          
          <div className="bg-muted p-3 rounded-md">
            <p className="text-sm font-medium">Вашият текущ абонамент: <span className="font-bold">{currentPlan}</span></p>
            {feature && (
              <p className="text-xs text-muted-foreground mt-1">
                За да ползвате {feature}, изберете подходящ план по-долу.
              </p>
            )}
          </div>
          
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-1">
              <CheckCheck className="w-4 h-4 text-green-500" />
              Какво получавате с надграждане:
            </h4>
            <ul className="text-sm space-y-1 ml-6 list-disc">
              <li>Повече фактури и клиенти</li>
              <li>Ваше лого на фактурите — изглеждайте по-професионално</li>
              <li>Изпращане по имейл — получавайте плащания по-бързо</li>
              <li>Приоритетна поддръжка</li>
            </ul>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex gap-2 flex-col sm:flex-row">
        <Button asChild className="w-full sm:w-auto">
          <Link href="/settings/subscription">
            Вижте плановете и цените
          </Link>
        </Button>
        
        <Button variant="outline" asChild className="w-full sm:w-auto">
          <Link href="/">
            Към началото
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
} 
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
  title = 'Subscription Required',
  description = 'This feature requires a higher tier subscription.',
  message,
  feature,
}: SubscriptionRequiredProps) {
  const { subscription } = useSubscription();
  
  const currentPlan = subscription?.plan || 'FREE';
  
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
            <p className="text-sm font-medium">Your current subscription: <span className="font-bold">{currentPlan}</span></p>
            {feature && (
              <p className="text-xs text-muted-foreground mt-1">
                You need to upgrade your subscription to access {feature}.
              </p>
            )}
          </div>
          
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-1">
              <CheckCheck className="w-4 h-4 text-green-500" />
              Upgrade to unlock:
            </h4>
            <ul className="text-sm space-y-1 ml-6 list-disc">
              <li>More clients and invoices</li>
              <li>Custom branding options</li>
              <li>Advanced features</li>
              <li>Priority support</li>
            </ul>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex gap-2 flex-col sm:flex-row">
        <Button asChild className="w-full sm:w-auto">
          <Link href="/settings/subscription">
            View Subscription Plans
          </Link>
        </Button>
        
        <Button variant="outline" asChild className="w-full sm:w-auto">
          <Link href="/">
            Go Back
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
} 
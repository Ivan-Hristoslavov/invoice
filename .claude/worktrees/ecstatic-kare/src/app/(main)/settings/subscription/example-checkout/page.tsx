'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function ExampleCheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const plan = searchParams.get('plan');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading for 2 seconds
    const timeout = setTimeout(() => {
      setLoading(false);
    }, 2000);

    return () => clearTimeout(timeout);
  }, []);

  const handleContinue = () => {
    router.push('/settings/subscription?success=true&example=true');
  };

  const handleCancel = () => {
    router.push('/settings/subscription?canceled=true&example=true');
  };

  return (
    <div className="container max-w-lg py-12">
      <Alert variant="warning" className="mb-8">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Example Checkout</AlertTitle>
        <AlertDescription>
          This is a demo checkout page because you're using example price IDs. In a real
          application, you would be redirected to Stripe's checkout page.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Example Checkout for {plan || 'Subscription'} Plan</CardTitle>
          <CardDescription>
            This simulates the Stripe checkout process without actual payment
          </CardDescription>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="flex flex-col items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
              <p className="text-sm text-muted-foreground">Processing your subscription...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center py-8">
              <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
              <p className="text-lg font-medium mb-2">Ready to Continue</p>
              <p className="text-sm text-muted-foreground text-center">
                In a real application, you would enter payment details on the Stripe checkout page.
                For this demo, just click "Complete Subscription" below.
              </p>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={handleCancel} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleContinue} disabled={loading}>
            Complete Subscription
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
} 
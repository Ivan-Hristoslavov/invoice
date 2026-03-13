"use client";

import { useState } from 'react';
import { Button, ButtonProps } from '@/components/ui/button';
import { useSubscription } from '@/hooks/useSubscription';

interface CheckoutButtonProps extends ButtonProps {
  plan: 'FREE' | 'STARTER' | 'PRO' | 'BUSINESS';
  children: React.ReactNode;
}

export function CheckoutButton({
  plan,
  children,
  ...props
}: CheckoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { createCheckoutSession } = useSubscription();

  const handleClick = async () => {
    try {
      setIsLoading(true);
      await createCheckoutSession(plan);
    } catch (error) {
      console.error('Checkout error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleClick}
      disabled={isLoading}
      {...props}
    >
      {isLoading ? 'Redirecting...' : children}
    </Button>
  );
} 
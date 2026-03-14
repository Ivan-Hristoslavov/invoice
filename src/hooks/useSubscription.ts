import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';

interface Subscription {
  id: string;
  plan: 'FREE' | 'STARTER' | 'PRO' | 'BUSINESS';
  status: string;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: string;
  paymentHistory: {
    id: string;
    amount: number;
    currency: string;
    status: string;
    createdAt: string;
  }[];
  history: {
    id: string;
    status: string;
    event: string;
    createdAt: string;
  }[];
}

interface UseSubscriptionReturn {
  subscription: Subscription | null;
  isLoading: boolean;
  error: string | null;
  createCheckoutSession: (plan: string, billingInterval?: 'monthly' | 'yearly') => Promise<void>;
  cancelSubscription: () => Promise<void>;
}

export function useSubscription(): UseSubscriptionReturn {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    async function fetchSubscription() {
      if (status === 'loading') return;
      if (status === 'unauthenticated') {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const response = await fetch('/api/subscription');
        if (!response.ok) {
          throw new Error(`Failed to fetch subscription: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        setSubscription(data.subscription);
      } catch (err: any) {
        console.error('Error fetching subscription:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }

    fetchSubscription();
  }, [status]);

  const createCheckoutSession = async (plan: string, billingInterval: 'monthly' | 'yearly' = 'yearly') => {
    try {
      setIsLoading(true);
      
      // Get direct Stripe URL instead of creating a checkout session
      const response = await fetch('/api/subscription/direct-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan,
          billingInterval,
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error("Error response:", errorData);
        throw new Error(errorData || 'Failed to get checkout link');
      }
      const data = await response.json();

      if (data.url) {
        // Always try to open in a new tab
        const newWindow = window.open(data.url, '_blank', 'noopener,noreferrer');
        
        // Check if popup was blocked
        if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
          console.warn("Popup blocked by browser, using alternative method");
          // Try alternative: create an anchor and click it programmatically
          const link = document.createElement('a');
          link.href = data.url;
          link.target = '_blank';
          link.rel = 'noopener noreferrer';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      } else throw new Error('No checkout URL returned');
    } catch (err: any) {
      console.error('Checkout error:', err);
      setError(err.message || 'Failed to start checkout process');
    } finally {
      setIsLoading(false);
    }
  };

  const cancelSubscription = async () => {
    if (!subscription) return;

    try {
      setIsLoading(true);
      
      // Cancel subscription
      const response = await fetch('/api/subscription/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscriptionId: subscription.id,
        }),
      });

      if (response.ok) {
        // Refresh subscription data
        const subscriptionResponse = await fetch('/api/subscription');
        const data = await subscriptionResponse.json();
        setSubscription(data.subscription);
      } else {
        const error = await response.text();
        throw new Error(error);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    subscription,
    isLoading,
    error,
    createCheckoutSession,
    cancelSubscription,
  };
} 
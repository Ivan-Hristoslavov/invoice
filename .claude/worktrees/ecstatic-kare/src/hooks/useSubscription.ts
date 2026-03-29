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
  refetchSubscription: () => Promise<void>;
  /** Refetch without showing loading (e.g. after payment when webhook may be delayed) */
  refetchSubscriptionSilent: () => Promise<void>;
}

export function useSubscription(): UseSubscriptionReturn {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { data: session, status } = useSession();
  const router = useRouter();

  const fetchSubscription = async (silent = false) => {
    if (status === 'unauthenticated') return;
    try {
      if (!silent) setIsLoading(true);
      setError(null);
      const response = await fetch('/api/subscription');
      if (!response.ok) {
        throw new Error(`Failed to fetch subscription: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      setSubscription(data.subscription ?? null);
    } catch (err: any) {
      console.error('Error fetching subscription:', err);
      if (!silent) setError(err?.message ?? 'Failed to fetch');
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated') {
      setIsLoading(false);
      return;
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
        const contentType = response.headers.get("content-type");
        let errorMessage = "Failed to get checkout link";
        try {
          if (contentType?.includes("application/json")) {
            const json = await response.json();
            errorMessage = json?.error || json?.message || errorMessage;
          } else {
            const text = await response.text();
            if (text) errorMessage = text;
          }
        } catch {
          // use default errorMessage
        }
        console.error("Error response:", errorMessage);
        throw new Error(errorMessage);
      }
      const data = await response.json();

      const url = typeof data?.url === 'string' ? data.url.trim() : '';
      if (!url) throw new Error('No checkout URL returned');

      // Only open Stripe Checkout URLs; never open our own API or other origins (e.g. after misredirect)
      const isStripeCheckout = url.startsWith('https://checkout.stripe.com/');
      if (!isStripeCheckout) {
        console.error('Checkout URL is not Stripe:', url);
        throw new Error('Invalid checkout link. Please try again or contact support.');
      }

      // Same tab: go to Stripe; after payment Stripe redirects back to /settings/subscription?success=true
      window.location.href = url;
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
        await fetchSubscription();
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
    refetchSubscription: () => fetchSubscription(false),
    refetchSubscriptionSilent: () => fetchSubscription(true),
  };
} 
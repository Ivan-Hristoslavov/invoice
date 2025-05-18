"use client";

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface UseSubscriptionLimitResult {
  checkLimit: (feature: string) => Promise<{ allowed: boolean; message?: string }>;
  isChecking: boolean;
  error: string | null;
}

export function useSubscriptionLimit(): UseSubscriptionLimitResult {
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { data: session } = useSession();
  const router = useRouter();

  const checkLimit = async (feature: 'clients' | 'invoices' | 'products' | 'customBranding') => {
    try {
      setIsChecking(true);
      setError(null);

      if (!session?.user) {
        router.push('/signin');
        return { allowed: false, message: 'You need to be signed in' };
      }

      const response = await fetch(`/api/subscription/check-limit?feature=${feature}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to check subscription limit');
      }

      const result = await response.json();
      return result;
    } catch (err: any) {
      setError(err.message);
      return { allowed: false, message: err.message };
    } finally {
      setIsChecking(false);
    }
  };

  return {
    checkLimit,
    isChecking,
    error,
  };
} 
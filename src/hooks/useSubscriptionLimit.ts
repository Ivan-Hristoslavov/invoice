"use client";

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface SubscriptionLimitResult {
  allowed: boolean;
  message?: string;
  plan?: string;
}

export interface UsageData {
  plan: string;
  invoices: {
    used: number;
    limit: number;
    periodStart: string;
    periodEnd: string;
  };
  companies: {
    used: number;
    limit: number;
  };
  clients: {
    used: number;
    limit: number;
  };
  products: {
    used: number;
    limit: number;
  };
  users: {
    used: number;
    limit: number;
  };
  features: {
    customBranding: boolean;
    export: boolean | string;
    creditNotes: boolean;
    emailSending: boolean;
    apiAccess: boolean;
  };
}

interface UseSubscriptionLimitResult {
  checkLimit: (feature: string) => Promise<SubscriptionLimitResult>;
  isChecking: boolean;
  error: string | null;
  plan: string | null;
  isPro: boolean;
  isBusiness: boolean;
  isFree: boolean;
  isStarter: boolean;
  // New usage-related properties
  usage: UsageData | null;
  isLoadingUsage: boolean;
  refreshUsage: () => Promise<void>;
  canCreateInvoice: boolean;
  canCreateCompany: boolean;
  canCreateClient: boolean;
  canCreateProduct: boolean;
  canAddUser: boolean;
  canUseFeature: (feature: keyof UsageData['features']) => boolean;
  getInvoiceUsage: () => { used: number; limit: number; remaining: number };
  getCompanyUsage: () => { used: number; limit: number; remaining: number };
  getClientUsage: () => { used: number; limit: number; remaining: number };
  getProductUsage: () => { used: number; limit: number; remaining: number };
  getUserUsage: () => { used: number; limit: number; remaining: number };
}

export function useSubscriptionLimit(): UseSubscriptionLimitResult {
  const [isChecking, setIsChecking] = useState(false);
  const [isLoadingUsage, setIsLoadingUsage] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState<string | null>(null);
  const [usage, setUsage] = useState<UsageData | null>(null);
  const { data: session } = useSession();
  const router = useRouter();

  // Fetch usage data
  const fetchUsage = useCallback(async () => {
    if (!session?.user) return;
    
    try {
      setIsLoadingUsage(true);
      const response = await fetch('/api/subscription/usage');
      
      if (response.ok) {
        const data: UsageData = await response.json();
        setUsage(data);
        setPlan(data.plan);
      } else {
        // Default to FREE plan if error
        setPlan('FREE');
      }
    } catch {
      setPlan('FREE');
    } finally {
      setIsLoadingUsage(false);
    }
  }, [session]);

  // Fetch usage on mount and when session changes
  useEffect(() => {
    fetchUsage();
  }, [fetchUsage]);

  const refreshUsage = useCallback(async () => {
    await fetchUsage();
  }, [fetchUsage]);

  const checkLimit = useCallback(async (feature: 'clients' | 'invoices' | 'products' | 'customBranding' | 'export' | 'emailSending' | 'creditNotes' | 'users' | 'companies'): Promise<SubscriptionLimitResult> => {
    try {
      setIsChecking(true);
      setError(null);

      if (!session?.user) {
        router.push('/signin');
        return { allowed: false, message: 'Трябва да сте влезли в системата' };
      }

      const response = await fetch(`/api/subscription/check-limit?feature=${feature}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Грешка при проверка на абонамента');
      }

      const result = await response.json();
      if (result.plan) {
        setPlan(result.plan);
      }
      return result;
    } catch (err: any) {
      setError(err.message);
      return { allowed: false, message: err.message };
    } finally {
      setIsChecking(false);
    }
  }, [session, router]);

  // Helper functions for checking capabilities
  const canCreateInvoice = usage 
    ? (usage.invoices.limit === -1 || usage.invoices.used < usage.invoices.limit)
    : true;

  const canCreateCompany = usage 
    ? (usage.companies.limit === -1 || usage.companies.used < usage.companies.limit)
    : true;

  const canCreateClient = usage 
    ? (usage.clients.limit === -1 || usage.clients.used < usage.clients.limit)
    : true;

  const canCreateProduct = usage 
    ? (usage.products.limit === -1 || usage.products.used < usage.products.limit)
    : true;

  const canAddUser = usage 
    ? (usage.users.used < usage.users.limit)
    : false;

  const canUseFeature = useCallback((feature: keyof UsageData['features']): boolean => {
    if (!usage) return false;
    return usage.features[feature];
  }, [usage]);

  const getInvoiceUsage = useCallback(() => {
    if (!usage) return { used: 0, limit: 3, remaining: 3 };
    const limit = usage.invoices.limit === -1 ? Infinity : usage.invoices.limit;
    return {
      used: usage.invoices.used,
      limit: limit,
      remaining: limit === Infinity ? Infinity : Math.max(0, limit - usage.invoices.used),
    };
  }, [usage]);

  const getCompanyUsage = useCallback(() => {
    if (!usage) return { used: 0, limit: 1, remaining: 1 };
    const limit = usage.companies.limit === -1 ? Infinity : usage.companies.limit;
    return {
      used: usage.companies.used,
      limit: limit,
      remaining: limit === Infinity ? Infinity : Math.max(0, limit - usage.companies.used),
    };
  }, [usage]);

  const getClientUsage = useCallback(() => {
    if (!usage) return { used: 0, limit: 5, remaining: 5 };
    const limit = usage.clients.limit === -1 ? Infinity : usage.clients.limit;
    return {
      used: usage.clients.used,
      limit: limit,
      remaining: limit === Infinity ? Infinity : Math.max(0, limit - usage.clients.used),
    };
  }, [usage]);

  const getProductUsage = useCallback(() => {
    if (!usage) return { used: 0, limit: 10, remaining: 10 };
    const limit = usage.products.limit === -1 ? Infinity : usage.products.limit;
    return {
      used: usage.products.used,
      limit: limit,
      remaining: limit === Infinity ? Infinity : Math.max(0, limit - usage.products.used),
    };
  }, [usage]);

  const getUserUsage = useCallback(() => {
    if (!usage) return { used: 1, limit: 1, remaining: 0 };
    return {
      used: usage.users.used,
      limit: usage.users.limit,
      remaining: Math.max(0, usage.users.limit - usage.users.used),
    };
  }, [usage]);

  return {
    checkLimit,
    isChecking,
    error,
    plan,
    isPro: plan === 'PRO',
    isBusiness: plan === 'BUSINESS',
    isFree: plan === 'FREE' || plan === null,
    isStarter: plan === 'STARTER',
    // New usage-related returns
    usage,
    isLoadingUsage,
    refreshUsage,
    canCreateInvoice,
    canCreateCompany,
    canCreateClient,
    canCreateProduct,
    canAddUser,
    canUseFeature,
    getInvoiceUsage,
    getCompanyUsage,
    getClientUsage,
    getProductUsage,
    getUserUsage,
  };
} 
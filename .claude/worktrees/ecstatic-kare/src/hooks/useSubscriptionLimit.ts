"use client";

import { useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useSubscriptionUsage, type UsageData } from '@/hooks/subscription-usage-context';

interface SubscriptionLimitResult {
  allowed: boolean;
  message?: string;
  plan?: string;
}

interface UseSubscriptionLimitResult {
  checkLimit: (feature: 'clients' | 'invoices' | 'products' | 'customBranding' | 'export' | 'emailSending' | 'creditNotes' | 'users' | 'companies') => Promise<SubscriptionLimitResult>;
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
  const [error, setError] = useState<string | null>(null);
  const { data: session } = useSession();
  const router = useRouter();
  const {
    usage,
    plan,
    isLoadingUsage,
    refreshUsage,
  } = useSubscriptionUsage();

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
    if (feature === "export") {
      return usage.features.export !== "none";
    }

    return Boolean(usage.features[feature]);
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
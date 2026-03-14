"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";

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

interface SubscriptionUsageContextValue {
  usage: UsageData | null;
  plan: string | null;
  isLoadingUsage: boolean;
  refreshUsage: () => Promise<void>;
}

const SubscriptionUsageContext = createContext<SubscriptionUsageContextValue | null>(null);

export function SubscriptionUsageProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [plan, setPlan] = useState<string | null>(null);
  const [isLoadingUsage, setIsLoadingUsage] = useState(false);

  const fetchUsage = useCallback(async () => {
    if (!session?.user) {
      setUsage(null);
      setPlan(null);
      setIsLoadingUsage(false);
      return;
    }

    try {
      setIsLoadingUsage(true);
      const response = await fetch("/api/subscription/usage");

      if (!response.ok) {
        setPlan("FREE");
        return;
      }

      const data: UsageData = await response.json();
      setUsage(data);
      setPlan(data.plan);
    } catch {
      setPlan("FREE");
    } finally {
      setIsLoadingUsage(false);
    }
  }, [session?.user]);

  useEffect(() => {
    if (status === "loading") return;

    if (status === "unauthenticated") {
      setUsage(null);
      setPlan(null);
      setIsLoadingUsage(false);
      return;
    }

    fetchUsage();
  }, [fetchUsage, status]);

  const value = useMemo(
    () => ({
      usage,
      plan,
      isLoadingUsage,
      refreshUsage: fetchUsage,
    }),
    [fetchUsage, isLoadingUsage, plan, usage]
  );

  return (
    <SubscriptionUsageContext.Provider value={value}>
      {children}
    </SubscriptionUsageContext.Provider>
  );
}

export function useSubscriptionUsage() {
  const context = useContext(SubscriptionUsageContext);

  if (!context) {
    throw new Error("useSubscriptionUsage must be used within SubscriptionUsageProvider");
  }

  return context;
}

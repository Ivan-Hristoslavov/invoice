"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { type ExportCapability } from "@/lib/subscription-plans";

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
    export: ExportCapability;
    creditNotes: boolean;
    emailSending: boolean;
    apiAccess: boolean;
    eikSearch: boolean;
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
  const inFlightRequestRef = useRef<Promise<void> | null>(null);
  const lastFetchedAtRef = useRef(0);
  const lastUserKeyRef = useRef<string | null>(null);
  const cacheRef = useRef<{ usage: UsageData | null; plan: string | null }>({
    usage: null,
    plan: null,
  });

  const userKey = session?.user
    ? `${(session.user as { id?: string }).id ?? ""}:${session.user.email ?? ""}`
    : null;

  const fetchUsage = useCallback(async (options?: { force?: boolean }) => {
    if (!userKey) {
      setUsage(null);
      setPlan(null);
      setIsLoadingUsage(false);
      cacheRef.current = { usage: null, plan: null };
      lastFetchedAtRef.current = 0;
      lastUserKeyRef.current = null;
      return;
    }

    const isSameUser = lastUserKeyRef.current === userKey;
    const isFresh = Date.now() - lastFetchedAtRef.current < 60_000;

    if (!options?.force && isSameUser && isFresh) {
      setUsage(cacheRef.current.usage);
      setPlan(cacheRef.current.plan);
      setIsLoadingUsage(false);
      return;
    }

    if (inFlightRequestRef.current) {
      return inFlightRequestRef.current;
    }

    const request = (async () => {
      try {
        setIsLoadingUsage(true);
        const response = await fetch("/api/subscription/usage", {
          cache: "no-store",
        });

        if (!response.ok) {
          cacheRef.current = { usage: null, plan: "FREE" };
          setUsage(null);
          setPlan("FREE");
          lastFetchedAtRef.current = Date.now();
          lastUserKeyRef.current = userKey;
          return;
        }

        const data: UsageData = await response.json();
        cacheRef.current = { usage: data, plan: data.plan };
        setUsage(data);
        setPlan(data.plan);
        lastFetchedAtRef.current = Date.now();
        lastUserKeyRef.current = userKey;
      } catch {
        cacheRef.current = { usage: null, plan: "FREE" };
        setUsage(null);
        setPlan("FREE");
      } finally {
        setIsLoadingUsage(false);
        inFlightRequestRef.current = null;
      }
    })();

    inFlightRequestRef.current = request;
    return request;
  }, [userKey]);

  useEffect(() => {
    if (status === "loading") return;

    if (status === "unauthenticated") {
      setUsage(null);
      setPlan(null);
      setIsLoadingUsage(false);
      cacheRef.current = { usage: null, plan: null };
      lastFetchedAtRef.current = 0;
      lastUserKeyRef.current = null;
      return;
    }

    void fetchUsage();
  }, [fetchUsage, status, userKey]);

  useEffect(() => {
    if (!userKey) return;

    const revalidateIfStale = () => {
      if (Date.now() - lastFetchedAtRef.current < 120_000) return;
      void fetchUsage({ force: true });
    };

    window.addEventListener("focus", revalidateIfStale);
    document.addEventListener("visibilitychange", revalidateIfStale);

    return () => {
      window.removeEventListener("focus", revalidateIfStale);
      document.removeEventListener("visibilitychange", revalidateIfStale);
    };
  }, [fetchUsage, userKey]);

  const refreshUsage = useCallback(async () => {
    await fetchUsage({ force: true });
  }, [fetchUsage]);

  const value = useMemo(
    () => ({
      usage,
      plan,
      isLoadingUsage,
      refreshUsage,
    }),
    [isLoadingUsage, plan, refreshUsage, usage]
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

"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useSession } from "next-auth/react";
import type { UsageData } from "@/lib/subscription-types";

export type { UsageData };

/** sessionStorage: един таб, оцелява при F5; изчиства се при изход. */
const USAGE_STORAGE_KEY = "inv.subscriptionUsage.v1";
/**
 * Без нова заявка към /api/subscription/usage докато кешът е „пресен“.
 * След създаване на фактура/клиент и т.н. извикайте refreshUsage() — това винаги опреснява.
 */
const USAGE_CLIENT_CACHE_MAX_MS = 60 * 60 * 1000;

interface PersistedUsagePayload {
  userKey: string;
  usage: UsageData;
  plan: string;
  savedAt: number;
}

function readPersistedUsage(userKey: string): PersistedUsagePayload | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(USAGE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedUsagePayload;
    if (parsed.userKey !== userKey) return null;
    if (Date.now() - parsed.savedAt > USAGE_CLIENT_CACHE_MAX_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writePersistedUsage(userKey: string, usage: UsageData, plan: string | null) {
  if (typeof window === "undefined") return;
  try {
    const payload: PersistedUsagePayload = {
      userKey,
      usage,
      plan: plan ?? usage.plan,
      savedAt: Date.now(),
    };
    sessionStorage.setItem(USAGE_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // private mode / quota
  }
}

function clearPersistedUsage() {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(USAGE_STORAGE_KEY);
  } catch {
    // ignore
  }
}

interface SubscriptionUsageContextValue {
  usage: UsageData | null;
  plan: string | null;
  isLoadingUsage: boolean;
  refreshUsage: () => Promise<void>;
}

const SubscriptionUsageContext = createContext<SubscriptionUsageContextValue | null>(null);

export type SubscriptionUsageServerHydration = {
  userKey: string;
  usage: UsageData;
  plan: string;
  fetchedAt: number;
};

export function SubscriptionUsageProvider({
  children,
  initialData = null,
}: {
  children: React.ReactNode;
  initialData?: SubscriptionUsageServerHydration | null;
}) {
  const { data: session, status } = useSession();
  const [usage, setUsage] = useState<UsageData | null>(() => initialData?.usage ?? null);
  const [plan, setPlan] = useState<string | null>(() => initialData?.plan ?? null);
  const [isLoadingUsage, setIsLoadingUsage] = useState(() => !initialData);
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
      clearPersistedUsage();
      setUsage(null);
      setPlan(null);
      setIsLoadingUsage(false);
      cacheRef.current = { usage: null, plan: null };
      lastFetchedAtRef.current = 0;
      lastUserKeyRef.current = null;
      return;
    }

    const isSameUser = lastUserKeyRef.current === userKey;
    const isFresh =
      lastFetchedAtRef.current > 0 &&
      Date.now() - lastFetchedAtRef.current < USAGE_CLIENT_CACHE_MAX_MS;

    if (
      !options?.force &&
      isSameUser &&
      isFresh &&
      cacheRef.current.usage
    ) {
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
          clearPersistedUsage();
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
        writePersistedUsage(userKey, data, data.plan);
      } catch {
        clearPersistedUsage();
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

  /** Преди боя: SSR hydration или sessionStorage → без празен план и без чакане на мрежата при F5. */
  useLayoutEffect(() => {
    if (status === "loading" || !userKey) {
      return;
    }

    if (status === "unauthenticated") {
      return;
    }

    if (lastUserKeyRef.current !== null && lastUserKeyRef.current !== userKey) {
      setUsage(null);
      setPlan(null);
      cacheRef.current = { usage: null, plan: null };
      lastFetchedAtRef.current = 0;
    }

    if (
      initialData &&
      initialData.userKey === userKey &&
      Date.now() - initialData.fetchedAt < USAGE_CLIENT_CACHE_MAX_MS
    ) {
      cacheRef.current = { usage: initialData.usage, plan: initialData.plan };
      setUsage(initialData.usage);
      setPlan(initialData.plan);
      lastFetchedAtRef.current = initialData.fetchedAt;
      lastUserKeyRef.current = userKey;
      setIsLoadingUsage(false);
      writePersistedUsage(userKey, initialData.usage, initialData.plan);
      return;
    }

    const persisted = readPersistedUsage(userKey);
    if (!persisted) return;

    cacheRef.current = { usage: persisted.usage, plan: persisted.plan };
    setUsage(persisted.usage);
    setPlan(persisted.plan);
    lastFetchedAtRef.current = persisted.savedAt;
    lastUserKeyRef.current = userKey;
  }, [status, userKey, initialData]);

  useEffect(() => {
    if (status === "loading") return;

    if (status === "unauthenticated") {
      clearPersistedUsage();
      setUsage(null);
      setPlan(null);
      setIsLoadingUsage(false);
      cacheRef.current = { usage: null, plan: null };
      lastFetchedAtRef.current = 0;
      lastUserKeyRef.current = null;
      return;
    }

    if (!userKey) return;

    const bootstrappedFresh =
      initialData &&
      initialData.userKey === userKey &&
      Date.now() - initialData.fetchedAt < USAGE_CLIENT_CACHE_MAX_MS &&
      lastFetchedAtRef.current === initialData.fetchedAt &&
      lastUserKeyRef.current === userKey;

    if (bootstrappedFresh) return;

    void fetchUsage();
  }, [fetchUsage, status, userKey, initialData]);

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

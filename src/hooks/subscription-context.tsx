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
import type { Subscription } from "@/lib/subscription-types";

export type { Subscription };

/** Същият прозорец като usage: един таб, без повторни GET при всяка страница. */
const SUBSCRIPTION_STORAGE_KEY = "inv.subscription.v1";
const SUBSCRIPTION_CLIENT_CACHE_MAX_MS = 60 * 60 * 1000;

interface PersistedSubscriptionPayload {
  userKey: string;
  subscription: Subscription | null;
  savedAt: number;
}

function readPersistedSubscription(userKey: string): PersistedSubscriptionPayload | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(SUBSCRIPTION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedSubscriptionPayload;
    if (parsed.userKey !== userKey) return null;
    if (Date.now() - parsed.savedAt > SUBSCRIPTION_CLIENT_CACHE_MAX_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writePersistedSubscription(userKey: string, subscription: Subscription | null) {
  if (typeof window === "undefined") return;
  try {
    const payload: PersistedSubscriptionPayload = {
      userKey,
      subscription,
      savedAt: Date.now(),
    };
    sessionStorage.setItem(SUBSCRIPTION_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // ignore
  }
}

function clearPersistedSubscription() {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(SUBSCRIPTION_STORAGE_KEY);
  } catch {
    // ignore
  }
}

interface SubscriptionContextValue {
  subscription: Subscription | null;
  isLoading: boolean;
  error: string | null;
  createCheckoutSession: (plan: string, billingInterval?: "monthly" | "yearly") => Promise<void>;
  cancelSubscription: () => Promise<void>;
  refetchSubscription: () => Promise<void>;
  refetchSubscriptionSilent: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextValue | null>(null);

export type SubscriptionServerHydration = {
  userKey: string;
  subscription: Subscription | null;
  fetchedAt: number;
};

export function SubscriptionProvider({
  children,
  initialData = null,
}: {
  children: React.ReactNode;
  initialData?: SubscriptionServerHydration | null;
}) {
  const { data: session, status } = useSession();
  const [subscription, setSubscription] = useState<Subscription | null>(
    () => initialData?.subscription ?? null
  );
  const [isLoading, setIsLoading] = useState(() => !initialData);
  const [error, setError] = useState<string | null>(null);

  const inFlightRef = useRef<Promise<void> | null>(null);
  const lastFetchedAtRef = useRef(0);
  const lastUserKeyRef = useRef<string | null>(null);
  const cacheRef = useRef<Subscription | null>(null);
  const checkoutMutationRef = useRef(false);
  const cancelMutationRef = useRef(false);

  const userKey = session?.user
    ? `${(session.user as { id?: string }).id ?? ""}:${session.user.email ?? ""}`
    : null;

  const fetchSubscription = useCallback(
    async (options?: { silent?: boolean; force?: boolean }) => {
      if (!userKey || status === "unauthenticated") {
        return;
      }

      const silent = options?.silent ?? false;
      const force = options?.force ?? false;

      const isSameUser = lastUserKeyRef.current === userKey;
      const isFresh =
        lastFetchedAtRef.current > 0 &&
        Date.now() - lastFetchedAtRef.current < SUBSCRIPTION_CLIENT_CACHE_MAX_MS;

      if (!force && isSameUser && isFresh) {
        setSubscription(cacheRef.current);
        if (!silent) setIsLoading(false);
        setError(null);
        return;
      }

      if (inFlightRef.current) {
        return inFlightRef.current;
      }

      const run = (async () => {
        try {
          if (!silent) setIsLoading(true);
          setError(null);
          const response = await fetch("/api/subscription");
          if (!response.ok) {
            throw new Error(`Failed to fetch subscription: ${response.status} ${response.statusText}`);
          }
          const data = await response.json();
          const next = (data.subscription ?? null) as Subscription | null;
          cacheRef.current = next;
          setSubscription(next);
          lastFetchedAtRef.current = Date.now();
          lastUserKeyRef.current = userKey;
          writePersistedSubscription(userKey, next);
        } catch (err: unknown) {
          console.error("Error fetching subscription:", err);
          const message = err instanceof Error ? err.message : "Failed to fetch";
          if (!silent) setError(message);
          clearPersistedSubscription();
        } finally {
          if (!silent) setIsLoading(false);
          inFlightRef.current = null;
        }
      })();

      inFlightRef.current = run;
      return run;
    },
    [status, userKey]
  );

  useLayoutEffect(() => {
    if (status === "loading" || !userKey) {
      return;
    }

    if (status === "unauthenticated") {
      return;
    }

    if (lastUserKeyRef.current !== null && lastUserKeyRef.current !== userKey) {
      setSubscription(null);
      cacheRef.current = null;
      lastFetchedAtRef.current = 0;
    }

    if (
      initialData &&
      initialData.userKey === userKey &&
      Date.now() - initialData.fetchedAt < SUBSCRIPTION_CLIENT_CACHE_MAX_MS
    ) {
      cacheRef.current = initialData.subscription;
      setSubscription(initialData.subscription);
      lastFetchedAtRef.current = initialData.fetchedAt;
      lastUserKeyRef.current = userKey;
      setIsLoading(false);
      setError(null);
      writePersistedSubscription(userKey, initialData.subscription);
      return;
    }

    const persisted = readPersistedSubscription(userKey);
    if (!persisted) return;

    cacheRef.current = persisted.subscription;
    setSubscription(persisted.subscription);
    lastFetchedAtRef.current = persisted.savedAt;
    lastUserKeyRef.current = userKey;
    setIsLoading(false);
    setError(null);
  }, [status, userKey, initialData]);

  useEffect(() => {
    if (status === "loading") return;

    if (status === "unauthenticated") {
      clearPersistedSubscription();
      setSubscription(null);
      cacheRef.current = null;
      setIsLoading(false);
      setError(null);
      lastFetchedAtRef.current = 0;
      lastUserKeyRef.current = null;
      return;
    }

    if (!userKey) return;

    const bootstrappedFresh =
      initialData &&
      initialData.userKey === userKey &&
      Date.now() - initialData.fetchedAt < SUBSCRIPTION_CLIENT_CACHE_MAX_MS &&
      lastFetchedAtRef.current === initialData.fetchedAt &&
      lastUserKeyRef.current === userKey;

    if (bootstrappedFresh) return;

    void fetchSubscription({ silent: false, force: false });
  }, [fetchSubscription, status, userKey, initialData]);

  const createCheckoutSession = useCallback(
    async (plan: string, billingInterval: "monthly" | "yearly" = "yearly") => {
      if (checkoutMutationRef.current) return;
      checkoutMutationRef.current = true;
      try {
        setIsLoading(true);
        const response = await fetch("/api/subscription/direct-link", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
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

        const url = typeof data?.url === "string" ? data.url.trim() : "";
        if (!url) throw new Error("No checkout URL returned");

        const isStripeCheckout = url.startsWith("https://checkout.stripe.com/");
        if (!isStripeCheckout) {
          console.error("Checkout URL is not Stripe:", url);
          throw new Error("Invalid checkout link. Please try again or contact support.");
        }

        window.location.href = url;
      } catch (err: unknown) {
        console.error("Checkout error:", err);
        setError(err instanceof Error ? err.message : "Failed to start checkout process");
      } finally {
        checkoutMutationRef.current = false;
        setIsLoading(false);
      }
    },
    []
  );

  const cancelSubscription = useCallback(async () => {
    if (!subscription) return;
    if (cancelMutationRef.current) return;
    cancelMutationRef.current = true;

    try {
      setIsLoading(true);
      const response = await fetch("/api/subscription/cancel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subscriptionId: subscription.id,
        }),
      });

      if (response.ok) {
        await fetchSubscription({ silent: false, force: true });
      } else {
        const errorText = await response.text();
        throw new Error(errorText);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Cancel failed");
    } finally {
      cancelMutationRef.current = false;
      setIsLoading(false);
    }
  }, [fetchSubscription, subscription]);

  const refetchSubscription = useCallback(async () => {
    await fetchSubscription({ silent: false, force: true });
  }, [fetchSubscription]);

  const refetchSubscriptionSilent = useCallback(async () => {
    await fetchSubscription({ silent: true, force: true });
  }, [fetchSubscription]);

  const value = useMemo(
    () => ({
      subscription,
      isLoading,
      error,
      createCheckoutSession,
      cancelSubscription,
      refetchSubscription,
      refetchSubscriptionSilent,
    }),
    [
      subscription,
      isLoading,
      error,
      createCheckoutSession,
      cancelSubscription,
      refetchSubscription,
      refetchSubscriptionSilent,
    ]
  );

  return <SubscriptionContext.Provider value={value}>{children}</SubscriptionContext.Provider>;
}

export function useSubscription(): SubscriptionContextValue {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) {
    throw new Error("useSubscription must be used within SubscriptionProvider");
  }
  return ctx;
}

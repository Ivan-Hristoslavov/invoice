import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { resolveSessionUser } from "@/lib/session-user";
import {
  getSubscriptionPayloadForUser,
  getUsagePayloadForUser,
} from "@/lib/server/subscription-payloads";
import type { Subscription, UsageData } from "@/lib/subscription-types";

export type MainSubscriptionHydration = {
  userKey: string;
  subscription: Subscription | null;
  usage: UsageData;
  plan: string;
  fetchedAt: number;
};

export async function loadMainSubscriptionData(): Promise<MainSubscriptionHydration | null> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return null;

    const sessionUser = await resolveSessionUser(session.user);
    if (!sessionUser) return null;

    const email = sessionUser.email ?? "";
    const userKey = `${sessionUser.id}:${email}`;

    const [subscription, usageBlock] = await Promise.all([
      getSubscriptionPayloadForUser(sessionUser.id),
      getUsagePayloadForUser(sessionUser.id),
    ]);

    return {
      userKey,
      subscription,
      usage: usageBlock.usage,
      plan: usageBlock.plan,
      fetchedAt: Date.now(),
    };
  } catch (e) {
    console.warn("loadMainSubscriptionData:", e);
    return null;
  }
}

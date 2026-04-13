import type { SubscriptionPlanKey } from "@/lib/subscription-plans";

/** Пълноценен градиентен фон за pricing карти (landing + абонамент) — съвместим със светла/тъмна тема */
export const PRICING_CARD_SURFACE: Record<SubscriptionPlanKey, string> = {
  FREE:
    "bg-linear-to-br from-slate-400/18 via-slate-500/10 to-card/95 dark:from-slate-500/28 dark:via-slate-800/35 dark:to-card/88",
  STARTER:
    "bg-linear-to-br from-blue-500/22 via-indigo-600/14 to-card/95 dark:from-blue-500/28 dark:via-indigo-900/35 dark:to-card/88",
  PRO:
    "bg-linear-to-br from-emerald-500/30 via-teal-600/22 to-slate-900/55 dark:from-emerald-600/35 dark:via-teal-900/40 dark:to-slate-950/78",
  BUSINESS:
    "bg-linear-to-br from-violet-500/22 via-purple-600/14 to-card/95 dark:from-violet-500/28 dark:via-purple-900/32 dark:to-card/88",
};

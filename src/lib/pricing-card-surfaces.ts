import type { SubscriptionPlanKey } from "@/lib/subscription-plans";

/** Пълноценен градиентен фон за pricing карти (landing + абонамент) — съвместим със светла/тъмна тема */
export const PRICING_CARD_SURFACE: Record<SubscriptionPlanKey, string> = {
  FREE:
    "bg-linear-to-br from-slate-400/18 via-slate-500/10 to-card/95 dark:from-slate-500/28 dark:via-slate-800/35 dark:to-card/88",
  STARTER:
    "bg-linear-to-br from-blue-500/22 via-indigo-600/14 to-card/95 dark:from-blue-500/28 dark:via-indigo-900/35 dark:to-card/88",
  PRO:
    "bg-linear-to-br from-emerald-400/28 via-teal-500/18 to-cyan-950/25 dark:from-emerald-500/32 dark:via-teal-900/30 dark:to-cyan-950/40",
  BUSINESS:
    "bg-linear-to-br from-violet-500/22 via-purple-600/14 to-card/95 dark:from-violet-500/28 dark:via-purple-900/32 dark:to-card/88",
};

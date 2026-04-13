import { cn } from "@/lib/utils";

/**
 * Якорни линкове: `/#id` (не само `#id`), за да не се трупат фрагменти в Next.js.
 * По-малко линкове от секции — `data-landing-spy` групира няколко блока под един таб.
 */
export const LANDING_NAV = [
  { href: "/#top", label: "Начало", spy: "top" },
  { href: "/#product", label: "Продукт", spy: "product" },
  { href: "/#pricing", label: "Цени", spy: "pricing" },
  { href: "/#compliance", label: "Съответствие", spy: "compliance" },
  { href: "/#contact", label: "Контакт", spy: "contact" },
] as const;

export type LandingNavSpy = (typeof LANDING_NAV)[number]["spy"];

export function landingNavLinkVisual(isActive: boolean) {
  return cn(
    "shrink-0 rounded-full border px-2 py-1 text-xs font-medium outline-none transition-[color,background-color,border-color,box-shadow] duration-200 sm:px-2.5 sm:py-1.5 sm:text-sm",
    "focus-visible:ring-2 focus-visible:ring-emerald-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    isActive
      ? "border-emerald-500/70 bg-emerald-500/10 text-emerald-700 shadow-sm dark:border-emerald-400/55 dark:bg-emerald-500/15 dark:text-emerald-300"
      : "border-transparent text-muted-foreground hover:border-border/50 hover:bg-muted/50 hover:text-foreground"
  );
}

export const LANDING_SCROLL_MARGIN = "scroll-mt-28 sm:scroll-mt-32";

/** Секции — еднакъв външен отстъп; фонът е само от глобалния лендинг слой (точки/иконки). */
export const LANDING_ZONE_OUTER = "px-4 py-8 sm:py-10";
/** Един и същ „стъклен“ панел за всички секции (hero, продукт, цени, контакт). */
export const LANDING_ZONE_PANEL =
  "rounded-2xl border border-border/40 bg-card/70 shadow-sm backdrop-blur-sm dark:bg-card/40";
export const LANDING_ZONE_PANEL_PAD = "p-5 sm:p-8 md:p-10";

export const LANDING_HEADER_SCROLL_COMPACT = 48;

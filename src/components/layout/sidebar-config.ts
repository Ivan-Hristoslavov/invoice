import type { LucideIcon } from "lucide-react";
import {
  Building,
  FileText,
  Scale,
  User,
  ShieldCheck,
  CreditCard,
  ScrollText,
} from "lucide-react";

export const SETTINGS_NAV_ITEMS: readonly {
  name: string;
  href: string;
  icon: LucideIcon;
}[] = [
  { name: "Компания", href: "/settings/company", icon: Building },
  { name: "Фактури", href: "/settings/invoice-preferences", icon: FileText },
  { name: "Данъци (НАП)", href: "/settings/tax-compliance", icon: Scale },
  { name: "Профил", href: "/settings/profile", icon: User },
  { name: "Сигурност", href: "/settings/security", icon: ShieldCheck },
  { name: "Абонамент", href: "/settings/subscription", icon: CreditCard },
  { name: "Одит", href: "/settings/audit-logs", icon: ScrollText },
] as const;

export const SETTINGS_NAV_GROUPS: readonly {
  title: string;
  items: readonly {
    name: string;
    href: string;
    icon: LucideIcon;
    children?: readonly { name: string; href: string }[];
  }[];
}[] = [
  {
    title: "Организация и фактури",
    items: [
      {
        name: "Компания",
        href: "/settings/company",
        icon: Building,
        children: [
          { name: "Основни", href: "/settings/company" },
          { name: "Банка", href: "/settings/company/bank" },
          { name: "Лого", href: "/settings/company/logo" },
        ],
      },
      { name: "Фактури", href: "/settings/invoice-preferences", icon: FileText },
      { name: "Данъци (НАП)", href: "/settings/tax-compliance", icon: Scale },
    ],
  },
  {
    title: "Акаунт и достъп",
    items: [
      { name: "Профил", href: "/settings/profile", icon: User },
      { name: "Сигурност", href: "/settings/security", icon: ShieldCheck },
    ],
  },
  {
    title: "План и плащане",
    items: [{ name: "Абонамент", href: "/settings/subscription", icon: CreditCard }],
  },
  {
    title: "Система и журнал",
    items: [{ name: "Одит", href: "/settings/audit-logs", icon: ScrollText }],
  },
] as const;

const LS_SETTINGS_EXPANDED = "sidebar-settings-expanded";

export function getInitialSettingsExpanded(pathname: string): boolean {
  if (typeof window === "undefined") {
    return pathname.startsWith("/settings") && !pathname.startsWith("/settings/team");
  }
  const raw = localStorage.getItem(LS_SETTINGS_EXPANDED);
  if (raw === "true") return true;
  if (raw === "false") return false;
  return pathname.startsWith("/settings") && !pathname.startsWith("/settings/team");
}

export function persistSettingsExpanded(value: boolean) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LS_SETTINGS_EXPANDED, value ? "true" : "false");
}

export function isSettingsChildActive(pathname: string, href: string) {
  if (pathname === href) return true;
  const rest = pathname.slice(href.length);
  return rest.startsWith("/") && rest.length > 1;
}

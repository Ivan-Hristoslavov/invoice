"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Check, ChevronDown, Monitor, Moon, Sun } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuItemIcon,
  DropdownMenuItemText,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const themeOptions = [
  { value: "light" as const, label: "Светла", icon: Sun },
  { value: "dark" as const, label: "Тъмна", icon: Moon },
  { value: "system" as const, label: "Системна", icon: Monitor },
];

export type ThemeMenuLayout = "icon" | "sidebarRow";

type ThemeMenuProps = {
  layout?: ThemeMenuLayout;
  className?: string;
  align?: "start" | "end" | "center";
};

export function ThemeMenu({ layout = "icon", className, align = "end" }: ThemeMenuProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    if (layout === "icon") {
      return (
        <div
          className={cn(
            "h-10 w-10 shrink-0 animate-pulse rounded-full border border-border/60 bg-muted/50",
            className
          )}
          aria-hidden
        />
      );
    }
    return <div className={cn("h-10 animate-pulse rounded-xl bg-muted/60", className)} aria-hidden />;
  }

  const active = themeOptions.find((o) => o.value === theme) ?? themeOptions[2];
  const ActiveIcon = active.icon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          layout === "icon"
            ? "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border/60 bg-background/80 text-foreground outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
            : "flex w-full items-center gap-2.5 rounded-xl border border-transparent px-2.5 py-2 text-sm font-medium text-foreground outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring sm:gap-3 sm:px-3",
          className
        )}
        aria-label={`Тема: ${active.label}. Отвори избор`}
      >
        {layout === "icon" ? (
          <ActiveIcon className="h-4 w-4 shrink-0 text-foreground" aria-hidden />
        ) : (
          <>
            <ActiveIcon className="h-5 w-5 shrink-0 text-foreground" aria-hidden />
            <span className="min-w-0 flex-1 text-left">Тема</span>
            <span className="truncate text-xs text-muted-foreground">{active.label}</span>
            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
          </>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="min-w-44">
        {themeOptions.map(({ value, label, icon: Icon }) => (
          <DropdownMenuItem
            key={value}
            className="gap-2"
            onClick={() => setTheme(value)}
          >
            <DropdownMenuItemIcon>
              <Icon />
            </DropdownMenuItemIcon>
            <DropdownMenuItemText>{label}</DropdownMenuItemText>
            {theme === value ? (
              <Check className="ml-auto h-4 w-4 shrink-0 text-primary" aria-hidden />
            ) : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

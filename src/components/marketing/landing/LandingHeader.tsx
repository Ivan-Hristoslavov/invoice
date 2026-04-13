"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, FileText, Menu } from "lucide-react";
import { APP_NAME } from "@/config/constants";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuItemIcon,
  DropdownMenuItemText,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { LANDING_NAV, landingNavLinkVisual, type LandingNavSpy } from "./landing-nav";

export function LandingHeader({
  shouldReduceEffects,
  isHeaderCompact,
  activeLandingSpy,
  setActiveLandingSpy,
}: {
  shouldReduceEffects: boolean;
  isHeaderCompact: boolean;
  activeLandingSpy: LandingNavSpy;
  setActiveLandingSpy: (spy: LandingNavSpy) => void;
}) {
  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 w-full rounded-none border-x-0 border-t-0 glass-card supports-backdrop-filter:bg-background/80",
        shouldReduceEffects
          ? "transition-none"
          : "transition-[box-shadow,background-color,border-color,backdrop-filter] duration-300 ease-out",
        isHeaderCompact
          ? "border-b border-border/70 bg-card/95 shadow-lg shadow-black/5 backdrop-blur-md dark:border-border/80 dark:bg-card/90 dark:shadow-black/20"
          : "border-b border-transparent shadow-sm"
      )}
    >
      <div
        className={cn(
          "container relative mx-auto flex min-w-0 max-w-full items-center justify-between gap-2 px-3 sm:gap-3 sm:px-4 md:px-6",
          shouldReduceEffects ? "" : "transition-[min-height,gap] duration-300 ease-out",
          isHeaderCompact ? "min-h-11 py-1 sm:min-h-12" : "min-h-14 py-0 sm:min-h-16"
        )}
      >
        <motion.div
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          className="relative z-20 flex min-w-0 shrink-0 items-center gap-1.5 sm:gap-2"
        >
          <DropdownMenu>
            <DropdownMenuTrigger
              className={cn(
                "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg md:hidden",
                "text-muted-foreground outline-none transition-colors",
                "hover:bg-accent hover:text-accent-foreground",
                "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              )}
              aria-label="Отвори навигацията"
            >
              <Menu className="h-5 w-5" aria-hidden />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-48">
              {LANDING_NAV.map((item) => (
                <DropdownMenuItem key={item.spy} asChild>
                  <Link
                    href={item.href}
                    scroll
                    className={cn(
                      "w-full cursor-pointer",
                      landingNavLinkVisual(activeLandingSpy === item.spy)
                    )}
                    aria-current={activeLandingSpy === item.spy ? "page" : undefined}
                    onClick={() => setActiveLandingSpy(item.spy)}
                  >
                    <DropdownMenuItemIcon>
                      <span className="block size-4" aria-hidden />
                    </DropdownMenuItemIcon>
                    <DropdownMenuItemText>{item.label}</DropdownMenuItemText>
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Link
            href="/#top"
            className={cn(
              "flex min-w-0 items-center gap-1.5 rounded-lg outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring sm:gap-2",
              !shouldReduceEffects && "transition-[gap] duration-300 ease-out"
            )}
            aria-label="Към началото на страницата"
          >
            <span
              className={cn(
                "flex shrink-0 items-center justify-center overflow-hidden rounded-lg gradient-primary shadow-md transition-[width,height,border-radius] duration-300 ease-out",
                isHeaderCompact ? "h-6 w-6 rounded-md sm:h-7 sm:w-7" : "h-7 w-7 sm:h-8 sm:w-8"
              )}
            >
              <FileText
                className={cn(
                  "text-white transition-[width,height] duration-300 ease-out",
                  isHeaderCompact ? "h-3.5 w-3.5 sm:h-4 sm:w-4" : "h-4 w-4 sm:h-5 sm:w-5"
                )}
                aria-hidden
              />
            </span>
            <span
              className={cn(
                "truncate font-bold tracking-tight transition-[font-size] duration-300 ease-out",
                isHeaderCompact ? "text-sm sm:text-lg" : "text-base sm:text-xl"
              )}
            >
              {APP_NAME}
            </span>
          </Link>
        </motion.div>

        <nav
          className={cn(
            "pointer-events-none absolute left-1/2 top-1/2 z-10 hidden min-h-0 -translate-x-1/2 -translate-y-1/2 items-center justify-center overflow-x-auto text-muted-foreground [scrollbar-width:none] md:pointer-events-auto md:flex md:max-w-[min(92vw,28rem)] [&::-webkit-scrollbar]:hidden",
            "transition-[gap] duration-300 ease-out",
            isHeaderCompact ? "gap-1 lg:gap-2" : "gap-1.5 lg:gap-3 xl:gap-4"
          )}
          aria-label="Секции на страницата"
        >
          {LANDING_NAV.map((item) => {
            const isActive = activeLandingSpy === item.spy;
            return (
              <Link
                key={item.spy}
                href={item.href}
                scroll
                className={cn("pointer-events-auto whitespace-nowrap", landingNavLinkVisual(isActive))}
                aria-current={isActive ? "page" : undefined}
                onClick={() => setActiveLandingSpy(item.spy)}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <motion.div
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          className={cn(
            "relative z-20 flex shrink-0 items-center justify-end transition-[gap] duration-300 ease-out",
            isHeaderCompact ? "gap-1" : "gap-1 sm:gap-1.5"
          )}
        >
          <div className="shrink-0">
            <ThemeToggle />
          </div>
          <Button
            variant="outline"
            size="sm"
            asChild
            className={cn(
              "hidden h-9 shrink-0 border border-border/70 bg-background/90 px-2.5 text-xs font-semibold shadow-sm hover:bg-muted/60 md:inline-flex",
              isHeaderCompact && "h-8 px-2 text-[11px]"
            )}
          >
            <Link href="/signin" className="whitespace-nowrap">
              Вход
            </Link>
          </Button>
          <Button
            size="sm"
            asChild
            className={cn(
              "gradient-primary h-9 shrink-0 border-2 border-white/20 px-2.5 text-xs font-semibold text-white shadow-md hover:border-white/45 hover:shadow-md hover:shadow-emerald-500/20 sm:px-3",
              "transition-[height,padding] duration-300 ease-out",
              isHeaderCompact && "h-8 px-2 text-[11px]"
            )}
          >
            <Link href="/signup" className="flex items-center justify-center whitespace-nowrap">
              <span className="md:hidden">Старт</span>
              <span className="hidden md:inline xl:hidden">Започнете</span>
              <span className="hidden xl:inline">
                {isHeaderCompact ? "Започнете" : "Започнете безплатно"}
              </span>
              <ArrowRight
                className={cn(
                  "ml-0.5 h-3.5 w-3.5 shrink-0 sm:ml-1 sm:h-4 sm:w-4",
                  isHeaderCompact && "ml-0.5 h-3 w-3"
                )}
                aria-hidden
              />
            </Link>
          </Button>
        </motion.div>
      </div>
    </header>
  );
}

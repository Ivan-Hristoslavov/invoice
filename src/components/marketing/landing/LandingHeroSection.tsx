"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { heroHighlights } from "./landing-content";
import {
  LANDING_SCROLL_MARGIN,
  LANDING_ZONE_OUTER,
  LANDING_ZONE_PANEL,
  LANDING_ZONE_PANEL_PAD,
} from "./landing-nav";
import { LandingSectionLabel } from "./LandingSectionLabel";

export function LandingHeroSection() {
  return (
    <section
      id="top"
      data-landing-spy="top"
      className={cn(LANDING_SCROLL_MARGIN, LANDING_ZONE_OUTER, "bg-transparent")}
    >
      <div className="container mx-auto max-w-6xl">
        <div className={cn(LANDING_ZONE_PANEL, LANDING_ZONE_PANEL_PAD)}>
          <div className="mx-auto max-w-3xl px-1 text-center sm:px-4">
            <div className="flex justify-center">
              <LandingSectionLabel>Начало</LandingSectionLabel>
            </div>
            <h1
              className="hero-title mx-auto mt-3 mb-3 max-w-[13ch] text-foreground sm:mb-4 sm:max-w-4xl"
              style={{ textShadow: "0 6px 30px rgba(15, 23, 42, 0.24)" }}
            >
              <span className="block sm:inline">Фактурирайте </span>
              <span className="gradient-primary-text block sm:inline">професионално</span>
              <span className="block sm:inline"> за минути</span>
            </h1>
            <p className="card-description mx-auto mb-6 max-w-xl text-base sm:text-lg">
              Фактури и известия за България. Без плащания през нас — само документи и проследяване.
            </p>
            <div className="mx-auto mb-8 grid w-full max-w-lg grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
              <Button
                size="sm"
                asChild
                className="h-12 w-full border-2 border-white/20 px-5 text-sm font-semibold text-white shadow-lg gradient-primary hover:border-white/45 hover:shadow-lg hover:shadow-emerald-500/25 sm:h-12"
              >
                <Link href="/signup" className="flex items-center justify-center whitespace-nowrap">
                  Започнете безплатно
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                size="sm"
                variant="outline"
                asChild
                className="h-12 w-full border-2 border-border/80 bg-background/60 px-5 text-sm font-semibold shadow-sm backdrop-blur-sm hover:bg-muted/70 dark:border-border/60"
              >
                <Link href="/signin" className="flex items-center justify-center whitespace-nowrap">
                  Вход
                </Link>
              </Button>
            </div>
            <div className="mx-auto mt-2 grid max-w-lg grid-cols-3 gap-2 sm:max-w-xl sm:gap-3">
              {heroHighlights.map((stat) => (
                <div key={stat.label} className="rounded-xl bg-muted/40 px-2 py-2.5 sm:px-3 sm:py-3">
                  <div className="text-sm font-semibold text-foreground sm:text-base">{stat.value}</div>
                  <div className="metric-label mt-0.5 text-[11px] sm:text-xs">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

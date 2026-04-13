"use client";

import Link from "next/link";
import { ArrowRight, Mail } from "lucide-react";
import { publicBusinessProfile } from "@/config/public-business";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { faqItems } from "./landing-content";
import {
  LANDING_SCROLL_MARGIN,
  LANDING_ZONE_OUTER,
  LANDING_ZONE_PANEL,
  LANDING_ZONE_PANEL_PAD,
} from "./landing-nav";
import { LandingSectionLabel } from "./LandingSectionLabel";

export function LandingContactSection() {
  return (
    <section
      id="contact"
      data-landing-spy="contact"
      className={cn(LANDING_SCROLL_MARGIN, LANDING_ZONE_OUTER, "bg-transparent")}
    >
      <div className="container mx-auto max-w-6xl">
        <div className={cn(LANDING_ZONE_PANEL, LANDING_ZONE_PANEL_PAD)}>
          <header className="border-b border-border/50 pb-8 text-center">
            <div className="flex justify-center">
              <LandingSectionLabel>Контакт</LandingSectionLabel>
            </div>
            <h2 className="section-title mt-3">Въпроси и връзка</h2>
            <p className="card-description mx-auto mt-2 max-w-2xl">
              Често задавани въпроси, имейл и старт в акаунт — в една зона.
            </p>
          </header>

          <div id="faq" className={cn(LANDING_SCROLL_MARGIN, "mt-8")}>
            <h3 className="card-title mb-4 text-center sm:text-left">Често задавани</h3>
            <dl className="space-y-5">
              {faqItems.map((faq) => (
                <div key={faq.q} className="border-b border-border/40 pb-5 last:border-0 last:pb-0">
                  <dt className="card-title mb-1.5 text-base">{faq.q}</dt>
                  <dd className="card-description m-0">{faq.a}</dd>
                </div>
              ))}
            </dl>
          </div>

          <Separator className="my-8" />

          <div className="space-y-6">
            <div className="rounded-2xl border border-border/45 bg-gradient-to-br from-muted/50 to-muted/20 p-5 shadow-inner backdrop-blur-sm dark:from-muted/25 dark:to-muted/10 sm:p-6">
              <div className="mb-3 flex justify-center">
                <Chip color="default" variant="tertiary" size="sm" className="border border-border/55 bg-muted/30">
                  <Chip.Label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Поддръжка
                  </Chip.Label>
                </Chip>
              </div>
              <div className="flex flex-col items-center gap-4 sm:flex-row sm:flex-wrap sm:justify-center sm:gap-x-6 sm:gap-y-2">
                <a
                  href={`mailto:${publicBusinessProfile.supportEmail}`}
                  className="inline-flex items-center gap-2.5 rounded-xl border border-emerald-500/25 bg-emerald-500/5 px-4 py-2.5 text-sm font-semibold text-emerald-700 shadow-sm transition-colors hover:border-emerald-500/40 hover:bg-emerald-500/10 dark:text-emerald-300"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                    <Mail className="h-4 w-4" aria-hidden />
                  </span>
                  <span className="break-all">{publicBusinessProfile.supportEmail}</span>
                </a>
                <div className="hidden h-8 w-px bg-border/60 sm:block" aria-hidden />
                <p className="max-w-sm text-center text-sm leading-relaxed text-muted-foreground sm:max-w-none sm:text-left">
                  <span className="block sm:inline">Отговор {publicBusinessProfile.supportResponseHours}</span>
                  <span className="mx-2 hidden text-border sm:inline" aria-hidden>
                    ·
                  </span>
                  <Link
                    href="/contact"
                    className="mt-1 inline-flex items-center justify-center font-semibold text-primary underline-offset-4 hover:underline sm:mt-0 sm:inline"
                  >
                    Контактна форма →
                  </Link>
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:mx-auto sm:max-w-2xl sm:grid-cols-2 sm:gap-4">
              <Button
                asChild
                className="h-12 w-full border-2 border-white/20 text-base font-semibold text-white shadow-lg gradient-primary hover:border-white/45 hover:shadow-lg hover:shadow-emerald-500/25"
              >
                <Link href="/signup" className="flex items-center justify-center gap-2">
                  Започнете безплатно
                  <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
                </Link>
              </Button>
              <Button
                variant="outline"
                asChild
                className="h-12 w-full border-2 border-border/80 bg-background/70 text-base font-semibold shadow-sm backdrop-blur-sm hover:bg-muted/70 dark:border-border/60"
              >
                <Link href="/signin" className="flex items-center justify-center">
                  Вход
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Check, Percent, Star, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { cn, formatPrice } from "@/lib/utils";
import { PRICING_CARD_SURFACE } from "@/lib/pricing-card-surfaces";
import {
  LANDING_PLAN_THEME,
  pricingPlans,
  pricingTrustNotes,
  testimonials,
} from "./landing-content";
import {
  LANDING_SCROLL_MARGIN,
  LANDING_ZONE_OUTER,
  LANDING_ZONE_PANEL,
  LANDING_ZONE_PANEL_PAD,
} from "./landing-nav";
import { LandingSectionLabel } from "./LandingSectionLabel";

export function LandingPricingSection({
  isYearly,
  onYearlyChange,
}: {
  isYearly: boolean;
  onYearlyChange: (next: boolean) => void;
}) {
  return (
    <section
      id="pricing"
      data-landing-spy="pricing"
      className={cn(LANDING_SCROLL_MARGIN, LANDING_ZONE_OUTER, "bg-transparent")}
    >
      <div className="container relative z-1 mx-auto max-w-7xl">
        <div className={cn(LANDING_ZONE_PANEL, LANDING_ZONE_PANEL_PAD)}>
          <div className="mb-6 text-center sm:mb-8">
            <div className="flex justify-center">
              <LandingSectionLabel>Цени</LandingSectionLabel>
            </div>
            <h2 className="section-title mt-3">Планове</h2>
            <p className="card-description mx-auto mt-2 max-w-md">
              Месечно или годишно · EUR · без скрити такси за софтуера
            </p>
            <div className="mt-5 inline-flex items-center gap-3 rounded-full border border-border/40 bg-muted/40 px-4 py-2.5 shadow-inner backdrop-blur-sm sm:gap-4 sm:px-6 sm:py-3">
              <span
                className={cn(
                  "text-xs font-semibold transition-colors sm:text-sm",
                  !isYearly ? "text-foreground" : "text-muted-foreground"
                )}
              >
                Месечно
              </span>
              <Switch
                checked={isYearly}
                onCheckedChange={onYearlyChange}
                aria-label="Превключване към годишно ценообразуване"
                className="scale-90 sm:scale-100"
              />
              <span
                className={cn(
                  "flex items-center gap-1.5 text-xs font-semibold transition-colors sm:gap-2 sm:text-sm",
                  isYearly ? "text-foreground" : "text-muted-foreground"
                )}
              >
                Годишно
                <Chip
                  size="sm"
                  color="success"
                  variant="soft"
                  className="tiny-text h-5 gap-1 border border-emerald-500/55 bg-emerald-500/5 px-2 text-emerald-700 dark:border-emerald-400/50 dark:bg-emerald-500/10 dark:text-emerald-300"
                >
                  <Chip.Label className="flex items-center gap-1">
                    <Percent className="h-3 w-3 shrink-0" aria-hidden />
                    -17%
                  </Chip.Label>
                </Chip>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {pricingPlans.map((plan, index) => {
              const PlanIcon = plan.icon;
              const theme = LANDING_PLAN_THEME[plan.key];
              const monthlyPrice =
                isYearly && plan.price.yearly > 0 ? plan.price.yearly / 12 : plan.price.monthly;

              const planBody = (
                <>
                  {plan.popular ? (
                    <div
                      className="pointer-events-none absolute inset-x-0 top-0 h-24 rounded-t-[1.4375rem] bg-linear-to-b from-white/12 to-transparent dark:from-white/8"
                      aria-hidden
                    />
                  ) : null}
                  <div className="relative z-1 flex min-h-0 flex-1 flex-col p-4 sm:p-5">
                    <div className="mb-3 flex gap-3">
                      <div
                        className={cn(
                          "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl shadow-sm ring-1 ring-black/5 dark:ring-white/10",
                          plan.popular
                            ? "bg-white/25 ring-emerald-950/15 backdrop-blur-sm dark:bg-white/10 dark:ring-white/20"
                            : theme.iconBg,
                          plan.popular ? "text-emerald-950 dark:text-emerald-100" : theme.iconText
                        )}
                      >
                        <PlanIcon className="h-5 w-5" aria-hidden />
                      </div>
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-start justify-between gap-2">
                          <h3
                            className={cn(
                              "truncate text-sm font-semibold leading-tight",
                              plan.popular && "text-emerald-950 dark:text-emerald-50"
                            )}
                          >
                            {plan.name}
                          </h3>
                          {plan.popular ? (
                            <Badge className="h-5 shrink-0 border border-emerald-950/15 bg-emerald-950 px-2 py-0 text-[10px] font-semibold text-white shadow-sm dark:border-white/20 dark:bg-emerald-950/90">
                              <Star className="mr-0.5 h-2.5 w-2.5 fill-current" aria-hidden />
                              Популярен
                            </Badge>
                          ) : null}
                        </div>
                        <p
                          className={cn(
                            "truncate text-[11px] leading-tight sm:text-xs",
                            plan.popular
                              ? "font-medium text-emerald-950/95 dark:text-emerald-100"
                              : "text-muted-foreground"
                          )}
                          title={plan.description}
                        >
                          {plan.description}
                        </p>
                      </div>
                    </div>

                    <div className="mb-1">
                      {plan.key === "FREE" ? (
                        <div className="flex items-baseline gap-1">
                          <span className="text-xl font-bold tracking-tight sm:text-2xl">
                            {formatPrice(0)} €
                          </span>
                          <span className="text-sm text-muted-foreground">/завинаги</span>
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-baseline gap-1">
                            <span
                              className={cn(
                                "text-xl font-bold tracking-tight sm:text-2xl",
                                plan.popular && "text-emerald-950 dark:text-white"
                              )}
                            >
                              {formatPrice(monthlyPrice)}
                            </span>
                            <span
                              className={cn(
                                "text-sm font-semibold",
                                plan.popular
                                  ? "text-emerald-900 dark:text-emerald-200"
                                  : "font-normal text-muted-foreground"
                              )}
                            >
                              €/мес
                            </span>
                          </div>
                          {isYearly && plan.price.yearly > 0 ? (
                            <p
                              className={cn(
                                "mt-0.5 text-xs",
                                plan.popular
                                  ? "font-medium text-emerald-900/95 dark:text-emerald-100/95"
                                  : "text-muted-foreground"
                              )}
                            >
                              {formatPrice(plan.price.yearly)} € общо за 12 месеца · 2 месеца безплатно
                            </p>
                          ) : null}
                          {!isYearly ? (
                            <p
                              className={cn(
                                "mt-0.5 text-xs",
                                plan.popular
                                  ? "font-medium text-emerald-900/95 dark:text-emerald-100/95"
                                  : "text-muted-foreground"
                              )}
                            >
                              Таксува се месечно
                            </p>
                          ) : null}
                        </div>
                      )}
                    </div>

                    <div className="my-3 flex items-center gap-2">
                      <div
                        className={cn(
                          "h-px flex-1 bg-linear-to-r from-transparent to-transparent",
                          plan.popular ? "via-emerald-950/35 dark:via-white/35" : "via-border/80"
                        )}
                      />
                      <span
                        className={cn(
                          "text-[10px] font-bold uppercase tracking-[0.22em]",
                          plan.popular
                            ? "text-emerald-950 dark:text-emerald-200"
                            : "font-semibold text-muted-foreground"
                        )}
                      >
                        Функции
                      </span>
                      <div
                        className={cn(
                          "h-px flex-1 bg-linear-to-r from-transparent to-transparent",
                          plan.popular ? "via-emerald-950/35 dark:via-white/35" : "via-border/80"
                        )}
                      />
                    </div>

                    <ul className="mb-3 flex-1 space-y-1.5">
                      {plan.features.map((feat) => (
                        <li
                          key={feat.text}
                          className={cn(
                            "flex items-center gap-2 text-xs sm:text-sm",
                            plan.popular && feat.included && "font-medium text-emerald-950 dark:text-emerald-50",
                            plan.popular && !feat.included && "text-emerald-900/45 dark:text-emerald-400/45",
                            !plan.popular && !feat.included && "text-muted-foreground/50"
                          )}
                        >
                          {feat.included ? (
                            <div
                              className={cn(
                                "flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
                                plan.popular
                                  ? "bg-emerald-950/15 ring-1 ring-emerald-950/20 dark:bg-white/15 dark:ring-white/25"
                                  : theme.checkBg
                              )}
                            >
                              <Check
                                className={cn(
                                  "h-3 w-3",
                                  plan.popular ? "text-emerald-950 dark:text-emerald-100" : theme.checkIcon
                                )}
                                aria-hidden
                              />
                            </div>
                          ) : (
                            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted">
                              <X className="h-3 w-3 text-muted-foreground/40" aria-hidden />
                            </div>
                          )}
                          <span>{feat.text}</span>
                        </li>
                      ))}
                    </ul>

                    <div
                      className={cn(
                        "mt-auto border-t pt-3.5",
                        plan.popular ? "border-emerald-950/20 dark:border-white/20" : "border-border/40"
                      )}
                    >
                      <Button
                        asChild
                        className={cn(
                          "h-11 w-full rounded-2xl font-semibold sm:h-12",
                          plan.popular
                            ? cn("border-0 text-white", theme.btnPrimary)
                            : "border border-border/70 bg-background/90 hover:bg-muted/60"
                        )}
                        variant={plan.popular ? "default" : "outline"}
                      >
                        <Link href={plan.ctaHref} className="flex items-center justify-center whitespace-nowrap">
                          {plan.cta}
                        </Link>
                      </Button>
                    </div>
                  </div>
                </>
              );

              return (
                <motion.div
                  key={plan.key}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.08 }}
                  className={cn("flex min-h-0 flex-col", plan.popular && "xl:-mt-2 xl:mb-2")}
                >
                  {plan.popular ? (
                    <div className="pricing-featured-ring flex min-h-0 flex-1 flex-col">
                      <div
                        className={cn(
                          "relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-[calc(1.5rem-1px)] backdrop-blur-xl",
                          PRICING_CARD_SURFACE[plan.key]
                        )}
                      >
                        {planBody}
                      </div>
                    </div>
                  ) : (
                    <div
                      className={cn(
                        "relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-3xl border shadow-lg backdrop-blur-md transition-all duration-300",
                        "border-white/15 hover:border-white/25 hover:shadow-md dark:border-white/10",
                        PRICING_CARD_SURFACE[plan.key]
                      )}
                    >
                      {planBody}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>

          <Separator className="my-8 sm:my-10" />

          <h3 className="card-title mb-4 text-center">Отзиви</h3>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {testimonials.map((t) => (
              <Card key={t.name} className="border border-border/50 bg-background/60 shadow-xs">
                <CardContent className="p-4 sm:p-5">
                  <p className="small-text mb-3 leading-relaxed text-foreground/90">
                    &ldquo;{t.content}&rdquo;
                  </p>
                  <div className="flex items-center gap-3 border-t border-border/40 pt-3">
                    <div
                      className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-linear-to-br text-xs font-bold text-white",
                        t.gradient
                      )}
                    >
                      {t.initials}
                    </div>
                    <div className="min-w-0">
                      <p className="card-title text-sm leading-tight">{t.name}</p>
                      <p className="card-description text-xs">{t.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <p className="small-text mx-auto mt-8 max-w-2xl text-center leading-relaxed text-muted-foreground">
            {pricingTrustNotes.join(" · ")}. Плащанията са между вас и клиента — софтуерът е само за
            документи.
          </p>
        </div>
      </div>
    </section>
  );
}

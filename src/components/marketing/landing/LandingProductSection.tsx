"use client";

import { Check, CircleAlert } from "lucide-react";
import { APP_NAME } from "@/config/constants";
import { paymentMessage } from "@/config/public-business";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { features, workflowSteps } from "./landing-content";
import {
  LANDING_SCROLL_MARGIN,
  LANDING_ZONE_OUTER,
  LANDING_ZONE_PANEL,
  LANDING_ZONE_PANEL_PAD,
} from "./landing-nav";
import { LandingSectionLabel } from "./LandingSectionLabel";

export function LandingProductSection() {
  return (
    <section
      id="product"
      data-landing-spy="product"
      className={cn(LANDING_SCROLL_MARGIN, LANDING_ZONE_OUTER, "bg-transparent")}
    >
      <div className="container mx-auto max-w-6xl">
        <div className={cn(LANDING_ZONE_PANEL, LANDING_ZONE_PANEL_PAD)}>
          <header className="pb-6 text-center sm:pb-8">
            <div className="flex justify-center">
              <LandingSectionLabel>Продукт</LandingSectionLabel>
            </div>
            <h2 className="section-title mt-3">Какво прави {APP_NAME}</h2>
            <p className="card-description mx-auto mt-3 max-w-lg">
              Всичко за ежедневна работа с фактури и известия.
            </p>
          </header>

          <div className="mt-8 space-y-10 sm:mt-10 sm:space-y-12">
            <div>
              <h3 className="card-title mb-4 text-center sm:text-left">Възможности</h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {features.map((feature) => (
                  <Card
                    key={feature.title}
                    className="border-0 bg-transparent shadow-none ring-1 ring-border/50 dark:ring-border/40"
                  >
                    <CardContent className="flex gap-3 p-3 sm:p-4">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <feature.icon className="h-4 w-4" aria-hidden />
                      </div>
                      <div className="min-w-0">
                        <p className="card-title mb-1">{feature.title}</p>
                        <p className="card-description">{feature.description}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <div>
              <h3 className="card-title mb-4 text-center sm:text-left">За кого</h3>
              <Card className="border border-amber-400/35 bg-card">
                <CardContent className="space-y-4 p-4 sm:p-5">
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-2.5">
                    {[
                      "Фрийлансъри и МСП",
                      "Счетоводни къщи",
                      "Консултанти и агенции",
                      "Търговия и услуги",
                    ].map((item) => (
                      <div
                        key={item}
                        className="flex items-center gap-2 rounded-lg border border-border/50 bg-muted/20 px-3 py-2"
                      >
                        <Check className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
                        <span className="small-text font-medium">{item}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2 rounded-lg border border-amber-400/30 bg-amber-500/10 p-3 dark:bg-amber-500/5">
                    <CircleAlert
                      className="mt-0.5 h-4 w-4 shrink-0 text-amber-700 dark:text-amber-300"
                      aria-hidden
                    />
                    <p className="small-text leading-relaxed text-amber-950 dark:text-amber-100">
                      {paymentMessage.short} {paymentMessage.subscription} {paymentMessage.clientInvoices}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div>
              <h3 className="card-title mb-4 text-center sm:text-left">Три стъпки</h3>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                {workflowSteps.map((step, index) => (
                  <Card
                    key={step.title}
                    className="border-0 bg-transparent shadow-none ring-1 ring-border/50 dark:ring-border/40"
                  >
                    <CardContent className="p-3 sm:p-4">
                      <div className="mb-2 flex items-center gap-2.5">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
                          {index + 1}
                        </span>
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <step.icon className="h-4 w-4" aria-hidden />
                        </div>
                      </div>
                      <p className="card-title mb-1">{step.title}</p>
                      <p className="card-description">{step.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

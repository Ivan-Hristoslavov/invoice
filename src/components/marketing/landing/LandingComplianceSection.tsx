"use client";

import { APP_NAME } from "@/config/constants";
import { cn } from "@/lib/utils";
import {
  LANDING_SCROLL_MARGIN,
  LANDING_ZONE_OUTER,
  LANDING_ZONE_PANEL,
  LANDING_ZONE_PANEL_PAD,
} from "./landing-nav";
import { LandingSectionLabel } from "./LandingSectionLabel";

export function LandingComplianceSection() {
  return (
    <section
      id="compliance"
      data-landing-spy="compliance"
      className={cn(LANDING_SCROLL_MARGIN, LANDING_ZONE_OUTER, "bg-transparent")}
    >
      <div className="container mx-auto max-w-6xl">
        <div className={cn(LANDING_ZONE_PANEL, LANDING_ZONE_PANEL_PAD)}>
          <header className="border-b border-border/50 pb-8 text-center">
            <div className="flex justify-center">
              <LandingSectionLabel>Съответствие</LandingSectionLabel>
            </div>
            <h2 className="section-title mt-3">Електронни фактури и българската нормативна рамка</h2>
            <p className="card-description mx-auto mt-2 max-w-2xl">
              {APP_NAME} е софтуер за издаване и проследяване на фактури и известия. По-долу обобщаваме темите,
              които обикновено са свързани с електронно фактуриране — без да заместват индивидуален правен или
              счетоводен съвет.
            </p>
          </header>
          <div className="prose prose-sm dark:prose-invert mx-auto mt-8 max-w-3xl text-muted-foreground">
            <p className="text-foreground/90">
              Нормативната уредба включва сред другото Закона за електронния документ и електронния подпис (ЗЕДЕП),
              Закона за данък върху добавената стойност (ЗДДС) с подзаконовите актове (вкл. ППЗДДС), Закона за
              счетоводството (ЗСч) и корпоративното облагане (ЗКПО), както и актуалните разяснения и практика на
              НАП. Конкретните задължения зависят от вашия случай (регистрация по ДДС, вид контрагент, формат на
              обмен и др.).
            </p>
            <ul className="mt-4 space-y-2">
              <li>
                <strong className="text-foreground">Съдържание и неизменяемост:</strong> издадените документи
                трябва да съдържат изискуемите реквизити и да остават проследими след издаване (напр. чрез ясна
                номерация и история на промените).
              </li>
              <li>
                <strong className="text-foreground">ДДС и счетоводно отразяване:</strong> коректни данъчни полета,
                ставки и връзка с осчетоводяването съгласно приложимите правила.
              </li>
              <li>
                <strong className="text-foreground">Електронен обмен:</strong> при използване на външни платформи
                или доставчици на услуги проверете условията им и как се покриват изискванията за съхранение и
                достъпност на документите.
              </li>
            </ul>
            <p className="mt-6">
              Публично достъпни материали на трети страни могат да помогнат за ориентация. Пример:{" "}
              <a
                href="https://inv.bg/doc/NAP.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                документ на НАП (PDF)
              </a>
              .
            </p>
            <p className="mt-4 rounded-xl border border-amber-500/25 bg-amber-500/5 px-4 py-3 text-sm text-foreground/85 dark:bg-amber-500/10">
              Този текст е с информационна цел и не е правно становище. За тълкуване на ЗЕДЕП, ЗДДС, ЗСч, ЗКПО,
              ППЗДДС и актовете на НАП се обърнете към специалист.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

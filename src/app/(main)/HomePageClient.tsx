"use client";

import { useState } from "react";
import { LandingIconDecor } from "@/components/marketing/landing-icon-decor";
import { LandingComplianceSection } from "@/components/marketing/landing/LandingComplianceSection";
import { LandingContactSection } from "@/components/marketing/landing/LandingContactSection";
import { LandingFooter } from "@/components/marketing/landing/LandingFooter";
import { LandingHeader } from "@/components/marketing/landing/LandingHeader";
import { LandingHeroSection } from "@/components/marketing/landing/LandingHeroSection";
import { LandingMobileCta } from "@/components/marketing/landing/LandingMobileCta";
import { LandingPricingSection } from "@/components/marketing/landing/LandingPricingSection";
import { LandingProductSection } from "@/components/marketing/landing/LandingProductSection";
import { LandingStructuredData } from "@/components/marketing/landing/LandingStructuredData";
import {
  useLandingHeaderCompact,
  useLandingReducedEffects,
  useLandingScrollSpy,
} from "@/components/marketing/landing/use-landing-page";
import { BackgroundShapes } from "@/components/ui/background-shapes";
import { cn } from "@/lib/utils";

export default function HomePage() {
  const [isYearly, setIsYearly] = useState(false);
  const shouldReduceEffects = useLandingReducedEffects();
  const isHeaderCompact = useLandingHeaderCompact();
  const [activeLandingSpy, setActiveLandingSpy] = useLandingScrollSpy();

  return (
    <>
      <LandingStructuredData />

      <div className="relative flex min-h-screen flex-col overflow-x-hidden bg-background pb-24 sm:pb-0">
        <BackgroundShapes variant="subtle" reduceEffects={shouldReduceEffects} />
        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden>
          <div className="absolute inset-0 pricing-dot-bg" />
          <LandingIconDecor reduceEffects={shouldReduceEffects} />
        </div>

        <LandingHeader
          shouldReduceEffects={shouldReduceEffects}
          isHeaderCompact={isHeaderCompact}
          activeLandingSpy={activeLandingSpy}
          setActiveLandingSpy={setActiveLandingSpy}
        />

        <div
          className={cn(
            "shrink-0 transition-[height] duration-300 ease-out",
            shouldReduceEffects && "transition-none",
            isHeaderCompact ? "h-11 sm:h-12" : "h-14 sm:h-16"
          )}
          aria-hidden
        />

        <LandingHeroSection />
        <LandingProductSection />
        <LandingPricingSection isYearly={isYearly} onYearlyChange={setIsYearly} />
        <LandingComplianceSection />
        <LandingContactSection />
        <LandingMobileCta />
        <LandingFooter />
      </div>
    </>
  );
}

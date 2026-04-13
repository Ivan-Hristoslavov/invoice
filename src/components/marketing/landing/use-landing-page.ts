"use client";

import { useEffect, useState } from "react";
import { shouldReduceBrowserEffects } from "@/lib/browser-effects";
import {
  LANDING_HEADER_SCROLL_COMPACT,
  LANDING_NAV,
  type LandingNavSpy,
} from "./landing-nav";

export function useLandingReducedEffects() {
  const [shouldReduceEffects, setShouldReduceEffects] = useState(false);

  useEffect(() => {
    function updateEffects() {
      setShouldReduceEffects(shouldReduceBrowserEffects());
    }

    updateEffects();
    window.addEventListener("resize", updateEffects);
    return () => window.removeEventListener("resize", updateEffects);
  }, []);

  return shouldReduceEffects;
}

export function useLandingHeaderCompact() {
  const [isHeaderCompact, setIsHeaderCompact] = useState(false);

  useEffect(() => {
    let ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY ?? document.documentElement.scrollTop ?? 0;
        setIsHeaderCompact(y > LANDING_HEADER_SCROLL_COMPACT);
        ticking = false;
      });
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return isHeaderCompact;
}

export function useLandingScrollSpy() {
  const [activeLandingSpy, setActiveLandingSpy] = useState<LandingNavSpy>("top");

  useEffect(() => {
    const spySelector = "[data-landing-spy]";

    function readSpyFromHash(): LandingNavSpy | null {
      const raw = window.location.hash.replace(/^#/, "");
      if (!raw) return null;
      const match = LANDING_NAV.find((item) => item.href === `/#${raw}`);
      return match ? match.spy : null;
    }

    function updateActiveFromScroll() {
      const header = document.querySelector("header");
      const headerH = header?.getBoundingClientRect().height ?? 64;
      const y = window.scrollY + headerH + 16;
      const nodes = document.querySelectorAll<HTMLElement>(spySelector);
      let next: LandingNavSpy = "top";
      for (const el of nodes) {
        const spy = el.dataset.landingSpy as LandingNavSpy | undefined;
        if (!spy) continue;
        const top = el.getBoundingClientRect().top + window.scrollY;
        if (top <= y) next = spy;
      }
      setActiveLandingSpy((prev) => (prev === next ? prev : next));
    }

    function syncFromHash() {
      const fromHash = readSpyFromHash();
      if (fromHash) setActiveLandingSpy(fromHash);
      else updateActiveFromScroll();
    }

    syncFromHash();
    requestAnimationFrame(updateActiveFromScroll);

    window.addEventListener("scroll", updateActiveFromScroll, { passive: true });
    window.addEventListener("hashchange", syncFromHash);
    window.addEventListener("resize", updateActiveFromScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", updateActiveFromScroll);
      window.removeEventListener("hashchange", syncFromHash);
      window.removeEventListener("resize", updateActiveFromScroll);
    };
  }, []);

  return [activeLandingSpy, setActiveLandingSpy] as const;
}

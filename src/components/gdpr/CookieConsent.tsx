"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Cookie, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

const COOKIE_CONSENT_KEY = "cookie-consent";

type ConsentValue = "all" | "essential" | null;

export function CookieConsent() {
  const [consent, setConsent] = useState<ConsentValue>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const savedConsent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!savedConsent) {
      const timer = setTimeout(() => setIsVisible(true), 800);
      return () => clearTimeout(timer);
    }
    setConsent(savedConsent as ConsentValue);
  }, []);

  const handleAcceptAll = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, "all");
    setConsent("all");
    setIsVisible(false);
  };

  const handleEssentialOnly = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, "essential");
    setConsent("essential");
    setIsVisible(false);
  };

  if (!mounted || !isVisible) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 px-3 pb-3 sm:px-4 sm:pb-4">
      <div
        className="pointer-events-auto mx-auto max-w-5xl rounded-3xl border border-border/70 bg-card/95 p-3.5 text-card-foreground shadow-2xl backdrop-blur-xl sm:p-5"
        role="dialog"
        aria-labelledby="cookie-title"
        aria-describedby="cookie-desc"
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-amber-500/15 sm:h-10 sm:w-10">
                <Cookie className="h-4 w-4 text-amber-500" />
              </div>
              <div className="min-w-0">
                <h2 id="cookie-title" className="text-base font-semibold sm:text-lg">
                  Използваме бисквитки
                </h2>
                <p
                  id="cookie-desc"
                  className="mt-1 max-w-3xl text-sm leading-5 text-muted-foreground sm:leading-6"
                >
                  Използваме необходими бисквитки за вход и сигурност, а с ваше
                  съгласие и допълнителни за по-добро изживяване.{" "}
                  <Link
                    href="/cookies"
                    className="font-medium text-primary hover:underline underline-offset-4"
                  >
                    Научете повече
                  </Link>
                </p>
              </div>
            </div>
            <p className="mt-2 hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex">
              <Shield className="h-3 w-3 shrink-0 text-primary" />
              GDPR съвместимост и контрол върху избора ви.
            </p>
          </div>

          <div className="flex flex-row flex-wrap gap-2 lg:shrink-0">
            <Button
              variant="outline"
              onClick={handleEssentialOnly}
              className="h-11 flex-1 rounded-full border-border px-4 text-sm"
            >
              Само необходими
            </Button>
            <Button
              onClick={handleAcceptAll}
              className="h-11 flex-1 rounded-full px-4 text-sm gradient-primary hover:opacity-90"
            >
              <Shield className="mr-2 h-4 w-4" />
              Приемам всички
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function useCookieConsent() {
  const [consent, setConsent] = useState<ConsentValue>(null);

  useEffect(() => {
    const savedConsent = localStorage.getItem(COOKIE_CONSENT_KEY);
    setConsent(savedConsent as ConsentValue);
  }, []);

  return {
    consent,
    hasConsent: consent !== null,
    hasAllConsent: consent === "all",
    hasEssentialOnly: consent === "essential",
  };
}

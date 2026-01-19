"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Cookie, X, Shield } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const COOKIE_CONSENT_KEY = "cookie-consent";

type ConsentValue = "all" | "essential" | null;

export function CookieConsent() {
  const [consent, setConsent] = useState<ConsentValue>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has already made a choice
    const savedConsent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!savedConsent) {
      // Show banner after a short delay for better UX
      const timer = setTimeout(() => setIsVisible(true), 1000);
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

  const handleClose = () => {
    // Closing without choice = essential only (GDPR compliant default)
    handleEssentialOnly();
  };

  if (!isVisible) return null;

  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 p-4 transition-transform duration-500",
        isVisible ? "translate-y-0" : "translate-y-full"
      )}
    >
      <div className="mx-auto max-w-4xl">
        <div className="relative rounded-2xl border bg-card/95 backdrop-blur-sm shadow-2xl p-6">
          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute right-4 top-4 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Затвори"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="flex flex-col sm:flex-row gap-6 items-start">
            {/* Icon */}
            <div className="hidden sm:flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-amber-500/10">
              <Cookie className="h-7 w-7 text-amber-500" />
            </div>

            {/* Content */}
            <div className="flex-1 pr-8 sm:pr-0">
              <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                <Cookie className="h-5 w-5 text-amber-500 sm:hidden" />
                Използваме бисквитки
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Използваме бисквитки за подобряване на вашето изживяване, анализиране на трафика 
                и персонализиране на съдържанието. Можете да приемете всички бисквитки или само 
                необходимите за работата на сайта.{" "}
                <Link 
                  href="/cookies" 
                  className="text-primary hover:underline font-medium"
                >
                  Научете повече
                </Link>
              </p>

              {/* Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={handleAcceptAll}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white"
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Приемам всички
                </Button>
                <Button
                  variant="outline"
                  onClick={handleEssentialOnly}
                >
                  Само необходими
                </Button>
                <Link href="/cookies" className="hidden sm:block">
                  <Button variant="ghost" className="text-muted-foreground">
                    Настройки
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* GDPR Badge */}
          <div className="mt-4 pt-4 border-t flex items-center gap-2 text-xs text-muted-foreground">
            <Shield className="h-3.5 w-3.5 text-emerald-500" />
            <span>GDPR съвместим • Вашите данни са защитени</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Hook to check cookie consent status
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

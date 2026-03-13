"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Cookie, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

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
    <Dialog open={isVisible} onOpenChange={(open) => !open && handleEssentialOnly()}>
      <DialogContent
        className="max-w-[calc(100%-1rem)] rounded-[2rem] border-border bg-card px-5 py-6 text-card-foreground shadow-2xl sm:max-w-lg sm:px-6"
        aria-labelledby="cookie-title"
        aria-describedby="cookie-desc"
      >
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-500/20 sm:h-10 sm:w-10 sm:rounded-xl">
              <Cookie className="h-5 w-5 text-amber-500" />
            </div>
            <DialogTitle id="cookie-title" className="text-left text-xl sm:text-lg">
              Използваме бисквитки
            </DialogTitle>
          </div>
          <DialogDescription id="cookie-desc" className="pt-1 text-left text-base leading-8 text-muted-foreground sm:text-sm sm:leading-7">
            Използваме бисквитки за подобряване на изживяването ви. Можете да приемете всички или само необходимите.{" "}
            <Link
              href="/cookies"
              className="text-primary font-medium hover:underline underline-offset-4"
            >
              Научете повече
            </Link>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-2 flex flex-col items-center gap-3 sm:items-stretch sm:gap-2">
          <Button
            variant="outline"
            onClick={handleEssentialOnly}
            className="h-12 w-full max-w-76 rounded-full border-border text-base sm:h-10 sm:w-auto sm:max-w-none sm:text-sm"
          >
            Само необходими
          </Button>
          <Link href="/cookies" className="flex w-full justify-center">
            <Button variant="ghost" className="h-10 text-base text-muted-foreground sm:text-sm">
              Настройки
            </Button>
          </Link>
          <Button
            onClick={handleAcceptAll}
            className="h-12 w-full max-w-[20rem] rounded-full text-base gradient-primary hover:opacity-90 sm:h-10 sm:w-auto sm:max-w-none sm:text-sm"
          >
            <Shield className="h-4 w-4 mr-2" />
            Приемам всички
          </Button>
        </DialogFooter>
        <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
          <Shield className="h-3 w-3 text-primary shrink-0" />
          GDPR съвместим • Вашите данни са защитени
        </p>
      </DialogContent>
    </Dialog>
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

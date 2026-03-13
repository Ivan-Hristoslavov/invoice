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
        className="bg-card border-border text-card-foreground shadow-2xl max-w-lg"
        aria-labelledby="cookie-title"
        aria-describedby="cookie-desc"
      >
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/20">
              <Cookie className="h-5 w-5 text-amber-500" />
            </div>
            <DialogTitle id="cookie-title" className="text-lg">
              Използваме бисквитки
            </DialogTitle>
          </div>
          <DialogDescription id="cookie-desc" className="text-left text-muted-foreground">
            Използваме бисквитки за подобряване на изживяването ви. Можете да приемете всички или само необходимите.{" "}
            <Link
              href="/cookies"
              className="text-primary font-medium hover:underline underline-offset-4"
            >
              Научете повече
            </Link>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            variant="outline"
            onClick={handleEssentialOnly}
            className="border-border"
          >
            Само необходими
          </Button>
          <Link href="/cookies">
            <Button variant="ghost" className="text-muted-foreground">
              Настройки
            </Button>
          </Link>
          <Button
            onClick={handleAcceptAll}
            className="gradient-primary hover:opacity-90"
          >
            <Shield className="h-4 w-4 mr-2" />
            Приемам всички
          </Button>
        </DialogFooter>
        <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-2">
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

"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Cookie, X, Shield } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

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

  const handleClose = () => {
    handleEssentialOnly();
  };

  if (!isVisible || !mounted || typeof document === "undefined") return null;

  const modal = (
    <div
      className="fixed bottom-0 left-0 right-0 z-[9999] animate-in slide-in-from-bottom duration-300"
      role="dialog"
      aria-modal="false"
      aria-labelledby="cookie-title"
      aria-describedby="cookie-desc"
    >
      <div className="border-t-2 border-zinc-700 bg-zinc-900/95 backdrop-blur-md text-zinc-100 shadow-2xl shadow-black/50 px-4 py-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            {/* Icon + Text */}
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 mt-0.5">
                <Cookie className="h-5 w-5 text-amber-500" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 id="cookie-title" className="text-sm font-semibold text-zinc-100 mb-0.5">
                  Използваме бисквитки
                </h3>
                <p id="cookie-desc" className="text-xs text-zinc-400 leading-relaxed">
                  Използваме бисквитки за подобряване на изживяването ви. Можете да приемете всички или само необходимите.{" "}
                  <Link
                    href="/cookies"
                    className="text-cyan-400 hover:text-cyan-300 hover:underline font-medium"
                  >
                    Научете повече
                  </Link>
                </p>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap shrink-0">
              <Button
                onClick={handleAcceptAll}
                className="h-9 px-4 text-sm rounded-lg font-medium bg-emerald-500 hover:bg-emerald-600 text-white border-0 shadow-sm transition-colors"
              >
                <Shield className="h-3.5 w-3.5 mr-1.5 shrink-0" />
                Приемам всички
              </Button>
              <Button
                variant="outline"
                onClick={handleEssentialOnly}
                className="h-9 px-4 text-sm rounded-lg font-medium border border-zinc-600 bg-zinc-800/50 hover:bg-zinc-700 text-zinc-100 transition-colors"
              >
                Само необходими
              </Button>
              <Link href="/cookies">
                <Button
                  variant="ghost"
                  className="h-9 px-3 text-sm rounded-lg font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700 transition-colors"
                >
                  Настройки
                </Button>
              </Link>
              <button
                onClick={handleClose}
                className="h-9 w-9 flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700/50 transition-colors"
                aria-label="Затвори (само необходими бисквитки)"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="mt-2 flex items-center gap-1.5 text-xs text-zinc-600">
            <Shield className="h-3 w-3 text-emerald-600 shrink-0" />
            <span>GDPR съвместим • Вашите данни са защитени</span>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
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

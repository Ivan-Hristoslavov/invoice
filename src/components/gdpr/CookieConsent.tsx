"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { Cookie, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

const COOKIE_CONSENT_KEY = "cookie-consent";
const COOKIE_CONSENT_EVENT = "cookie-consent-change";

type ConsentValue = "all" | "essential" | null;

function readCookieConsent(): ConsentValue {
  if (typeof window === "undefined") return null;

  const savedConsent = localStorage.getItem(COOKIE_CONSENT_KEY);
  return savedConsent === "all" || savedConsent === "essential"
    ? savedConsent
    : null;
}

function saveCookieConsent(value: Exclude<ConsentValue, null>) {
  localStorage.setItem(COOKIE_CONSENT_KEY, value);
  window.dispatchEvent(new Event(COOKIE_CONSENT_EVENT));
}

export function CookieConsent() {
  const [consent, setConsent] = useState<ConsentValue>(null);
  const [hasCheckedConsent, setHasCheckedConsent] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const essentialButtonRef = useRef<HTMLButtonElement>(null);

  useLayoutEffect(() => {
    const savedConsent = readCookieConsent();
    setHasCheckedConsent(true);

    if (!savedConsent) {
      setConsent(null);
      return;
    }

    setConsent(savedConsent);
  }, []);

  useEffect(() => {
    if (!hasCheckedConsent || consent !== null) return;

    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    const appShell = document.getElementById("app-shell");
    const hadAriaHidden = appShell?.getAttribute("aria-hidden") ?? null;
    const hadInert = appShell?.hasAttribute("inert");

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    appShell?.setAttribute("inert", "");
    appShell?.setAttribute("aria-hidden", "true");

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
      if (!appShell) return;

      if (!hadInert) appShell.removeAttribute("inert");
      if (hadAriaHidden === null) appShell.removeAttribute("aria-hidden");
      else appShell.setAttribute("aria-hidden", hadAriaHidden);
    };
  }, [consent, hasCheckedConsent]);

  useEffect(() => {
    if (!hasCheckedConsent || consent !== null) return;

    essentialButtonRef.current?.focus({ preventScroll: true });
  }, [consent, hasCheckedConsent]);

  function handleDialogKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "Tab") return;

    const dialog = dialogRef.current;
    if (!dialog) return;

    const focusableElements = Array.from(
      dialog.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
      )
    );

    if (focusableElements.length === 0) {
      event.preventDefault();
      return;
    }

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    const activeElement = document.activeElement;

    if (event.shiftKey && activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
      return;
    }

    if (!event.shiftKey && activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  }

  const handleAcceptAll = () => {
    saveCookieConsent("all");
    setConsent("all");
  };

  const handleEssentialOnly = () => {
    saveCookieConsent("essential");
    setConsent("essential");
  };

  if (!hasCheckedConsent || consent !== null) return null;

  return (
    <div className="fixed inset-0 z-100 bg-black/75">
      <div className="flex min-h-dvh items-center justify-center p-4">
        <div
          ref={dialogRef}
          className="relative z-101 w-full max-w-xl rounded-3xl border border-slate-700 bg-slate-950 px-5 py-6 text-slate-50 shadow-2xl ring-1 ring-white/10 sm:px-7 sm:py-7"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cookie-title"
          aria-describedby="cookie-desc"
          onKeyDown={handleDialogKeyDown}
        >
          <div className="flex flex-col gap-5">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-500/15 ring-1 ring-amber-400/10">
                <Cookie className="h-5 w-5 text-amber-400" />
              </div>
              <div className="min-w-0">
                <h2 id="cookie-title" className="text-lg font-semibold tracking-tight text-white sm:text-xl">
                  Използваме бисквитки
                </h2>
                <p
                  id="cookie-desc"
                  className="mt-2.5 max-w-136 text-sm leading-7 text-slate-300 sm:text-base"
                >
                  Използваме необходими бисквитки за вход и сигурност, а с ваше
                  съгласие и допълнителни за по-добро изживяване.{" "}
                  <Link
                    href="/cookies"
                    className="font-medium text-cyan-400 hover:underline underline-offset-4"
                  >
                    Научете повече
                  </Link>
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 px-4 py-3.5">
              <p className="flex items-center gap-2.5 text-xs leading-5 text-slate-300 sm:text-sm">
                <Shield className="h-4 w-4 shrink-0 text-cyan-400" />
                Докато не изберете, достъпът до сайта остава ограничен.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button
                ref={essentialButtonRef}
                variant="outline"
                onClick={handleEssentialOnly}
                className="h-12 min-w-0 rounded-full border-slate-700 bg-slate-950 px-4 text-sm font-medium text-white hover:bg-slate-900"
              >
                Само необходими
              </Button>
              <Button
                onClick={handleAcceptAll}
                className="h-12 min-w-0 rounded-full px-4 text-sm font-medium text-white gradient-primary hover:opacity-90"
              >
                <Shield className="mr-2 h-4 w-4" />
                Приемам всички
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function useCookieConsent() {
  const [consent, setConsent] = useState<ConsentValue>(null);

  useEffect(() => {
    const updateConsent = () => {
      setConsent(readCookieConsent());
    };

    updateConsent();
    window.addEventListener("storage", updateConsent);
    window.addEventListener(COOKIE_CONSENT_EVENT, updateConsent);

    return () => {
      window.removeEventListener("storage", updateConsent);
      window.removeEventListener(COOKIE_CONSENT_EVENT, updateConsent);
    };
  }, []);

  return {
    consent,
    hasConsent: consent !== null,
    hasAllConsent: consent === "all",
    hasEssentialOnly: consent === "essential",
  };
}

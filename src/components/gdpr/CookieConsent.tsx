"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { Cookie, Shield } from "lucide-react";
import { Button } from "@heroui/react";
import { cn } from "@/lib/utils";

const COOKIE_CONSENT_KEY = "cookie-consent";
const COOKIE_CONSENT_EVENT = "cookie-consent-change";

type ConsentValue = "all" | "essential" | null;

function readCookieConsent(): ConsentValue {
  if (typeof window === "undefined") return null;

  try {
    const savedConsent = localStorage.getItem(COOKIE_CONSENT_KEY);
    return savedConsent === "all" || savedConsent === "essential"
      ? savedConsent
      : null;
  } catch {
    return null;
  }
}

function saveCookieConsent(value: Exclude<ConsentValue, null>) {
  try {
    localStorage.setItem(COOKIE_CONSENT_KEY, value);
  } catch {
    // Ignore storage failures and still close the modal for this session.
  }

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

  /** If consent is already stored or user just chose, never leave `#app-shell` stuck `inert` from a missed effect cleanup. */
  useLayoutEffect(() => {
    if (!hasCheckedConsent || consent === null) return;
    const appShell = document.getElementById("app-shell");
    if (!appShell) return;
    appShell.removeAttribute("inert");
    appShell.removeAttribute("aria-hidden");
  }, [consent, hasCheckedConsent]);

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
    <div
      className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-[2px] dark:bg-black/75"
      role="presentation"
    >
      <div className="flex min-h-dvh w-full items-end justify-center p-0 sm:items-center sm:p-4">
        <div
          ref={dialogRef}
          className={cn(
            "w-full max-w-xl rounded-t-2xl border border-border bg-background px-4 py-5 text-foreground shadow-2xl",
            "sm:rounded-2xl sm:px-6 sm:py-6"
          )}
          role="dialog"
          aria-modal="true"
          aria-labelledby="cookie-title"
          aria-describedby="cookie-desc"
          onKeyDown={handleDialogKeyDown}
        >
          <div className="flex flex-col gap-4">
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted">
                <Cookie className="h-5 w-5 text-muted-foreground" aria-hidden />
              </div>
              <div className="min-w-0">
                <h2
                  id="cookie-title"
                  className="text-base font-semibold tracking-tight sm:text-lg"
                >
                  Използваме бисквитки
                </h2>
                <p
                  id="cookie-desc"
                  className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-[15px]"
                >
                  Използваме необходими бисквитки за вход и сигурност, а с ваше съгласие и
                  допълнителни за по-добро изживяване.{" "}
                  <Link
                    href="/cookies"
                    className="font-medium text-primary underline-offset-4 hover:underline"
                  >
                    Научете повече
                  </Link>
                </p>
              </div>
            </div>

            <p className="flex items-start gap-2 text-xs leading-snug text-muted-foreground sm:text-sm">
              <Shield className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
              <span>Докато не изберете, достъпът до сайта остава ограничен.</span>
            </p>

            <div className="flex w-full flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:items-stretch sm:gap-3">
              <Button
                ref={essentialButtonRef}
                variant="outline"
                size="md"
                className="h-11 w-full min-h-11 flex-1 rounded-xl font-medium sm:h-10 sm:min-h-10"
                onPress={handleEssentialOnly}
              >
                Само необходими
              </Button>
              <Button
                variant="primary"
                size="md"
                className="h-11 w-full min-h-11 flex-1 rounded-xl font-medium sm:h-10 sm:min-h-10"
                onPress={handleAcceptAll}
              >
                <span className="inline-flex items-center justify-center gap-2">
                  <Shield className="h-4 w-4 shrink-0" aria-hidden />
                  Приемам всички
                </span>
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

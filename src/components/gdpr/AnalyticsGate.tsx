"use client";

import { Analytics } from "@vercel/analytics/next";
import { useCookieConsent } from "@/components/gdpr/CookieConsent";

/**
 * Renders Vercel Analytics only when the user has given full cookie consent.
 * Prevents non-essential analytics from loading before an opt-in choice,
 * matching GDPR/ePrivacy opt-in requirements.
 */
export function AnalyticsGate() {
  const { hasAllConsent } = useCookieConsent();
  if (!hasAllConsent) return null;
  return <Analytics />;
}

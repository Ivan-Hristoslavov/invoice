import { getAppBaseUrl } from "@/lib/app-url";

/**
 * Allowed redirect base URL for payment/subscription flows.
 * Only our app origin is allowed to prevent open redirect / phishing.
 */
function getAppOrigin(): string {
  const url = getAppBaseUrl();
  try {
    const parsed = new URL(url);
    return `${parsed.protocol}//${parsed.host}`;
  } catch {
    return "http://localhost:3000";
  }
}

/**
 * Returns the safe redirect base URL for payment flows.
 * Ignores client-supplied returnUrl and always uses app origin to prevent open redirect / phishing.
 */
export function validateRedirectUrl(_candidate?: string | null): string {
  return getAppOrigin();
}

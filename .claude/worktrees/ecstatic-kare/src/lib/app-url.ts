/**
 * Base URL for the app (emails, redirects, links).
 * Vercel does not interpolate env vars inside other env vars, so
 * NEXT_PUBLIC_APP_URL=https://${VERCEL_URL} stays literal. We treat
 * any value containing "${" as invalid and fall back to VERCEL_URL.
 */
function isTemplateOrInvalid(url: string | undefined): boolean {
  if (!url || typeof url !== "string") return true;
  const trimmed = url.trim();
  if (trimmed.length === 0) return true;
  if (trimmed.includes("${")) return true; // unresolved template
  try {
    new URL(trimmed);
    return false;
  } catch {
    return true;
  }
}

export function getAppBaseUrl(): string {
  const fromAuth = process.env.NEXTAUTH_URL;
  const fromPublic = process.env.NEXT_PUBLIC_APP_URL;
  const vercelUrl = process.env.VERCEL_URL;

  if (!isTemplateOrInvalid(fromAuth)) return fromAuth!.trim();
  if (!isTemplateOrInvalid(fromPublic)) return fromPublic!.trim();
  if (vercelUrl) return `https://${vercelUrl}`;

  return "http://localhost:3000";
}

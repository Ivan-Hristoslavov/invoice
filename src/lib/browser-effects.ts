export function shouldReduceBrowserEffects() {
  if (typeof window === "undefined") return false;

  const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const userAgent = window.navigator.userAgent.toLowerCase();
  const isSafari =
    /safari/.test(userAgent) &&
    !/chrome|android|crios|fxios|edgios/.test(userAgent);
  const isSmallScreen = window.innerWidth < 768;

  return mediaQuery.matches || isSafari || isSmallScreen;
}

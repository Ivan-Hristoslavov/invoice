"use client";

/**
 * HeroUI v3 (@heroui/react) не експортира root `HeroUIProvider` като в NextUI v2.
 * Компонентите работят без обвиващ доставчик; навигация за линкове се ползва от Next.js директно.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

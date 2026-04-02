"use client";

import * as React from "react";

const VT_PATCH_KEY = "__invoiceAppViewTransitionFinishedPatch";

/**
 * HeroUI Toast (`@heroui/react` toast-queue) обвива updates в `document.startViewTransition`.
 * При припокриващи се преходи `transition.finished` отхвърля с InvalidStateError и остава
 * unhandled rejection — прихващаме го веднъж за цялото приложение.
 */
function useViewTransitionFinishedRejectionPatch() {
  React.useEffect(() => {
    if (typeof document === "undefined") return;
    if (!("startViewTransition" in document)) return;

    const doc = document;
    const original = doc.startViewTransition?.bind(doc);
    if (!original) return;

    if ((doc as unknown as Record<string, boolean>)[VT_PATCH_KEY]) return;
    (doc as unknown as Record<string, boolean>)[VT_PATCH_KEY] = true;

    doc.startViewTransition = function (callback?: UpdateCallback) {
      try {
        const transition = original(callback);
        void transition.finished.catch(() => {});
        return transition;
      } catch {
        if (callback) callback();
        return {
          finished: Promise.resolve(),
          ready: Promise.resolve(),
          skipTransition: () => {},
        } as ViewTransition;
      }
    };
  }, []);
}

/**
 * HeroUI v3 (@heroui/react) не експортира root `HeroUIProvider` като в NextUI v2.
 * Компонентите работят без обвиващ доставчик; навигация за линкове се ползва от Next.js директно.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  useViewTransitionFinishedRejectionPatch();
  return <>{children}</>;
}

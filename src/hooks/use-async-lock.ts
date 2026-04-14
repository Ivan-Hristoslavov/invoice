"use client";

import { useCallback, useRef, useState } from "react";

/**
 * Single-flight async guard: ignores overlapping calls until the current promise settles.
 * Use `isPending` for `disabled` / `loading` on buttons that trigger the wrapped work.
 */
export function useAsyncLock() {
  const pendingRef = useRef(false);
  const [isPending, setIsPending] = useState(false);

  const run = useCallback(async <T,>(fn: () => Promise<T>): Promise<T | undefined> => {
    if (pendingRef.current) return undefined;
    pendingRef.current = true;
    setIsPending(true);
    try {
      return await fn();
    } finally {
      pendingRef.current = false;
      setIsPending(false);
    }
  }, []);

  return { run, isPending };
}

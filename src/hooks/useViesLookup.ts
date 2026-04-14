"use client";

import { useState, useCallback } from "react";
import type { ViesFormAutofill, ViesPersistencePayload, ViesValidateResult } from "@/lib/vies";

interface UseViesLookupOptions {
  onSuccess?: (result: {
    formFields: ViesFormAutofill;
    persistence: ViesPersistencePayload;
    valid: boolean;
  }) => void;
  onError?: (message: string) => void;
}

export function useViesLookup({ onSuccess, onError }: UseViesLookupOptions = {}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lookup = useCallback(
    async (vatInput: string) => {
      const trimmed = vatInput.trim();
      if (trimmed.length < 4) {
        const msg = "Въведете пълен ДДС номер с префикс на държавата";
        setError(msg);
        onError?.(msg);
        return null;
      }

      setIsLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/vies/validate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ vatInput: trimmed }),
        });
        const raw = await res.text();
        let payload: unknown;
        try {
          payload = raw ? JSON.parse(raw) : null;
        } catch {
          const msg = "Неочакван отговор от сървъра";
          setError(msg);
          onError?.(msg);
          return null;
        }

        if (!res.ok) {
          const errObj =
            payload && typeof payload === "object" && payload !== null && "error" in payload
              ? (payload as { error?: unknown }).error
              : undefined;
          const msg =
            typeof errObj === "string" && errObj.trim() ? errObj : "Грешка при проверка в VIES";
          setError(msg);
          onError?.(msg);
          return null;
        }

        const data = payload as ViesValidateResult;
        onSuccess?.({
          formFields: data.formFields,
          persistence: data.persistence,
          valid: data.valid,
        });
        return data;
      } catch {
        const msg = "Неуспешна връзка със сървъра";
        setError(msg);
        onError?.(msg);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [onSuccess, onError]
  );

  return { lookup, isLoading, error };
}

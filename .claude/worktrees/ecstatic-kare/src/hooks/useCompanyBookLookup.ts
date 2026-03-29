"use client";

import { useState, useCallback } from "react";
import { mapCompanyBookToFormFields, type CompanyBookResponse } from "@/lib/companybook";

interface UseCompanyBookLookupOptions {
  onSuccess?: (fields: ReturnType<typeof mapCompanyBookToFormFields>) => void;
  onError?: (message: string) => void;
}

export function useCompanyBookLookup({ onSuccess, onError }: UseCompanyBookLookupOptions = {}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lookup = useCallback(async (uic: string) => {
    const cleaned = uic.replace(/\D/g, "");
    if (!cleaned || cleaned.length < 9 || cleaned.length > 13) {
      const msg = "Въведете валиден ЕИК/БУЛСТАТ (9-13 цифри)";
      setError(msg);
      onError?.(msg);
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/companybook/${cleaned}`);
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
          typeof errObj === "string" && errObj.trim() ? errObj : "Грешка при търсене";
        setError(msg);
        onError?.(msg);
        return null;
      }

      const fields = mapCompanyBookToFormFields(payload as CompanyBookResponse);
      onSuccess?.(fields);
      return fields;
    } catch {
      const msg = "Неуспешна връзка с API";
      setError(msg);
      onError?.(msg);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [onSuccess, onError]);

  return { lookup, isLoading, error };
}

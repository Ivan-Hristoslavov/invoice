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
      const data = await res.json();

      if (!res.ok) {
        const msg = data.error || "Грешка при търсене";
        setError(msg);
        onError?.(msg);
        return null;
      }

      const fields = mapCompanyBookToFormFields(data as CompanyBookResponse);
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

"use client";

import { useCallback, useState } from "react";
import type {
  CompanyBookCompaniesSearchResponse,
  CompanyBookPeopleSearchResponse,
  CompanyBookSharedSearchResponse,
} from "@/lib/companybook";

interface UseCompanyBookSearchOptions {
  onError?: (message: string) => void;
}

type SearchScope = "companies" | "people" | "shared";

export function useCompanyBookSearch(
  options: UseCompanyBookSearchOptions = {}
) {
  const { onError } = options;
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function search(scope: "companies", name: string, limit?: number): Promise<CompanyBookCompaniesSearchResponse | null>;
  async function search(scope: "people", name: string, limit?: number): Promise<CompanyBookPeopleSearchResponse | null>;
  async function search(scope: "shared", name: string, limit?: number): Promise<CompanyBookSharedSearchResponse | null>;
  async function search(
    scope: SearchScope,
    name: string,
    limit = 5
  ): Promise<
    | CompanyBookCompaniesSearchResponse
    | CompanyBookPeopleSearchResponse
    | CompanyBookSharedSearchResponse
    | null
  > {
      const normalizedName = name.trim();
      if (normalizedName.length < 3) {
        const msg = "Въведете поне 3 символа за търсене.";
        setError(msg);
        onError?.(msg);
        return null;
      }

      setIsSearching(true);
      setError(null);

      try {
        const endpoint =
          scope === "companies"
            ? "/api/companybook/companies/search"
            : scope === "people"
              ? "/api/companybook/people/search"
              : "/api/companybook/shared/search";

        const params = new URLSearchParams({
          name: normalizedName,
          limit: String(limit),
        });

        const response = await fetch(`${endpoint}?${params.toString()}`, {
          cache: "no-store",
        });
        const payload = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;

        if (!response.ok) {
          const msg = payload?.error || "Грешка при търсене в регистъра.";
          setError(msg);
          onError?.(msg);
          return null;
        }

        return payload as
          | CompanyBookCompaniesSearchResponse
          | CompanyBookPeopleSearchResponse
          | CompanyBookSharedSearchResponse;
      } catch {
        const msg = "Неуспешна връзка с CompanyBook API.";
        setError(msg);
        onError?.(msg);
        return null;
      } finally {
        setIsSearching(false);
      }
  }

  const stableSearch = useCallback(search, [onError]);

  return { search: stableSearch as typeof search, isSearching, error };
}

"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useWatch, type Control, type FieldValues, type Path, type UseFormGetValues, type UseFormSetValue } from "react-hook-form";
import { Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useCompanyBookLookup } from "@/hooks/useCompanyBookLookup";
import { useCompanyBookSearch } from "@/hooks/useCompanyBookSearch";
import type { CompanyBookFormFields } from "@/lib/companybook";
import { applyCompanyBookToForm } from "@/lib/companybook-form-apply";
import { ProFeatureLock } from "@/components/ui/pro-feature-lock";
import { useSubscription } from "@/hooks/useSubscription";
import { toast } from "@/lib/toast";

interface CompanyBookLookupPanelProps<T extends FieldValues> {
  control: Control<T>;
  getValues: UseFormGetValues<T>;
  setValue: UseFormSetValue<T>;
  bulstatField?: Path<T>;
  currentPlan: string | null;
  canUseCompanyBook: boolean;
  /** Called after a successful merge so parent can set lookupResult / UI state */
  onApplied?: (fields: CompanyBookFormFields) => void;
  showSearchByName?: boolean;
}

const PREVIEW_FIELDS = [
  { key: "name" as const, label: "Име" },
  { key: "address" as const, label: "Адрес" },
  { key: "city" as const, label: "Град" },
  { key: "country" as const, label: "Държава" },
] as const;

export function CompanyBookLookupPanel<T extends FieldValues>({
  control,
  getValues,
  setValue,
  bulstatField = "bulstatNumber" as Path<T>,
  currentPlan,
  canUseCompanyBook,
  onApplied,
  showSearchByName = true,
}: CompanyBookLookupPanelProps<T>) {
  const { createCheckoutSession } = useSubscription();
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const watchedBulstat = useWatch({ control, name: bulstatField });
  const [localEik, setLocalEik] = useState(() =>
    trimStr(getValues(bulstatField)).replace(/\D/g, "")
  );
  const [overwriteDialogOpen, setOverwriteDialogOpen] = useState(false);
  const [searchScope, setSearchScope] = useState<"companies" | "people" | "shared">("companies");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResult, setSearchResult] = useState<{
    companies: Array<{ uic: string; name: string }>;
    people: Array<{ id: string; name: string; indent: string }>;
  } | null>(null);
  const [overwritePreview, setOverwritePreview] = useState<{
    previous: Record<(typeof PREVIEW_FIELDS)[number]["key"], string>;
    fields: CompanyBookFormFields;
  } | null>(null);
  const pendingRef = useRef<CompanyBookFormFields | null>(null);

  useEffect(() => {
    const next = typeof watchedBulstat === "string" ? watchedBulstat.replace(/\D/g, "") : "";
    if (next) setLocalEik(next);
  }, [watchedBulstat]);

  const flushPending = useCallback(
    (overwriteIdentityFields: boolean) => {
      const pending = pendingRef.current;
      if (!pending) return;
      pendingRef.current = null;
      applyCompanyBookToForm(getValues, setValue, pending, { overwriteIdentityFields });
      onApplied?.(pending);
      toast.success("Данни от Търговския регистър", {
        description: overwriteIdentityFields
          ? "Полетата са обновени според регистъра."
          : "Запазени са вашите име/адрес/град; останалото е допълнено от регистъра.",
      });
    },
    [getValues, setValue, onApplied]
  );

  const handleSuccess = useCallback(
    (fields: CompanyBookFormFields) => {
      const hasConflict = Boolean(
        trimStr(getValues("name" as Path<T>)) ||
          trimStr(getValues("address" as Path<T>)) ||
          trimStr(getValues("city" as Path<T>))
      );
      if (!hasConflict) {
        applyCompanyBookToForm(getValues, setValue, fields, { overwriteIdentityFields: true });
        onApplied?.(fields);
        toast.success("Данни от Търговския регистър", {
          description: "Полетата са попълнени от регистъра.",
        });
        return;
      }
      pendingRef.current = fields;
      setOverwritePreview({
        previous: {
          name: trimStr(getValues("name" as Path<T>)),
          address: trimStr(getValues("address" as Path<T>)),
          city: trimStr(getValues("city" as Path<T>)),
          country: trimStr(getValues("country" as Path<T>)),
        },
        fields,
      });
      setOverwriteDialogOpen(true);
    },
    [getValues, setValue, onApplied]
  );

  const { lookup, isLoading, error } = useCompanyBookLookup({
    onSuccess: handleSuccess,
    onError: (msg) => toast.error("Търсене в регистъра", { description: msg }),
  });
  const {
    search,
    isSearching,
    error: searchError,
  } = useCompanyBookSearch({
    onError: (msg) => toast.error("Търсене в регистъра", { description: msg }),
  });

  const runLookup = useCallback(async () => {
    const eik = localEik.replace(/\D/g, "") || trimStr(getValues(bulstatField)).replace(/\D/g, "");
    if (!eik || eik.length < 9) {
      toast.error("Въведете ЕИК", {
        description: "Поне 9 цифри за заявка към Търговския регистър.",
      });
      return;
    }
    await lookup(eik);
  }, [lookup, localEik, getValues, bulstatField]);

  const runSearch = useCallback(async () => {
    if (searchScope === "companies") {
      const payload = await search("companies", searchQuery, 5);
      if (!payload) {
        setSearchResult(null);
        return;
      }
      setSearchResult({
        companies: payload.results.map((item) => ({ uic: item.uic, name: item.name })),
        people: [],
      });
      return;
    }

    if (searchScope === "people") {
      const payload = await search("people", searchQuery, 5);
      if (!payload) {
        setSearchResult(null);
        return;
      }
      setSearchResult({
        companies: [],
        people: payload.results.map((item) => ({
          id: item.id,
          name: item.name,
          indent: item.indent,
        })),
      });
      return;
    }

    const payload = await search("shared", searchQuery, 5);
    if (!payload) {
      setSearchResult(null);
      return;
    }

    setSearchResult({
      companies: payload.companies.map((item) => ({ uic: item.uic, name: item.name })),
      people: payload.people.map((item) => ({
        id: item.id,
        name: item.name,
        indent: item.indent,
      })),
    });
  }, [search, searchScope, searchQuery]);

  if (!canUseCompanyBook) {
    return (
      <ProFeatureLock
        requiredPlan="STARTER"
        currentPlan={currentPlan}
        featureName="Търсенето по ЕИК"
        message="Попълване от Търговския регистър (CompanyBook) е налично от план Стартер."
        variant="overlay"
        showUpgradeLink
        isUpgradeLoading={checkoutLoading}
        onUpgradeClick={async () => {
          setCheckoutLoading(true);
          try {
            await createCheckoutSession("STARTER", "yearly");
          } finally {
            setCheckoutLoading(false);
          }
        }}
      >
        <div className="rounded-lg border border-muted bg-muted/30 p-4 text-sm text-muted-foreground">
          Надградете до Стартер за заявка към регистъра по ЕИК.
        </div>
      </ProFeatureLock>
    );
  }

  return (
    <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/6 p-4 dark:bg-emerald-950/20">
      <div className="mb-3 flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
          <Search className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <h3 className="text-sm font-semibold">Търговски регистър (по ЕИК)</h3>
          <p className="text-xs text-muted-foreground">
            Заявката се изпраща само при натискане на бутона. Отговорът на регистъра попълва данните; полетата за ЗДДС и ЕИК
            винаги следват официалния запис.
          </p>
        </div>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          className="h-10 flex-1 font-mono text-sm"
          placeholder="175074752"
          inputMode="numeric"
          value={localEik}
          onChange={(e) => setLocalEik(e.target.value.replace(/\D/g, ""))}
          spellCheck={false}
        />
        <Button
          type="button"
          variant="secondary"
          className="h-10 shrink-0 gap-2"
          disabled={isLoading || localEik.replace(/\D/g, "").length < 9}
          onClick={runLookup}
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          Зареди от регистъра
        </Button>
      </div>
      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
      {showSearchByName && (
        <div className="mt-4 rounded-lg border border-border/70 bg-background/70 p-3">
          <p className="mb-2 text-xs font-semibold text-muted-foreground">
            Търсене по име (фирми/лица)
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <select
              value={searchScope}
              onChange={(e) => setSearchScope(e.target.value as "companies" | "people" | "shared")}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="companies">Фирми</option>
              <option value="people">Лица</option>
              <option value="shared">Общо търсене</option>
            </select>
            <Input
              className="h-10 flex-1"
              placeholder="напр. Алфа Трейд"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Button
              type="button"
              variant="outline"
              className="h-10 gap-2"
              onClick={runSearch}
              disabled={isSearching || searchQuery.trim().length < 3}
            >
              {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              Търси
            </Button>
          </div>
          {searchError && <p className="mt-2 text-xs text-destructive">{searchError}</p>}
          {searchResult && (
            <div className="mt-3 space-y-2">
              {searchResult.companies.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Фирми</p>
                  {searchResult.companies.map((item) => (
                    <div
                      key={`${item.uic}-${item.name}`}
                      className="flex items-center justify-between rounded-md border border-border/60 bg-background px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{item.name}</p>
                        <p className="text-xs text-muted-foreground">ЕИК: {item.uic}</p>
                      </div>
                      <Button
                        type="button"
                        variant="secondary"
                        className="ml-3 h-8"
                        onClick={() => {
                          setLocalEik(item.uic);
                          void lookup(item.uic);
                        }}
                      >
                        Зареди
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              {searchResult.people.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Лица</p>
                  {searchResult.people.map((item) => (
                    <div
                      key={`${item.id}-${item.indent}`}
                      className="rounded-md border border-border/60 bg-background px-3 py-2"
                    >
                      <p className="text-sm font-medium">{item.name}</p>
                      <p className="text-xs text-muted-foreground">ИД: {item.indent}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <AlertDialog
        open={overwriteDialogOpen}
        onOpenChange={(open) => {
          setOverwriteDialogOpen(open);
          if (!open) {
            setOverwritePreview(null);
            if (pendingRef.current) flushPending(false);
          }
        }}
      >
        <AlertDialogContent className="w-[min(94vw,34rem)] max-w-none gap-0 p-0 sm:max-w-none">
          <AlertDialogHeader className="gap-3 px-6 pb-2 pt-6">
            <AlertDialogTitle className="text-xl font-semibold leading-snug sm:text-2xl">
              Презаписване от Търговския регистър
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base leading-relaxed text-muted-foreground">
              Има вече попълнени име, адрес или град. При „Презапиши“ всичко следва регистъра. При „Отказ“ запазвате тези
              полета, но ЕИК/ЗДДС и празните полета се допълват от регистъра.
            </AlertDialogDescription>
            {overwritePreview && hasRegistryPreviewText(overwritePreview.fields) && (
              <div className="max-h-[min(48vh,360px)] overflow-y-auto rounded-xl border border-border/60 bg-muted/30 px-4 py-3">
                <p className="mb-3 text-sm font-semibold text-foreground sm:text-base">
                  Сравнение: ново от регистъра → текущо във формата
                </p>
                <ul className="space-y-4">
                  {PREVIEW_FIELDS.map(({ key, label }) => {
                    const next = trimStr(overwritePreview.fields[key]);
                    const prev = overwritePreview.previous[key];
                    if (!next && !prev) return null;
                    return (
                      <li
                        key={key}
                        className="grid gap-1.5 border-b border-border/50 pb-4 last:border-0 last:pb-0"
                      >
                        <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground sm:text-sm">
                          {label}
                        </span>
                        <span className="text-xs text-muted-foreground sm:text-sm">Ново (регистър)</span>
                        <span className="wrap-break-word font-mono text-sm leading-relaxed text-emerald-700 dark:text-emerald-400 sm:text-base">
                          {next || "—"}
                        </span>
                        <span className="text-xs text-muted-foreground sm:text-sm">Текущо във формата</span>
                        <span className="wrap-break-word font-mono text-sm leading-relaxed text-foreground/85 line-through decoration-destructive/70 sm:text-base">
                          {prev || "—"}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-3 px-6 pb-6 pt-4 sm:gap-3">
            <Button
              type="button"
              variant="outline"
              className="min-h-11 w-full text-base sm:w-auto"
              onClick={() => {
                flushPending(false);
                setOverwritePreview(null);
                setOverwriteDialogOpen(false);
              }}
            >
              Отказ
            </Button>
            <Button
              type="button"
              variant="default"
              className="min-h-11 w-full text-base sm:w-auto"
              onClick={() => {
                flushPending(true);
                setOverwritePreview(null);
                setOverwriteDialogOpen(false);
              }}
            >
              Презапиши
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function trimStr(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function hasRegistryPreviewText(fields: CompanyBookFormFields): boolean {
  return PREVIEW_FIELDS.some(({ key }) => Boolean(trimStr(fields[key])));
}

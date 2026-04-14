"use client";

import { useState, useCallback, useRef } from "react";
import { useWatch, type Control, type FieldValues, type Path, type UseFormGetValues, type UseFormSetValue } from "react-hook-form";
import { Globe, Loader2 } from "lucide-react";
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
import { useViesLookup } from "@/hooks/useViesLookup";
import { applyViesResultToForm, type ViesExtendedFormValues } from "@/lib/vies-form-apply";
import type { ViesFormAutofill, ViesPersistencePayload } from "@/lib/vies";
import { parseEuVatInput } from "@/lib/vies";
import { ProFeatureLock } from "@/components/ui/pro-feature-lock";
import { useSubscription } from "@/hooks/useSubscription";
import { cn } from "@/lib/utils";

interface ViesLookupPanelProps<T extends FieldValues & ViesExtendedFormValues> {
  control: Control<T>;
  getValues: UseFormGetValues<T>;
  setValue: UseFormSetValue<T>;
  /** VAT string field to read initial value from (e.g. vatRegistrationNumber) */
  vatField?: Path<T>;
  currentPlan: string | null;
  canUseVies: boolean;
}

const OVERWRITE_PREVIEW_FIELDS = [
  { key: "name" as const, label: "Име" },
  { key: "address" as const, label: "Адрес" },
  { key: "city" as const, label: "Град" },
  { key: "country" as const, label: "Държава" },
];

export function ViesLookupPanel<T extends FieldValues & ViesExtendedFormValues>({
  control,
  getValues,
  setValue,
  vatField = "vatRegistrationNumber" as Path<T>,
  currentPlan,
  canUseVies,
}: ViesLookupPanelProps<T>) {
  const { createCheckoutSession } = useSubscription();
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [localVat, setLocalVat] = useState(() => trimStr(getValues(vatField)));
  const [overwriteDialogOpen, setOverwriteDialogOpen] = useState(false);
  const [overwritePreview, setOverwritePreview] = useState<{
    previous: Record<(typeof OVERWRITE_PREVIEW_FIELDS)[number]["key"], string>;
    formFields: ViesFormAutofill;
  } | null>(null);
  const pendingViesApplyRef = useRef<{
    formFields: ViesFormAutofill;
    persistence: ViesPersistencePayload;
  } | null>(null);

  const viesLastCheckAt = useWatch({ control, name: "viesLastCheckAt" as Path<T> });
  const viesValid = useWatch({ control, name: "viesValid" as Path<T> });
  const viesCountryCode = useWatch({ control, name: "viesCountryCode" as Path<T> });
  const viesNumberLocal = useWatch({ control, name: "viesNumberLocal" as Path<T> });
  const watchedVat = useWatch({ control, name: vatField });

  const persistedVatKey =
    typeof viesCountryCode === "string" && typeof viesNumberLocal === "string"
      ? vatCanonicalKey(`${viesCountryCode}${viesNumberLocal}`)
      : null;
  const inputVatKey = vatCanonicalKey(trimStr(localVat) || trimStr(watchedVat));
  const viesStatusMatchesInput =
    Boolean(trimStr(viesLastCheckAt)) &&
    persistedVatKey !== null &&
    inputVatKey !== null &&
    persistedVatKey === inputVatKey;

  const viesInputClassName =
    viesStatusMatchesInput && viesValid === true
      ? "border-emerald-500/70 shadow-[0_0_0_1px_hsl(142.1_76.2%_36.3%/0.25)] data-[hovered=true]:border-emerald-500 data-[focus-visible=true]:border-emerald-500 data-[focus-visible=true]:ring-emerald-500/35"
      : viesStatusMatchesInput && viesValid === false
        ? "border-destructive/80 data-[hovered=true]:border-destructive data-[focus-visible=true]:border-destructive data-[focus-visible=true]:ring-destructive/35"
        : undefined;

  const flushPendingViesApply = useCallback(
    (overwriteExisting: boolean) => {
      const pending = pendingViesApplyRef.current;
      if (!pending) return;
      pendingViesApplyRef.current = null;
      applyViesResultToForm(getValues, setValue, pending.formFields, pending.persistence, {
        overwriteExisting,
      });
    },
    [getValues, setValue]
  );

  const handleSuccess = useCallback(
    ({
      formFields,
      persistence,
    }: {
      formFields: ViesFormAutofill;
      persistence: ViesPersistencePayload;
    }) => {
      const hasConflict = Boolean(
        trimStr(getValues("name" as Path<T>)) ||
          trimStr(getValues("address" as Path<T>)) ||
          trimStr(getValues("city" as Path<T>))
      );
      if (!hasConflict) {
        applyViesResultToForm(getValues, setValue, formFields, persistence, { overwriteExisting: true });
        return;
      }
      const previous = {
        name: trimStr(getValues("name" as Path<T>)),
        address: trimStr(getValues("address" as Path<T>)),
        city: trimStr(getValues("city" as Path<T>)),
        country: trimStr(getValues("country" as Path<T>)),
      };
      pendingViesApplyRef.current = { formFields, persistence };
      setOverwritePreview({ previous, formFields });
      setOverwriteDialogOpen(true);
    },
    [getValues, setValue]
  );

  const { lookup, isLoading, error } = useViesLookup({
    onSuccess: handleSuccess,
  });

  const runLookup = useCallback(async () => {
    await lookup(localVat || trimStr(getValues(vatField)));
  }, [lookup, localVat, getValues, vatField]);

  if (!canUseVies) {
    return (
      <ProFeatureLock
        requiredPlan="STARTER"
        currentPlan={currentPlan}
        featureName="Проверка в VIES"
        message="Валидация и автоматично попълване от VIES (ЕС ДДС) е налично от план Стартер, заедно с търсенето по ЕИК."
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
          Надградете до Стартер за проверка в VIES.
        </div>
      </ProFeatureLock>
    );
  }

  return (
    <div className="rounded-lg border border-sky-500/25 bg-sky-500/5 p-4">
      <div className="mb-3 flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sky-500/15 text-sky-700 dark:text-sky-300">
          <Globe className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <h3 className="text-sm font-semibold">Проверка в VIES (ЕС ДДС)</h3>
          <p className="text-xs text-muted-foreground">
            Въведете пълен ДДС номер с префикс (напр. BG831826092). Резултатът е към момента на заявката; при запазване се пази история на проверката.
          </p>
        </div>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          className={cn("h-10 flex-1 font-mono text-sm", viesInputClassName)}
          placeholder="BG123456789"
          value={localVat}
          onChange={(e) => setLocalVat(e.target.value.toUpperCase().replace(/\s/g, ""))}
          spellCheck={false}
          aria-invalid={viesStatusMatchesInput && viesValid === false ? true : undefined}
        />
        <Button
          type="button"
          variant="secondary"
          className="h-10 shrink-0 gap-2"
          disabled={isLoading || localVat.trim().length < 4}
          onClick={runLookup}
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Globe className="h-4 w-4" />}
          Провери VIES
        </Button>
      </div>
      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}

      <AlertDialog
        open={overwriteDialogOpen}
        onOpenChange={(open) => {
          setOverwriteDialogOpen(open);
          if (!open) {
            setOverwritePreview(null);
            if (pendingViesApplyRef.current) flushPendingViesApply(false);
          }
        }}
      >
        <AlertDialogContent className="w-[min(94vw,34rem)] max-w-none gap-0 p-0 sm:max-w-none">
          <AlertDialogHeader className="gap-3 px-6 pb-2 pt-6">
            <AlertDialogTitle className="text-xl font-semibold leading-snug sm:text-2xl">
              Презаписване на данни от VIES
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base leading-relaxed text-muted-foreground">
              Има вече попълнени данни. Да се презапишат ли с информацията от VIES?
            </AlertDialogDescription>
            {overwritePreview && hasAnyViesPreviewText(overwritePreview.formFields) && (
              <div className="max-h-[min(48vh,360px)] overflow-y-auto rounded-xl border border-border/60 bg-muted/30 px-4 py-3">
                <p className="mb-3 text-sm font-semibold text-foreground sm:text-base">
                  Сравнение: ново от VIES → текущо във формата
                </p>
                <ul className="space-y-4">
                  {OVERWRITE_PREVIEW_FIELDS.map(({ key, label }) => {
                    const next = trimStr(overwritePreview.formFields[key]);
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
                        <span className="text-xs text-muted-foreground sm:text-sm">Ново (VIES)</span>
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
                flushPendingViesApply(false);
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
                flushPendingViesApply(true);
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

function hasAnyViesPreviewText(formFields: ViesFormAutofill): boolean {
  return OVERWRITE_PREVIEW_FIELDS.some(({ key }) => Boolean(trimStr(formFields[key])));
}

/** Canonical EU VAT key (e.g. EL + digits) so GR/EL prefixes match after parse. */
function vatCanonicalKey(raw: string): string | null {
  const p = parseEuVatInput(raw);
  if (!p) return null;
  return `${p.countryCode}${p.vatLocal}`.replace(/\s/g, "").toUpperCase();
}

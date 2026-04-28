import type { FieldValues, Path, UseFormGetValues, UseFormSetValue } from "react-hook-form";
import type { ViesFormAutofill, ViesPersistencePayload } from "@/lib/vies";

export type ViesExtendedFormValues = ViesFormAutofill & {
  viesLastCheckAt?: string | null;
  viesValid?: boolean | null;
  viesCountryCode?: string | null;
  viesNumberLocal?: string | null;
  viesTraderName?: string | null;
  viesTraderAddress?: string | null;
};

function trimStr(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

/** Merge VIES lookup into party forms; does not overwrite non-empty text fields unless overwriteExisting. */
export function applyViesResultToForm<T extends FieldValues & ViesExtendedFormValues>(
  getValues: UseFormGetValues<T>,
  setValue: UseFormSetValue<T>,
  formFields: ViesFormAutofill,
  persistence: ViesPersistencePayload,
  options?: { overwriteExisting: boolean }
) {
  const overwrite = options?.overwriteExisting ?? false;

  const setText = (key: Path<T>, next: string | undefined) => {
    if (!next?.trim()) return;
    const cur = trimStr(getValues(key));
    if (cur && !overwrite) return;
    setValue(key, next as T[Path<T>], { shouldValidate: true, shouldDirty: true });
  };

  setText("name" as Path<T>, formFields.name);
  setText("address" as Path<T>, formFields.address);
  setText("city" as Path<T>, formFields.city);
  setText("country" as Path<T>, formFields.country);

  if (formFields.vatRegistered !== undefined) {
    setValue("vatRegistered" as Path<T>, formFields.vatRegistered as T[Path<T>], {
      shouldValidate: true,
      shouldDirty: true,
    });
  }
  if (formFields.vatRegistrationNumber?.trim()) {
    setValue("vatRegistrationNumber" as Path<T>, formFields.vatRegistrationNumber as T[Path<T>], {
      shouldValidate: true,
      shouldDirty: true,
    });
  }
  if (formFields.vatNumber?.trim()) {
    setValue("vatNumber" as Path<T>, formFields.vatNumber as T[Path<T>], {
      shouldValidate: true,
      shouldDirty: true,
    });
  }
  if (formFields.bulstatNumber?.trim()) {
    const key = "bulstatNumber" as Path<T>;
    if (overwrite) {
      setValue(key, formFields.bulstatNumber as T[Path<T>], { shouldValidate: true, shouldDirty: true });
    } else {
      const cur = trimStr(getValues(key));
      if (!cur) {
        setValue(key, formFields.bulstatNumber as T[Path<T>], { shouldValidate: true, shouldDirty: true });
      }
    }
  }

  if (overwrite && formFields.vatRegistrationNumber?.trim()) {
    // Keep BG VAT-driven identifiers in sync on confirmed overwrite flows.
    const bulstatKey = "bulstatNumber" as Path<T>;
    const normalizedVat = formFields.vatRegistrationNumber.replace(/\s/g, "").toUpperCase();
    const bgVatMatch = normalizedVat.match(/^BG(\d+)$/);
    if (bgVatMatch?.[1]) {
      setValue(bulstatKey, bgVatMatch[1] as T[Path<T>], { shouldValidate: true, shouldDirty: true });
    }
  }

  setValue("viesLastCheckAt" as Path<T>, persistence.viesLastCheckAt as T[Path<T>], {
    shouldValidate: false,
    shouldDirty: true,
  });
  setValue("viesValid" as Path<T>, persistence.viesValid as T[Path<T>], {
    shouldValidate: false,
    shouldDirty: true,
  });
  setValue("viesCountryCode" as Path<T>, persistence.viesCountryCode as T[Path<T>], {
    shouldValidate: false,
    shouldDirty: true,
  });
  setValue("viesNumberLocal" as Path<T>, persistence.viesNumberLocal as T[Path<T>], {
    shouldValidate: false,
    shouldDirty: true,
  });
  setValue("viesTraderName" as Path<T>, (persistence.viesTraderName ?? "") as T[Path<T>], {
    shouldValidate: false,
    shouldDirty: true,
  });
  setValue("viesTraderAddress" as Path<T>, (persistence.viesTraderAddress ?? "") as T[Path<T>], {
    shouldValidate: false,
    shouldDirty: true,
  });
}

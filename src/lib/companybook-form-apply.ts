import type { FieldValues, Path, UseFormGetValues, UseFormSetValue } from "react-hook-form";
import type { CompanyBookFormFields } from "@/lib/companybook";

function trimStr(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

/**
 * Merge CompanyBook registry data into a party form.
 * Tax identifiers (ЕИК, ЗДДС) always follow the registry response.
 * Identity/contact fields follow overwriteIdentityFields: when false, only fill empty fields.
 */
export function applyCompanyBookToForm<T extends FieldValues>(
  getValues: UseFormGetValues<T>,
  setValue: UseFormSetValue<T>,
  fields: CompanyBookFormFields,
  options: { overwriteIdentityFields: boolean }
) {
  const ow = options.overwriteIdentityFields;

  setValue("bulstatNumber" as Path<T>, fields.bulstatNumber as T[Path<T>], {
    shouldValidate: true,
    shouldDirty: true,
  });
  setValue("uicType" as Path<T>, fields.uicType as T[Path<T>], {
    shouldValidate: true,
    shouldDirty: true,
  });
  setValue("vatRegistered" as Path<T>, fields.vatRegistered as T[Path<T>], {
    shouldValidate: true,
    shouldDirty: true,
  });
  setValue("vatRegistrationNumber" as Path<T>, fields.vatRegistrationNumber as T[Path<T>], {
    shouldValidate: true,
    shouldDirty: true,
  });
  setValue("vatNumber" as Path<T>, fields.vatNumber as T[Path<T>], {
    shouldValidate: true,
    shouldDirty: true,
  });

  const mergeText = (key: Path<T>, next: string) => {
    const t = (next ?? "").trim();
    const cur = trimStr(getValues(key));
    if (ow) {
      setValue(key, t as T[Path<T>], { shouldValidate: true, shouldDirty: true });
      return;
    }
    if (!t) return;
    if (!cur) setValue(key, t as T[Path<T>], { shouldValidate: true, shouldDirty: true });
  };

  mergeText("name" as Path<T>, fields.name);
  mergeText("address" as Path<T>, fields.address);
  mergeText("city" as Path<T>, fields.city);
  mergeText("state" as Path<T>, fields.state);
  mergeText("zipCode" as Path<T>, fields.zipCode);
  mergeText("country" as Path<T>, fields.country);
  mergeText("mol" as Path<T>, fields.mol);
  mergeText("email" as Path<T>, fields.email);
  mergeText("phone" as Path<T>, fields.phone);
}

export type InvoiceForIssueValidation = {
  placeOfIssue?: string | null;
  supplyType?: string | null;
  reverseCharge?: boolean | null;
  items?:
    | Array<{
        description?: string | null;
        taxRate?: number | string | null;
        vatExemptReason?: string | null;
      }>
    | null;
  company?: {
    bulstatNumber?: string | null;
    mol?: string | null;
    vatRegistered?: boolean | null;
  } | null;
  client?: {
    country?: string | null;
    viesValid?: boolean | null;
    vatRegistered?: boolean | null;
  } | null;
};

const ZERO_VAT_SCENARIOS = new Set([
  "REVERSE_CHARGE_DOMESTIC",
  "INTRA_COMMUNITY",
  "EXPORT",
  "NOT_VAT_REGISTERED",
]);

export function validateInvoiceForIssuing(fullInvoice: InvoiceForIssueValidation): {
  validationErrors: string[];
  warnings: string[];
} {
  const validationErrors: string[] = [];
  const warnings: string[] = [];

  const items = fullInvoice.items ?? [];
  if (items.length === 0) {
    validationErrors.push("Фактурата трябва да има поне един артикул");
  }

  const company = fullInvoice.company;
  if (!company?.bulstatNumber?.trim()) {
    validationErrors.push("Фирмата трябва да има ЕИК/БУЛСТАТ номер");
  }

  if (!fullInvoice.placeOfIssue?.trim()) {
    validationErrors.push("Мястото на издаване е задължително");
  }

  for (const item of items) {
    const taxRate = Number(item.taxRate);
    if (taxRate === 0 && !item.vatExemptReason?.trim()) {
      const desc = item.description?.trim() || "без описание";
      validationErrors.push(
        `Артикул „${desc}" с ДДС 0% трябва да има основание за освобождаване`
      );
    }
  }

  const supplyType = (fullInvoice.supplyType ?? "DOMESTIC").toUpperCase();

  if (ZERO_VAT_SCENARIOS.has(supplyType)) {
    const hasNonZero = items.some((item) => Number(item.taxRate) !== 0);
    if (hasNonZero) {
      validationErrors.push(
        "При този тип доставка (обратно начисляване / ВОД / износ) всички редове трябва да са с ДДС 0%"
      );
    }
  }

  if (
    supplyType === "REVERSE_CHARGE_DOMESTIC" ||
    supplyType === "INTRA_COMMUNITY"
  ) {
    if (fullInvoice.reverseCharge !== true) {
      validationErrors.push(
        "За обратно начисляване / вътреобщностна доставка флагът „Обратно начисляване“ трябва да е включен"
      );
    }
  }

  if (supplyType === "INTRA_COMMUNITY") {
    if (!fullInvoice.client?.viesValid) {
      warnings.push(
        "Препоръчително е ДДС номерът на клиента да бъде валидиран през VIES преди издаване на вътреобщностна доставка"
      );
    }
  }

  if (supplyType === "EXPORT") {
    const clientCountry = fullInvoice.client?.country?.trim().toUpperCase();
    if (clientCountry === "BG") {
      validationErrors.push(
        "За износ извън ЕС държавата на получателя не може да бъде България"
      );
    }
  }

  if (supplyType === "NOT_VAT_REGISTERED") {
    if (company?.vatRegistered === true) {
      validationErrors.push(
        "Фирмата е регистрирана по ЗДДС — не може да се издава фактура като нерегистрирано лице"
      );
    }
  }

  if (!company?.mol?.trim()) {
    warnings.push(
      "Препоръчително е фирмата да има посочено МОЛ (материално отговорно лице)"
    );
  }

  return { validationErrors, warnings };
}

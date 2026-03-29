export type InvoiceForIssueValidation = {
  placeOfIssue?: string | null;
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
  } | null;
};

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

  if (!company?.mol?.trim()) {
    warnings.push(
      "Препоръчително е фирмата да има посочено МОЛ (материално отговорно лице)"
    );
  }

  return { validationErrors, warnings };
}

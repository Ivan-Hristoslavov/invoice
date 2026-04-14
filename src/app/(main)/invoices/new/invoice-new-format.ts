/** Форматиране на суми и дати за формата „нова фактура“. */

export function formatInvoicePrice(value: number): string {
  if (!Number.isFinite(value)) return "0.00";
  const rounded = Math.round(value * 100) / 100;
  return rounded.toFixed(2);
}

export function formatInvoiceLongDate(value: string): string {
  return new Date(value).toLocaleDateString("bg-BG", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

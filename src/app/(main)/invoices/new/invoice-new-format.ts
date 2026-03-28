/** Форматиране на суми и дати за формата „нова фактура“. */

export function formatInvoicePrice(value: number): string {
  const rounded = Math.round(value * 100) / 100;
  if (Number.isInteger(rounded)) return rounded.toString();
  const oneDecimal = Math.round(value * 10) / 10;
  if (oneDecimal === rounded) return oneDecimal.toString();
  return rounded.toFixed(2);
}

export function formatInvoiceLongDate(value: string): string {
  return new Date(value).toLocaleDateString("bg-BG", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

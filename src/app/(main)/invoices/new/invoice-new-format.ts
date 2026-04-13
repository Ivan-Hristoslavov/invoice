import { formatPrice } from "@/lib/utils";

/** Форматиране на суми и дати за формата „нова фактура“. */

export function formatInvoicePrice(value: number): string {
  return formatPrice(value);
}

export function formatInvoiceLongDate(value: string): string {
  return new Date(value).toLocaleDateString("bg-BG", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export const APP_INVOICE_STATUSES = ["DRAFT", "ISSUED", "VOIDED", "CANCELLED"] as const;

export type AppInvoiceStatus = (typeof APP_INVOICE_STATUSES)[number];

const issuedLikeStatuses = new Set(["ISSUED", "UNPAID", "PAID", "OVERDUE"]);
const databaseIssuedLikeStatuses = ["UNPAID", "PAID", "OVERDUE"] as const;

export function normalizeInvoiceStatus(status?: string | null): AppInvoiceStatus {
  if (!status) return "DRAFT";
  if (issuedLikeStatuses.has(status)) return "ISSUED";
  if (status === "VOIDED") return "VOIDED";
  if (status === "CANCELLED") return "CANCELLED";
  return "DRAFT";
}

export function isIssuedLikeStatus(status?: string | null): boolean {
  return normalizeInvoiceStatus(status) === "ISSUED";
}

export function getDatabaseStatusForAppStatus(
  status: AppInvoiceStatus
): string {
  if (status === "ISSUED") return "UNPAID";
  return status;
}

export function getDatabaseStatusesForAppStatus(status?: string | null): string[] {
  if (!status) return [];
  if (status === "ISSUED") return [...databaseIssuedLikeStatuses];
  return [status];
}

export const APP_INVOICE_STATUSES = ["DRAFT", "ISSUED", "VOIDED", "CANCELLED"] as const;

export type AppInvoiceStatus = (typeof APP_INVOICE_STATUSES)[number];

const issuedLikeStatuses = new Set(["ISSUED", "UNPAID", "PAID", "OVERDUE"]);

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
  status: AppInvoiceStatus,
  currentDatabaseStatus?: string | null
): string {
  if (status !== "ISSUED") return status;

  if (currentDatabaseStatus && issuedLikeStatuses.has(currentDatabaseStatus)) {
    return currentDatabaseStatus;
  }

  // The deployed database still contains legacy values in some environments.
  return "PAID";
}

export function getDatabaseStatusesForAppStatus(status?: string | null): string[] {
  if (!status) return [];
  if (status === "ISSUED") return ["ISSUED", "UNPAID", "PAID", "OVERDUE"];
  return [status];
}

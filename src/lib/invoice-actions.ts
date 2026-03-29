import { normalizeInvoiceStatus, type AppInvoiceStatus } from "@/lib/invoice-status";

/**
 * Разрешени действия спрямо нормализирания статус на фактурата.
 * Издадените фактури не се изтриват — корекции през кредитно/дебитно известие.
 */
export function canDeleteInvoice(status?: string | null): boolean {
  return normalizeInvoiceStatus(status) === "DRAFT";
}

export function canEditInvoice(status?: string | null): boolean {
  return normalizeInvoiceStatus(status) === "DRAFT";
}

export function canIssueInvoice(status?: string | null): boolean {
  return normalizeInvoiceStatus(status) === "DRAFT";
}

export function canVoidDraftInvoice(status?: string | null): boolean {
  return normalizeInvoiceStatus(status) === "DRAFT";
}

/** Издадена фактура (вкл. UNPAID/PAID/OVERDUE) — отмяна чрез кредитно известие. */
export function canCancelIssuedInvoice(status?: string | null): boolean {
  return normalizeInvoiceStatus(status) === "ISSUED";
}

/** Дебитно известие — допълнително начисление към издадена фактура. */
export function canCreateDebitNoteFromInvoice(status?: string | null): boolean {
  return normalizeInvoiceStatus(status) === "ISSUED";
}

export function canDuplicateInvoice(_status?: string | null): boolean {
  return true;
}

/** Кредитно известие — корекция / възстановяване към издадена фактура. */
export function canCreateCreditNoteFromInvoice(status?: string | null): boolean {
  return normalizeInvoiceStatus(status) === "ISSUED";
}

export function canExportOrPrintInvoice(_status?: string | null): boolean {
  return true;
}

export function getNormalizedInvoiceStatus(status?: string | null): AppInvoiceStatus {
  return normalizeInvoiceStatus(status);
}

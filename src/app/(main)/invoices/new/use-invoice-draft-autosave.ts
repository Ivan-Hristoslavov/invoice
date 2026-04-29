const DRAFT_KEY = "invoice-new-draft-v1";

export type InvoiceDraftSnapshot = Record<string, unknown>;

/**
 * Best-effort localStorage draft for new invoice (reduces data loss on refresh).
 */
export function loadInvoiceDraft(): InvoiceDraftSnapshot | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as InvoiceDraftSnapshot;
  } catch {
    return null;
  }
}

export function saveInvoiceDraft(data: InvoiceDraftSnapshot) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(data));
  } catch {
    /* quota */
  }
}

export function clearInvoiceDraft() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch {
    /* ignore */
  }
}

export { DRAFT_KEY as INVOICE_DRAFT_STORAGE_KEY };

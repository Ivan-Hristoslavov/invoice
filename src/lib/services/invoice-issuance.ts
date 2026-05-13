import type { SupabaseClient } from "@supabase/supabase-js";
import { getDatabaseStatusForAppStatus } from "@/lib/invoice-status";
import { validateInvoiceForIssuing } from "@/lib/validate-invoice-for-issuing";

type InvoiceForIssuanceValidation = {
  id: string;
  status: string;
  company: Record<string, unknown> | null;
  client: Record<string, unknown> | null;
  items: Array<Record<string, unknown>>;
};

export async function loadInvoiceForIssuanceValidation(
  supabase: SupabaseClient,
  invoiceId: string
): Promise<InvoiceForIssuanceValidation | null> {
  const { data, error } = await supabase
    .from("Invoice")
    .select("id, status, placeOfIssue, supplyType, reverseCharge, company:Company(*), client:Client(*), items:InvoiceItem(*)")
    .eq("id", invoiceId)
    .single();

  if (error || !data) {
    return null;
  }

  return data as unknown as InvoiceForIssuanceValidation;
}

export async function ensureInvoiceCanBeIssued(
  supabase: SupabaseClient,
  invoiceId: string
): Promise<{ ok: true } | { ok: false; errors: string[]; warnings: string[] }> {
  const fullInvoice = await loadInvoiceForIssuanceValidation(supabase, invoiceId);
  if (!fullInvoice) {
    return {
      ok: false,
      errors: ["Неуспешно зареждане на фактурата за валидация"],
      warnings: [],
    };
  }

  const { validationErrors, warnings } = validateInvoiceForIssuing(fullInvoice);
  if (validationErrors.length > 0) {
    return { ok: false, errors: validationErrors, warnings };
  }

  return { ok: true };
}

export async function markInvoiceAsIssued(
  supabase: SupabaseClient,
  invoiceId: string,
  userId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { error } = await supabase
    .from("Invoice")
    .update({
      status: getDatabaseStatusForAppStatus("ISSUED"),
      updatedAt: new Date().toISOString(),
    })
    .eq("id", invoiceId)
    .eq("userId", userId);

  if (error) {
    return { ok: false, error: "Неуспешно издаване на фактурата" };
  }

  return { ok: true };
}

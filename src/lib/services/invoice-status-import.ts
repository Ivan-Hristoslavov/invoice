import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { logAction } from "@/lib/audit-log";

const statusSchema = z.enum(["PAID", "UNPAID", "OVERDUE", "ISSUED"]);

const importRowSchema = z.object({
  invoiceNumber: z.string().trim().min(1),
  companyId: z.string().trim().min(1),
  status: statusSchema,
  paidAt: z.string().datetime().optional(),
  externalRef: z.string().trim().max(120).optional(),
});

export type InvoiceStatusImportRow = z.infer<typeof importRowSchema>;

export function normalizeImportedStatus(
  status: InvoiceStatusImportRow["status"]
): "PAID" | "UNPAID" | "OVERDUE" {
  if (status === "ISSUED") return "UNPAID";
  return status;
}

export type ApplyInvoiceStatusImportResult = {
  success: true;
  source: string;
  appliedCount: number;
  failedCount: number;
  applied: Array<{ invoiceNumber: string; companyId: string; status: string }>;
  failed: Array<{ invoiceNumber: string; companyId: string; error: string }>;
};

type AuditHeaders = {
  ipAddress?: string;
  userAgent?: string;
};

/**
 * Applies validated status rows for the current user. Used by JSON and upload import routes.
 */
export async function applyInvoiceStatusImport(params: {
  supabase: SupabaseClient;
  userId: string;
  rows: InvoiceStatusImportRow[];
  source: string;
  audit: AuditHeaders;
}): Promise<ApplyInvoiceStatusImportResult> {
  const { supabase, userId, rows, source, audit } = params;
  const applied: ApplyInvoiceStatusImportResult["applied"] = [];
  const failed: ApplyInvoiceStatusImportResult["failed"] = [];

  for (const row of rows) {
    const parsed = importRowSchema.safeParse(row);
    if (!parsed.success) {
      failed.push({
        invoiceNumber: String(row.invoiceNumber ?? ""),
        companyId: String(row.companyId ?? ""),
        error: "Невалиден ред (проверете номер, фирма и статус)",
      });
      continue;
    }

    const normalizedStatus = normalizeImportedStatus(parsed.data.status);
    const { data: invoice, error: invoiceError } = await supabase
      .from("Invoice")
      .select("id, status, invoiceNumber, cancelledAt")
      .eq("invoiceNumber", parsed.data.invoiceNumber)
      .eq("companyId", parsed.data.companyId)
      .eq("userId", userId)
      .maybeSingle();

    if (invoiceError || !invoice) {
      failed.push({
        invoiceNumber: parsed.data.invoiceNumber,
        companyId: parsed.data.companyId,
        error: "Фактурата не е намерена за този потребител/фирма",
      });
      continue;
    }

    if (invoice.status === "CANCELLED" || invoice.status === "VOIDED" || invoice.cancelledAt) {
      failed.push({
        invoiceNumber: parsed.data.invoiceNumber,
        companyId: parsed.data.companyId,
        error: "Статусът не може да се обнови за отменена/анулирана фактура",
      });
      continue;
    }

    const updatePayload: Record<string, string | null> = {
      status: normalizedStatus,
      updatedAt: new Date().toISOString(),
    };
    if (normalizedStatus === "PAID") {
      updatePayload.paidAt = parsed.data.paidAt ?? new Date().toISOString();
    } else {
      updatePayload.paidAt = null;
    }

    const { error: updateError } = await supabase
      .from("Invoice")
      .update(updatePayload)
      .eq("id", invoice.id)
      .eq("userId", userId);

    if (updateError) {
      failed.push({
        invoiceNumber: parsed.data.invoiceNumber,
        companyId: parsed.data.companyId,
        error: "Неуспешно обновяване на статуса",
      });
      continue;
    }

    await logAction({
      userId,
      action: "UPDATE",
      entityType: "INVOICE",
      entityId: invoice.id,
      invoiceId: invoice.id,
      changes: {
        source,
        externalRef: parsed.data.externalRef ?? null,
        previousStatus: invoice.status,
        importedStatus: parsed.data.status,
        persistedStatus: normalizedStatus,
      },
      ipAddress: audit.ipAddress,
      userAgent: audit.userAgent,
    });

    applied.push({
      invoiceNumber: parsed.data.invoiceNumber,
      companyId: parsed.data.companyId,
      status: normalizedStatus,
    });
  }

  return {
    success: true,
    source,
    appliedCount: applied.length,
    failedCount: failed.length,
    applied,
    failed,
  };
}

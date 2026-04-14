import "server-only";

import { supabaseAdmin } from "@/lib/supabase";
import { withDocumentSnapshots } from "@/lib/document-snapshots";

/**
 * Loads invoice graph and applies document snapshots (same basis as PDF export).
 */
export async function loadInvoiceExportGraph(invoiceId: string, userId: string) {
  const { data: invoice, error: invoiceError } = await supabaseAdmin
    .from("Invoice")
    .select("*")
    .eq("id", invoiceId)
    .eq("userId", userId)
    .single();

  if (invoiceError || !invoice) {
    return { error: "NOT_FOUND", invoice: null, fullInvoice: null };
  }

  const { data: client } = await supabaseAdmin
    .from("Client")
    .select("*")
    .eq("id", invoice.clientId)
    .single();

  const { data: company } = await supabaseAdmin
    .from("Company")
    .select("*")
    .eq("id", invoice.companyId)
    .single();

  let bankAccount = null;
  if (company) {
    const { data: bankData } = await supabaseAdmin
      .from("BankAccount")
      .select("*")
      .eq("companyId", company.id)
      .limit(1)
      .single();
    bankAccount = bankData;
  }

  const { data: items } = await supabaseAdmin
    .from("InvoiceItem")
    .select("*")
    .eq("invoiceId", invoiceId);

  const snapshotInvoice = withDocumentSnapshots(
    invoice,
    company ? { ...company, bankAccount } : null,
    client,
    items || []
  );
  const snapshotCompany =
    snapshotInvoice.company && typeof snapshotInvoice.company === "object"
      ? {
          ...snapshotInvoice.company,
          bankAccount:
            snapshotInvoice.company.bankAccountDetails || bankAccount || null,
        }
      : null;

  const fullInvoice = {
    ...snapshotInvoice,
    company: snapshotCompany,
  };

  return { error: null, invoice, fullInvoice };
}

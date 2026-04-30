import { createAdminClient } from "@/lib/supabase/server";

export type InvoiceReportFilters = {
  userId: string;
  fromDate?: string | null;
  toDate?: string | null;
  clientId?: string | null;
  status?: string | null;
  paymentMethod?: string | null;
  accountType?: string | null;
};

export async function getInvoiceReportRows(filters: InvoiceReportFilters) {
  const supabase = createAdminClient();
  let query = supabase
    .from("Invoice")
    .select(
      "id, invoiceNumber, issueDate, dueDate, status, paymentMethod, accountType, total, client:Client(id,name), company:Company(id,name)"
    )
    .eq("userId", filters.userId)
    .order("issueDate", { ascending: true });

  if (filters.fromDate) query = query.gte("issueDate", filters.fromDate);
  if (filters.toDate) query = query.lte("issueDate", filters.toDate);
  if (filters.clientId) query = query.eq("clientId", filters.clientId);
  if (filters.status && filters.status !== "all") query = query.eq("status", filters.status);
  if (filters.paymentMethod && filters.paymentMethod !== "all") {
    query = query.eq("paymentMethod", filters.paymentMethod);
  }
  if (filters.accountType && filters.accountType !== "all") {
    query = query.eq("accountType", filters.accountType);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

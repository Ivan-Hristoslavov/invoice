import {
  generateBulgarianInvoiceNumber,
  parseBulgarianInvoiceNumber,
} from "@/lib/bulgarian-invoice";

interface NextDocumentNumberOptions {
  supabase: any;
  table: "CreditNote" | "DebitNote" | "VatProtocol117";
  numberColumn: "creditNoteNumber" | "debitNoteNumber" | "protocolNumber";
  userId: string;
  companyId: string;
  companyEik?: string | null;
  type: "credit-note" | "debit-note" | "vat-protocol-117";
}

export async function getNextDocumentNumber({
  supabase,
  table,
  numberColumn,
  userId,
  companyId,
  companyEik,
  type,
}: NextDocumentNumberOptions) {
  const yearPrefix = new Date().getFullYear().toString().slice(-2);
  const companyPrefix =
    companyEik && companyEik.length >= 4 ? companyEik.slice(-4) : "0000";
  const prefix = `${yearPrefix}${companyPrefix}`;

  const { data: existingNotes, error } = await supabase
    .from(table)
    .select(numberColumn)
    .eq("userId", userId)
    .eq("companyId", companyId)
    .like(numberColumn, `${prefix}%`)
    .order(numberColumn, { ascending: false })
    .limit(1);

  if (error) {
    throw error;
  }

  const lastNumber = existingNotes?.[0]?.[numberColumn];
  const parsed = typeof lastNumber === "string"
    ? parseBulgarianInvoiceNumber(lastNumber)
    : null;
  const nextSequence = parsed?.sequentialNumber ? parsed.sequentialNumber + 1 : 1;

  return generateBulgarianInvoiceNumber(nextSequence, companyEik ?? undefined, type);
}

import { generateBulgarianInvoiceNumber } from "@/lib/bulgarian-invoice";
import { getNextInvoiceSequence } from "@/lib/invoice-sequence";

/**
 * Generates the next invoice number for a company and user.
 * Format: YYCCCCNNNNNN
 */
export async function generateNextInvoiceNumber(
  userId: string,
  companyId: string,
  companyEik?: string | null
): Promise<string> {
  try {
    const { invoiceNumber } = await getNextInvoiceSequence(
      userId,
      companyId,
      companyEik
    );
    return invoiceNumber;
  } catch (error) {
    console.error("Error generating invoice number:", error);
    return generateBulgarianInvoiceNumber(1, companyEik ?? undefined, "invoice");
  }
}

/**
 * Validates if an invoice number follows the correct format
 */
export function isValidInvoiceNumber(invoiceNumber: string): boolean {
  return /^\d{12}$/.test(invoiceNumber);
}

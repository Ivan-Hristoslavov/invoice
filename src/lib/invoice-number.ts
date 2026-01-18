import { supabaseAdmin } from "@/lib/supabase";

/**
 * Generates the next invoice number for a company based on Bulgarian requirements.
 * Invoice numbers reset at the start of each year and increment from 1.
 */
export async function generateNextInvoiceNumber(companyId: string): Promise<string> {
  try {
    const currentYear = new Date().getFullYear();
    const startOfYear = new Date(currentYear, 0, 1).toISOString();
    
    // Find the last invoice for this company in the current year
    const { data: lastInvoice, error } = await supabaseAdmin
      .from('Invoice')
      .select('invoiceNumber')
      .eq('companyId', companyId)
      .gte('createdAt', startOfYear)
      .order('createdAt', { ascending: false })
      .limit(1)
      .single();

    // If no invoice exists for this year, start from 1
    if (error || !lastInvoice) {
      return formatInvoiceNumber(1, currentYear);
    }

    // Extract the number from the last invoice number
    const lastNumber = extractNumberFromInvoiceNumber(lastInvoice.invoiceNumber);
    
    // Increment the number
    return formatInvoiceNumber(lastNumber + 1, currentYear);
  } catch (error) {
    // If database is unavailable, return a default number
    console.error("Error generating invoice number:", error);
    const currentYear = new Date().getFullYear();
    return formatInvoiceNumber(1, currentYear);
  }
}

/**
 * Formats the invoice number according to Bulgarian requirements.
 * Format: YYYYNNNNNN where YYYY is the year and NNNNNN is a 6-digit sequential number
 */
function formatInvoiceNumber(number: number, year: number): string {
  // Pad the number to 6 digits
  const paddedNumber = number.toString().padStart(6, '0');
  return `${year}${paddedNumber}`;
}

/**
 * Extracts the sequential number from an invoice number
 */
function extractNumberFromInvoiceNumber(invoiceNumber: string): number {
  // Last 6 characters represent the sequential number
  const numberPart = invoiceNumber.slice(-6);
  return parseInt(numberPart, 10);
}

/**
 * Validates if an invoice number follows the correct format
 */
export function isValidInvoiceNumber(invoiceNumber: string): boolean {
  // Should be exactly 10 digits (4 for year + 6 for sequence)
  if (!/^\d{10}$/.test(invoiceNumber)) {
    return false;
  }

  // First 4 digits should be a valid year (2000-2099)
  const year = parseInt(invoiceNumber.slice(0, 4), 10);
  if (year < 2000 || year > 2099) {
    return false;
  }

  // Sequence number should be between 1 and 999999
  const sequence = parseInt(invoiceNumber.slice(4), 10);
  if (sequence < 1 || sequence > 999999) {
    return false;
  }

  return true;
}

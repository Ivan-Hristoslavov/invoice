import { supabaseAdmin } from "@/lib/supabase";

/**
 * Generates the next invoice number for a user.
 * Invoice numbers are 10 digits, starting from user's startingInvoiceNumber or 1.
 * Format: 0000000001, 0000000002, etc.
 */
export async function generateNextInvoiceNumber(userId: string): Promise<string> {
  try {
    // Get user's starting invoice number
    const { data: user, error: userError } = await supabaseAdmin
      .from('User')
      .select('startingInvoiceNumber')
      .eq('id', userId)
      .maybeSingle();

    if (userError && userError.code !== "PGRST116") {
      console.error("Error fetching user:", userError);
    }

    // Find the last invoice for this user
    const { data: lastInvoice, error } = await supabaseAdmin
      .from('Invoice')
      .select('invoiceNumber')
      .eq('userId', userId)
      .order('invoiceNumber', { ascending: false })
      .limit(1)
      .maybeSingle();

    let nextNumber: number;

    if (error || !lastInvoice) {
      // No invoice exists - use user's starting number or default to 1
      nextNumber = user?.startingInvoiceNumber || 1;
    } else {
      // Extract the number from the last invoice number (remove leading zeros)
      const lastNumber = parseInt(lastInvoice.invoiceNumber, 10);
      const calculatedNext = lastNumber + 1;
      
      // If user has set a starting invoice number and the calculated next is less than it,
      // use the starting number instead (for migration scenarios)
      if (user?.startingInvoiceNumber && calculatedNext < user.startingInvoiceNumber) {
        nextNumber = user.startingInvoiceNumber;
      } else {
        nextNumber = calculatedNext;
      }
    }

    return formatInvoiceNumber(nextNumber);
  } catch (error) {
    // If database is unavailable, return a default number
    console.error("Error generating invoice number:", error);
    return formatInvoiceNumber(1);
  }
}

/**
 * Formats the invoice number as 10 digits.
 * Format: 0000000001, 0000000002, etc.
 */
function formatInvoiceNumber(number: number): string {
  // Pad the number to 10 digits
  return number.toString().padStart(10, '0');
}

/**
 * Validates if an invoice number follows the correct format
 */
export function isValidInvoiceNumber(invoiceNumber: string): boolean {
  // Should be exactly 10 digits
  if (!/^\d{10}$/.test(invoiceNumber)) {
    return false;
  }

  // Number should be between 1 and 9999999999
  const number = parseInt(invoiceNumber, 10);
  if (number < 1 || number > 9999999999) {
    return false;
  }

  return true;
}

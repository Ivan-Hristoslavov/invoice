import { createAdminClient } from "@/lib/supabase/server";

/**
 * Format invoice number as 10 digits (0000000001, 0000000002, etc.)
 */
function formatInvoiceNumber(sequence: number): string {
  return sequence.toString().padStart(10, '0');
}

/**
 * Get next invoice sequence for a user
 * Returns the next sequence number based on user's invoice count
 * Invoice numbers are per-user, starting from user's startingInvoiceNumber or 1
 * Format: 10 digits (0000000001, 0000000002, etc.)
 */
export async function getNextInvoiceSequence(
  userId: string,
  maxRetries: number = 5
): Promise<{ sequence: number; invoiceNumber: string }> {
  const supabase = createAdminClient();
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Get user's starting invoice number
      const { data: user, error: userError } = await supabase
        .from("User")
        .select("startingInvoiceNumber")
        .eq("id", userId)
        .single();

      if (userError) {
        throw userError;
      }

      // Get the highest invoice number for this user
      const { data: invoices, error: invoicesError } = await supabase
        .from("Invoice")
        .select("invoiceNumber")
        .eq("userId", userId)
        .order("invoiceNumber", { ascending: false })
        .limit(1);

      if (invoicesError && invoicesError.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw invoicesError;
      }

      let nextSequence: number;
      
      if (invoices && invoices.length > 0) {
        // Extract number from existing invoice (remove leading zeros)
        const lastNumber = parseInt(invoices[0].invoiceNumber, 10);
        nextSequence = lastNumber + 1;
      } else {
        // No invoices yet - use user's starting number or default to 1
        nextSequence = user?.startingInvoiceNumber || 1;
      }
      
      // Generate 10-digit invoice number
      const invoiceNumber = formatInvoiceNumber(nextSequence);
      
      return { sequence: nextSequence, invoiceNumber };
    } catch (error) {
      // If this is the last attempt, throw the error
      if (attempt === maxRetries - 1) {
        throw error;
      }
      // Otherwise, wait and retry
      await new Promise(resolve => setTimeout(resolve, 50 * (attempt + 1)));
    }
  }
  
  throw new Error("Failed to get next invoice sequence after all retries");
}

/**
 * Get current sequence number without incrementing
 */
export async function getCurrentSequence(
  userId: string
): Promise<number> {
  const supabase = createAdminClient();
  
  // Get user's starting invoice number
  const { data: user } = await supabase
    .from("User")
    .select("startingInvoiceNumber")
    .eq("id", userId)
    .single();

  // Get the highest invoice number for this user
  const { data: invoices } = await supabase
    .from("Invoice")
    .select("invoiceNumber")
    .eq("userId", userId)
    .order("invoiceNumber", { ascending: false })
    .limit(1);

  if (invoices && invoices.length > 0) {
    // Extract number from existing invoice
    return parseInt(invoices[0].invoiceNumber, 10);
  }
  
  // No invoices yet - return user's starting number or 0
  return user?.startingInvoiceNumber || 0;
}

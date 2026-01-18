import { createAdminClient } from "@/lib/supabase/server";
import { generateBulgarianInvoiceNumber } from "@/lib/bulgarian-invoice";
import cuid from "cuid";

/**
 * Get or create InvoiceSequence for a company and year
 * Returns the next sequence number and updates the sequence
 * Uses retry logic to handle race conditions
 */
export async function getNextInvoiceSequence(
  companyId: string,
  companyEik?: string,
  maxRetries: number = 5
): Promise<{ sequence: number; invoiceNumber: string }> {
  const supabase = createAdminClient();
  const currentYear = new Date().getFullYear();
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Try to get existing sequence
      const { data: existingSequence, error: fetchError } = await supabase
        .from("InvoiceSequence")
        .select("*")
        .eq("companyId", companyId)
        .eq("year", currentYear)
        .single();
      
      let sequence: number;
      let sequenceId: string;
      
      if (existingSequence && !fetchError) {
        // Increment existing sequence atomically
        sequence = existingSequence.sequence + 1;
        sequenceId = existingSequence.id;
        
        // Use update with condition to ensure atomicity
        const { data: updatedSequence, error: updateError } = await supabase
          .from("InvoiceSequence")
          .update({
            sequence,
            updatedAt: new Date().toISOString(),
          })
          .eq("id", sequenceId)
          .eq("sequence", existingSequence.sequence) // Only update if sequence hasn't changed
          .select()
          .single();
        
        // If update failed (sequence was changed by another request), retry
        if (updateError || !updatedSequence) {
          if (attempt < maxRetries - 1) {
            // Small delay before retry
            await new Promise(resolve => setTimeout(resolve, 50 * (attempt + 1)));
            continue;
          }
          throw new Error("Failed to update invoice sequence after retries");
        }
      } else {
        // Create new sequence starting from 1
        sequence = 1;
        const newSequenceId = cuid();
        
        const { data: insertedSequence, error: insertError } = await supabase
          .from("InvoiceSequence")
          .insert({
            id: newSequenceId,
            companyId,
            year: currentYear,
            sequence: 1,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          })
          .select()
          .single();
        
        // If insert failed (likely due to unique constraint), retry
        if (insertError || !insertedSequence) {
          // Check if it's a unique constraint violation (another request created it)
          if (insertError?.code === '23505' && attempt < maxRetries - 1) {
            await new Promise(resolve => setTimeout(resolve, 50 * (attempt + 1)));
            continue;
          }
          throw insertError || new Error("Failed to create invoice sequence");
        }
        
        sequenceId = newSequenceId;
      }
      
      // Generate Bulgarian invoice number format: YYCCCCNNNNNNИ
      const invoiceNumber = generateBulgarianInvoiceNumber(sequence, companyEik, 'invoice');
      
      return { sequence, invoiceNumber };
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
  companyId: string
): Promise<number> {
  const supabase = createAdminClient();
  const currentYear = new Date().getFullYear();
  
  const { data: sequence } = await supabase
    .from("InvoiceSequence")
    .select("sequence")
    .eq("companyId", companyId)
    .eq("year", currentYear)
    .single();
  
  return sequence?.sequence || 0;
}

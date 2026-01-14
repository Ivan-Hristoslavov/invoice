import { createAdminClient } from "@/lib/supabase/server";
import { generateBulgarianInvoiceNumber } from "@/lib/bulgarian-invoice";
import cuid from "cuid";

/**
 * Get or create InvoiceSequence for a company and year
 * Returns the next sequence number and updates the sequence
 */
export async function getNextInvoiceSequence(
  companyId: string,
  companyEik?: string
): Promise<{ sequence: number; invoiceNumber: string }> {
  const supabase = createAdminClient();
  const currentYear = new Date().getFullYear();
  
  // Get or create sequence for this company and year
  const { data: existingSequence } = await supabase
    .from("InvoiceSequence")
    .select("*")
    .eq("companyId", companyId)
    .eq("year", currentYear)
    .single();
  
  let sequence: number;
  let sequenceId: string;
  
  if (existingSequence) {
    // Increment existing sequence
    sequence = existingSequence.sequence + 1;
    sequenceId = existingSequence.id;
    
    await supabase
      .from("InvoiceSequence")
      .update({
        sequence,
        updatedAt: new Date().toISOString(),
      })
      .eq("id", sequenceId);
  } else {
    // Create new sequence starting from 1
    sequence = 1;
    const newSequenceId = cuid();
    
    await supabase
      .from("InvoiceSequence")
      .insert({
        id: newSequenceId,
        companyId,
        year: currentYear,
        sequence: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    
    sequenceId = newSequenceId;
  }
  
  // Generate Bulgarian invoice number format: YYCCCCNNNNNNИ
  const invoiceNumber = generateBulgarianInvoiceNumber(sequence, companyEik, 'invoice');
  
  return { sequence, invoiceNumber };
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

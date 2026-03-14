import { createAdminClient } from "@/lib/supabase/server";
import { generateBulgarianInvoiceNumber } from "@/lib/bulgarian-invoice";

export async function getNextInvoiceSequence(
  userId: string,
  companyId: string,
  companyEik?: string | null,
  maxRetries: number = 5
): Promise<{ sequence: number; invoiceNumber: string }> {
  const supabase = createAdminClient();
  const year = new Date().getFullYear();
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const { data: existingSequence, error: sequenceError } = await supabase
        .from("InvoiceSequence")
        .select("id, sequence")
        .eq("userId", userId)
        .eq("companyId", companyId)
        .eq("year", year)
        .maybeSingle();

      if (sequenceError) {
        throw sequenceError;
      }

      let nextSequence: number;
      if (existingSequence) {
        nextSequence = existingSequence.sequence + 1;

        const { error: updateError } = await supabase
          .from("InvoiceSequence")
          .update({
            sequence: nextSequence,
            updatedAt: new Date().toISOString(),
          })
          .eq("id", existingSequence.id);

        if (updateError) {
          throw updateError;
        }
      } else {
        nextSequence = 1;

        const { error: insertError } = await supabase
          .from("InvoiceSequence")
          .insert({
            companyId,
            userId,
            year,
            sequence: nextSequence,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });

        if (insertError && insertError.code !== "23505") {
          throw insertError;
        }

        if (insertError?.code === "23505") {
          await new Promise((resolve) => setTimeout(resolve, 50 * (attempt + 1)));
          continue;
        }
      }

      const invoiceNumber = generateBulgarianInvoiceNumber(
        nextSequence,
        companyEik ?? undefined,
        "invoice"
      );

      return { sequence: nextSequence, invoiceNumber };
    } catch (error) {
      if (attempt === maxRetries - 1) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, 50 * (attempt + 1)));
    }
  }
  
  throw new Error("Failed to get next invoice sequence after all retries");
}

export async function getCurrentSequence(
  userId: string,
  companyId: string
): Promise<number> {
  const supabase = createAdminClient();
  const year = new Date().getFullYear();
  
  const { data: sequence } = await supabase
    .from("InvoiceSequence")
    .select("sequence")
    .eq("userId", userId)
    .eq("companyId", companyId)
    .eq("year", year)
    .maybeSingle();

  return sequence?.sequence || 0;
}

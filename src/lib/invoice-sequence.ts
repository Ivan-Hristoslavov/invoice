import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/server";
import { generateBulgarianInvoiceNumber } from "@/lib/bulgarian-invoice";
import cuid from "cuid";

type InvoicePrefsJson = { invoicePrefix?: string | null };

/** Prepends user-defined prefix from settings (e.g. Ф-, ФАК-) to the numeric core. */
export function applyInvoicePrefix(
  baseNumber: string,
  prefix: string | null | undefined
): string {
  if (typeof prefix !== "string") return baseNumber;
  const p = prefix.trim();
  if (!p) return baseNumber;
  return `${p}${baseNumber}`;
}

export async function getInvoicePrefixForUser(
  supabase: SupabaseClient,
  userId: string
): Promise<string | null> {
  const { data } = await supabase
    .from("User")
    .select("invoicePreferences")
    .eq("id", userId)
    .maybeSingle();
  const prefs = data?.invoicePreferences as InvoicePrefsJson | null | undefined;
  const raw = prefs?.invoicePrefix;
  if (typeof raw !== "string") return null;
  const t = raw.trim();
  return t || null;
}

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
            id: cuid(),
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

      const baseNumber = generateBulgarianInvoiceNumber(
        nextSequence,
        companyEik ?? undefined,
        "invoice"
      );
      const prefix = await getInvoicePrefixForUser(supabase, userId);
      const invoiceNumber = applyInvoicePrefix(baseNumber, prefix);

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

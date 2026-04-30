import type { SupabaseClient } from '@supabase/supabase-js';
import { createAdminClient } from '@/lib/supabase/server';
import { generateBulgarianInvoiceNumber, parseBulgarianInvoiceNumber } from '@/lib/bulgarian-invoice';
import { computeBootstrapNextSequence } from '@/lib/invoice-sequence-logic';
import cuid from 'cuid';

type InvoicePrefsJson = { invoicePrefix?: string | null };

/** Single global row per company — avoids calendar-year resets (see InvoiceSequence @@unique([companyId, year])). */
const GLOBAL_SEQUENCE_YEAR = 0;
const GLOBAL_PROFORMA_SEQUENCE_YEAR = 0;

/** Prepends user-defined prefix from settings (e.g. Ф-, ФАК-) to the numeric core. */
export function applyInvoicePrefix(
  baseNumber: string,
  prefix: string | null | undefined
): string {
  if (typeof prefix !== 'string') return baseNumber;
  const p = prefix.trim();
  if (!p) return baseNumber;
  return `${p}${baseNumber}`;
}

export async function getInvoicePrefixForUser(
  supabase: SupabaseClient,
  userId: string
): Promise<string | null> {
  const { data } = await supabase
    .from('User')
    .select('invoicePreferences')
    .eq('id', userId)
    .maybeSingle();
  const prefs = data?.invoicePreferences as InvoicePrefsJson | null | undefined;
  const raw = prefs?.invoicePrefix;
  if (typeof raw !== 'string') return null;
  const t = raw.trim();
  return t || null;
}

async function getMaxSequentialFromInvoices(
  supabase: SupabaseClient,
  userId: string,
  companyId: string
): Promise<number> {
  const { data: rows, error } = await supabase
    .from('Invoice')
    .select('invoiceNumber')
    .eq('userId', userId)
    .eq('companyId', companyId);

  if (error) throw error;

  let max = 0;
  for (const row of rows ?? []) {
    const parsed = parseBulgarianInvoiceNumber(String(row.invoiceNumber ?? ''));
    if (parsed?.sequentialNumber != null) {
      max = Math.max(max, parsed.sequentialNumber);
    }
  }
  return max;
}

async function getMaxLegacySequenceCounter(
  supabase: SupabaseClient,
  userId: string,
  companyId: string
): Promise<number> {
  const { data: rows, error } = await supabase
    .from('InvoiceSequence')
    .select('sequence')
    .eq('userId', userId)
    .eq('companyId', companyId);

  if (error) throw error;
  let max = 0;
  for (const row of rows ?? []) {
    if (typeof row.sequence === 'number') max = Math.max(max, row.sequence);
  }
  return max;
}

export async function getNextInvoiceSequence(
  userId: string,
  companyId: string,
  companyEik?: string | null,
  maxRetries: number = 5
): Promise<{ sequence: number; invoiceNumber: string }> {
  const supabase = createAdminClient();

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const { data: existingSequence, error: sequenceError } = await supabase
        .from('InvoiceSequence')
        .select('id, sequence')
        .eq('userId', userId)
        .eq('companyId', companyId)
        .eq('year', GLOBAL_SEQUENCE_YEAR)
        .maybeSingle();

      if (sequenceError) {
        throw sequenceError;
      }

      let nextSequence: number;
      if (existingSequence) {
        nextSequence = existingSequence.sequence + 1;

        const { error: updateError } = await supabase
          .from('InvoiceSequence')
          .update({
            sequence: nextSequence,
            updatedAt: new Date().toISOString(),
          })
          .eq('id', existingSequence.id);

        if (updateError) {
          throw updateError;
        }
      } else {
        const { data: userRow } = await supabase
          .from('User')
          .select('startingInvoiceNumber')
          .eq('id', userId)
          .maybeSingle();

        const maxFromInvoices = await getMaxSequentialFromInvoices(supabase, userId, companyId);
        const maxFromLegacy = await getMaxLegacySequenceCounter(supabase, userId, companyId);

        nextSequence = computeBootstrapNextSequence({
          maxSequentialFromInvoices: maxFromInvoices,
          maxLegacySequenceCounter: maxFromLegacy,
          startingInvoiceNumber: userRow?.startingInvoiceNumber ?? null,
        });

        const { error: insertError } = await supabase
          .from('InvoiceSequence')
          .insert({
            id: cuid(),
            companyId,
            userId,
            year: GLOBAL_SEQUENCE_YEAR,
            sequence: nextSequence,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });

        if (insertError && insertError.code !== '23505') {
          throw insertError;
        }

        if (insertError?.code === '23505') {
          await new Promise((resolve) => setTimeout(resolve, 50 * (attempt + 1)));
          continue;
        }
      }

      const baseNumber = generateBulgarianInvoiceNumber(
        nextSequence,
        companyEik ?? undefined,
        'invoice'
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

  throw new Error('Failed to get next invoice sequence after all retries');
}

export async function getCurrentSequence(userId: string, companyId: string): Promise<number> {
  const supabase = createAdminClient();

  const { data: sequence } = await supabase
    .from('InvoiceSequence')
    .select('sequence')
    .eq('userId', userId)
    .eq('companyId', companyId)
    .eq('year', GLOBAL_SEQUENCE_YEAR)
    .maybeSingle();

  return sequence?.sequence ?? 0;
}

/**
 * Compensating rollback when an Invoice INSERT fails after we already bumped
 * the InvoiceSequence. Decrements the sequence by exactly 1 iff the current
 * value still matches the one we just issued — prevents race conditions where
 * a parallel successful create already advanced the counter further.
 */
export async function rollbackInvoiceSequence(
  userId: string,
  companyId: string,
  issuedSequence: number
): Promise<void> {
  const supabase = createAdminClient();

  const { data: existing, error } = await supabase
    .from('InvoiceSequence')
    .select('id, sequence')
    .eq('userId', userId)
    .eq('companyId', companyId)
    .eq('year', GLOBAL_SEQUENCE_YEAR)
    .maybeSingle();

  if (error || !existing) return;
  if (existing.sequence !== issuedSequence) return;

  await supabase
    .from('InvoiceSequence')
    .update({
      sequence: Math.max(0, issuedSequence - 1),
      updatedAt: new Date().toISOString(),
    })
    .eq('id', existing.id)
    .eq('sequence', issuedSequence);
}

export async function getNextProformaSequence(
  userId: string,
  companyId: string,
  maxRetries: number = 5
): Promise<{ sequence: number; proformaNumber: string }> {
  const supabase = createAdminClient();
  const year = new Date().getFullYear();
  const { data: userPrefsRow } = await supabase
    .from("User")
    .select("invoicePreferences")
    .eq("id", userId)
    .single();
  const rawPrefs =
    userPrefsRow && typeof userPrefsRow.invoicePreferences === "object" && !Array.isArray(userPrefsRow.invoicePreferences)
      ? (userPrefsRow.invoicePreferences as Record<string, unknown>)
      : {};
  const prefix = typeof rawPrefs.proformaPrefix === "string" && rawPrefs.proformaPrefix.trim().length > 0
    ? rawPrefs.proformaPrefix.trim()
    : "PF";
  const startingProformaNumber = typeof rawPrefs.startingProformaNumber === "number" && rawPrefs.startingProformaNumber > 0
    ? Math.floor(rawPrefs.startingProformaNumber)
    : 1;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const { data: existingSequence, error: sequenceError } = await supabase
        .from("ProformaSequence")
        .select("id, sequence")
        .eq("userId", userId)
        .eq("companyId", companyId)
        .eq("year", GLOBAL_PROFORMA_SEQUENCE_YEAR)
        .maybeSingle();

      if (sequenceError) throw sequenceError;

      let nextSequence: number;
      if (existingSequence) {
        nextSequence = Math.max(existingSequence.sequence + 1, startingProformaNumber);
        const { error: updateError } = await supabase
          .from("ProformaSequence")
          .update({
            sequence: nextSequence,
            updatedAt: new Date().toISOString(),
          })
          .eq("id", existingSequence.id);
        if (updateError) throw updateError;
      } else {
        nextSequence = startingProformaNumber;
        const { error: insertError } = await supabase.from("ProformaSequence").insert({
          id: cuid(),
          companyId,
          userId,
          year: GLOBAL_PROFORMA_SEQUENCE_YEAR,
          sequence: nextSequence,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        if (insertError && insertError.code !== "23505") throw insertError;
        if (insertError?.code === "23505") {
          await new Promise((resolve) => setTimeout(resolve, 50 * (attempt + 1)));
          continue;
        }
      }

      return {
        sequence: nextSequence,
        proformaNumber: `${prefix}-${year}-${String(nextSequence).padStart(6, "0")}`,
      };
    } catch (error) {
      if (attempt === maxRetries - 1) throw error;
      await new Promise((resolve) => setTimeout(resolve, 50 * (attempt + 1)));
    }
  }

  throw new Error("Failed to get next proforma sequence after all retries");
}

export async function rollbackProformaSequence(
  userId: string,
  companyId: string,
  issuedSequence: number
): Promise<void> {
  const supabase = createAdminClient();
  const { data: existing, error } = await supabase
    .from("ProformaSequence")
    .select("id, sequence")
    .eq("userId", userId)
    .eq("companyId", companyId)
    .eq("year", GLOBAL_PROFORMA_SEQUENCE_YEAR)
    .maybeSingle();

  if (error || !existing) return;
  if (existing.sequence !== issuedSequence) return;

  await supabase
    .from("ProformaSequence")
    .update({
      sequence: Math.max(0, issuedSequence - 1),
      updatedAt: new Date().toISOString(),
    })
    .eq("id", existing.id)
    .eq("sequence", issuedSequence);
}

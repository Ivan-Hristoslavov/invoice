import "server-only";

import { supabaseAdmin } from "@/lib/supabase";
import type { PdfVisualPrefs } from "@/lib/pdf-visual-preferences";
import { DEFAULT_PDF_VISUAL_PREFS } from "@/lib/pdf-visual-preferences";

/**
 * Loads invoice PDF toggles from persisted user settings (invoicePreferences JSON).
 * Server-only: uses service-role Supabase client.
 */
export async function resolvePdfVisualPrefsForUser(
  userId: string | undefined
): Promise<PdfVisualPrefs> {
  if (!userId) {
    return { ...DEFAULT_PDF_VISUAL_PREFS };
  }
  try {
    const { data } = await supabaseAdmin
      .from("User")
      .select("invoicePreferences")
      .eq("id", userId)
      .maybeSingle();
    const j = data?.invoicePreferences as
      | { showCompanyLogo?: boolean; showAmountInWords?: boolean }
      | null
      | undefined;
    return {
      showCompanyLogo: j?.showCompanyLogo ?? DEFAULT_PDF_VISUAL_PREFS.showCompanyLogo,
      showAmountInWords: j?.showAmountInWords ?? DEFAULT_PDF_VISUAL_PREFS.showAmountInWords,
    };
  } catch {
    return { ...DEFAULT_PDF_VISUAL_PREFS };
  }
}

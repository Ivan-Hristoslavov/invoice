import { createAdminClient } from "@/lib/supabase/server";
import { resolveSessionUser } from "@/lib/session-user";
import type { Session } from "next-auth";

export type CompanyRecord = {
  id?: string;
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  vatNumber?: string;
  taxIdNumber?: string;
  registrationNumber?: string;
  bulstatNumber?: string;
  vatRegistered?: boolean;
  vatRegistrationNumber?: string;
  mol?: string;
  accountablePerson?: string;
  uicType?: "BULSTAT" | "EGN";
  bankName?: string;
  bankAccount?: string;
  bankSwift?: string;
  bankIban?: string;
  logo?: string;
  viesLastCheckAt?: string | null;
  viesValid?: boolean | null;
  viesCountryCode?: string | null;
  viesNumberLocal?: string | null;
  viesTraderName?: string | null;
  viesTraderAddress?: string | null;
} | null;

export async function loadCompanySettingsData(session: Session) {
  const sessionUser = await resolveSessionUser(session.user!);
  if (!sessionUser) {
    return { company: null as CompanyRecord, showCompanyLogoInPdf: true };
  }

  let company: CompanyRecord = null;
  let showCompanyLogoInPdf = true;
  try {
    const supabase = createAdminClient();
    const [companyRes, userRes] = await Promise.all([
      supabase.from("Company").select("*").eq("userId", sessionUser.id).single(),
      supabase.from("User").select("invoicePreferences").eq("id", sessionUser.id).maybeSingle(),
    ]);

    if (!companyRes.error && companyRes.data) {
      company = companyRes.data;
    }

    const prefs = userRes.data?.invoicePreferences as
      | { showCompanyLogo?: boolean }
      | null
      | undefined;
    if (typeof prefs?.showCompanyLogo === "boolean") {
      showCompanyLogoInPdf = prefs.showCompanyLogo;
    }
  } catch (e) {
    console.error("loadCompanySettingsData", e);
  }

  return { company, showCompanyLogoInPdf };
}

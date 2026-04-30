import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { DEFAULT_VAT_RATE } from "@/config/constants";

export type InvoicePreferencesPayload = {
  defaultVatRate: number;
  startingInvoiceNumber?: number;
  startingProformaNumber?: number;
  startingVatProtocolNumber?: number;
  invoicePrefix: string;
  proformaPrefix: string;
  resetNumberingYearly: boolean;
  defaultCurrency: string;
  showAmountInWords: boolean;
  defaultTermsAndConditions: string;
  defaultNotes: string;
  showCompanyLogo: boolean;
  autoArchiveAfterDays: number;
  keepDraftDays: number;
};

type PrefsJson = {
  invoicePrefix?: string | null;
  proformaPrefix?: string | null;
  resetNumberingYearly?: boolean;
  defaultCurrency?: string;
  showAmountInWords?: boolean;
  defaultTermsAndConditions?: string | null;
  defaultNotes?: string | null;
  showCompanyLogo?: boolean;
  autoArchiveAfterDays?: number;
  keepDraftDays?: number;
  startingVatProtocolNumber?: number | null;
  startingProformaNumber?: number | null;
};

function parsePreferencesJson(value: Prisma.JsonValue | null): PrefsJson {
  if (value === null || value === undefined) return {};
  if (typeof value !== "object" || Array.isArray(value)) return {};
  return value as PrefsJson;
}

/** Споделено зареждане за GET /api/settings/invoice-preferences и RSC страницата (без втори round-trip). */
export async function getInvoicePreferencesForUser(
  userId: string
): Promise<InvoicePreferencesPayload | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      defaultVatRate: true,
      startingInvoiceNumber: true,
      invoicePreferences: true,
    },
  });

  if (!user) return null;

  const j = parsePreferencesJson(user.invoicePreferences);

  return {
    defaultVatRate: user.defaultVatRate != null ? Number(user.defaultVatRate) : DEFAULT_VAT_RATE,
    startingInvoiceNumber: user.startingInvoiceNumber ?? undefined,
    startingProformaNumber:
      typeof j.startingProformaNumber === "number" ? j.startingProformaNumber : undefined,
    startingVatProtocolNumber:
      typeof j.startingVatProtocolNumber === "number" ? j.startingVatProtocolNumber : undefined,
    invoicePrefix: j.invoicePrefix ?? "",
    proformaPrefix: j.proformaPrefix ?? "PF",
    resetNumberingYearly: j.resetNumberingYearly ?? false,
    defaultCurrency: j.defaultCurrency ?? "EUR",
    showAmountInWords: j.showAmountInWords ?? true,
    defaultTermsAndConditions: j.defaultTermsAndConditions ?? "",
    defaultNotes: j.defaultNotes ?? "",
    showCompanyLogo: j.showCompanyLogo ?? true,
    autoArchiveAfterDays: j.autoArchiveAfterDays ?? 365,
    keepDraftDays: j.keepDraftDays ?? 30,
  };
}

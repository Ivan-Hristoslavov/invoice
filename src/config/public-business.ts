import { APP_NAME } from "@/config/constants";

export const publicBusinessProfile = {
  supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "support@invoicy.bg",
  supportPhone: process.env.NEXT_PUBLIC_SUPPORT_PHONE || "",
  supportResponseHours: process.env.NEXT_PUBLIC_SUPPORT_RESPONSE_HOURS || "до 4 работни часа",
  legalCompanyName: process.env.NEXT_PUBLIC_LEGAL_COMPANY_NAME || "",
  legalCompanyId: process.env.NEXT_PUBLIC_LEGAL_COMPANY_ID || "",
  legalVatId: process.env.NEXT_PUBLIC_LEGAL_VAT_ID || "",
  legalAddress: process.env.NEXT_PUBLIC_LEGAL_ADDRESS || "",
  calendlyDemoUrl: process.env.NEXT_PUBLIC_CALENDLY_DEMO_URL || "",
  facebookUrl: process.env.NEXT_PUBLIC_FACEBOOK_URL || "",
  linkedinUrl: process.env.NEXT_PUBLIC_LINKEDIN_URL || "",
  xUrl: process.env.NEXT_PUBLIC_X_URL || "",
} as const;

function hasPlaceholder(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  return normalized.includes("dummy") || normalized.includes("for now");
}

export function shouldShowPublicLegalField(value: string): boolean {
  return Boolean(value.trim()) && !hasPlaceholder(value);
}

export const paymentMessage = {
  short:
    `${APP_NAME} е софтуер за фактуриране. Не е платежен оператор и не съхранява клиентски карти.`,
  subscription:
    "Плащанията за абонамент се обработват сигурно от Stripe.",
  clientInvoices:
    "Плащанията по вашите фактури се извършват директно между вас и вашите клиенти.",
} as const;

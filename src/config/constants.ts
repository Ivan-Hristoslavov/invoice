/**
 * Global application constants
 */

export const APP_NAME = "InvoicyPro";

/** Default `<title>` and primary SEO title (Open Graph / Twitter when not overridden). */
export const APP_DEFAULT_TITLE = "InvoicyPro – Invoicing SaaS";

// App metadata
export const APP_DESCRIPTION =
  "Modern invoicing platform for managing invoices easily and efficiently.";
export const APP_COPYRIGHT = `© ${new Date().getFullYear()} ${APP_NAME}. Всички права запазени.`;

// SEO Keywords
export const SEO_KEYWORDS = [
  "InvoicyPro",
  "invoicing SaaS",
  "invoice software",
  "online invoicing",
  "фактуриране",
  "фактури",
  "фактура софтуер",
  "български фактури",
  "български данъчни формати",
  "фактуриране онлайн",
  "софтуер за фактури",
  "електронни фактури",
  "фактуриране България",
  "управление на фактури",
  "фактуриране за бизнес",
  "фактуриране софтуер България",
];

// Default values
export const DEFAULT_VAT_RATE = 20; // Default Bulgarian VAT rate

// Supported currencies
export const CURRENCIES: Record<string, { symbol: string; name: string; locale: string }> = {
  EUR: { symbol: "€", name: "Евро", locale: "bg-BG" },
  USD: { symbol: "$", name: "Долар", locale: "en-US" },
};

export function getCurrencySymbol(code: string): string {
  return CURRENCIES[code]?.symbol || code;
}

// Invoice status labels and colors
export const INVOICE_STATUS = {
  DRAFT: { label: "Чернова", color: "amber" },
  ISSUED: { label: "Издадена", color: "emerald" },
  VOIDED: { label: "Анулирана", color: "purple" },
  CANCELLED: { label: "Отказана", color: "red" },
} as const;

// Social links and contact information can be added here

// Storage: images bucket (logos + attachments)
export const STORAGE_BUCKET_IMAGES = "images";

// Logo upload: max size 2MB, recommended max dimension for PDF/email
export const MAX_LOGO_SIZE_BYTES = 2 * 1024 * 1024;
export const MAX_LOGO_DIMENSION_PX = 800;

// Invoice attachment upload: allowed types and max size per file
export const ALLOWED_ATTACHMENT_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;
export const MAX_ATTACHMENT_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
export const MAX_ATTACHMENTS_PER_INVOICE = 10;

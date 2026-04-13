import { z } from "zod";
import { FIELD_LIMITS } from "./field-limits";

// Common validation schemas
export const emailSchema = z
  .string()
  .max(FIELD_LIMITS.email, "Имейлът е твърде дълъг")
  .email("Невалиден имейл адрес");

export const passwordSchema = z
  .string()
  .min(8, "Паролата трябва да бъде поне 8 символа")
  .regex(/[A-Z]/, "Паролата трябва да съдържа поне една главна буква")
  .regex(/[0-9]/, "Паролата трябва да съдържа поне една цифра")
  .regex(/[^A-Za-z0-9]/, "Паролата трябва да съдържа поне един специален символ");

// User related schemas
export const userProfileSchema = z.object({
  name: z
    .string()
    .min(2, "Името трябва да е поне 2 символа")
    .max(FIELD_LIMITS.name, "Името е твърде дълго"),
  email: emailSchema,
  phone: z.string().max(FIELD_LIMITS.phone, "Телефонът е твърде дълъг").optional(),
  language: z.string().default("bg"),
});

// Company related schemas
export const companySchema = z.object({
  name: z
    .string()
    .min(2, "Името на фирмата е задължително (минимум 2 символа)")
    .max(FIELD_LIMITS.name, "Името на фирмата е твърде дълго"),
  vat: z.string().min(9, "ДДС номерът трябва да бъде валиден").max(FIELD_LIMITS.phone).optional(),
  email: z.union([z.literal(""), emailSchema]),
  phone: z.string().max(FIELD_LIMITS.phone, "Телефонът е твърде дълъг").optional(),
  address: z
    .string()
    .min(5, "Адресът е задължителен (минимум 5 символа)")
    .max(FIELD_LIMITS.address, "Адресът е твърде дълъг"),
  city: z
    .string()
    .min(2, "Градът е задължителен")
    .max(FIELD_LIMITS.city, "Градът е твърде дълъг"),
  country: z
    .string()
    .min(2, "Страната е задължителна")
    .max(FIELD_LIMITS.country, "Страната е твърде дълга"),
  postalCode: z.string().max(FIELD_LIMITS.postalCode).optional(),
  logoUrl: z.string().url("Невалиден URL за лого").max(2000).optional(),
});

// Client related schemas
export const clientSchema = z.object({
  name: z
    .string()
    .min(2, "Името на клиента е задължително (минимум 2 символа)")
    .max(FIELD_LIMITS.name, "Името е твърде дълго"),
  email: z.union([z.literal(""), emailSchema]),
  phone: z.string().max(FIELD_LIMITS.phone, "Телефонът е твърде дълъг").optional(),
  vat: z.string().max(FIELD_LIMITS.phone).optional(),
  address: z
    .string()
    .min(5, "Адресът е задължителен (минимум 5 символа)")
    .max(FIELD_LIMITS.address, "Адресът е твърде дълъг"),
  city: z
    .string()
    .min(2, "Градът е задължителен")
    .max(FIELD_LIMITS.city, "Градът е твърде дълъг"),
  country: z
    .string()
    .min(2, "Страната е задължителна")
    .max(FIELD_LIMITS.country, "Страната е твърде дълга"),
  postalCode: z.string().max(FIELD_LIMITS.postalCode).optional(),
  notes: z.string().max(FIELD_LIMITS.notes, "Бележките са твърде дълги").optional(),
});

// Product related schemas
export const productSchema = z.object({
  name: z
    .string()
    .min(2, "Името на продукта е задължително (минимум 2 символа)")
    .max(FIELD_LIMITS.name, "Името е твърде дълго"),
  description: z.string().max(FIELD_LIMITS.description, "Описанието е твърде дълго").optional(),
  price: z.number().min(0, "Цената не може да бъде отрицателна"),
  taxRate: z.number().min(0, "ДДС ставката не може да бъде отрицателна").max(100, "ДДС ставката не може да надвишава 100%").default(20),
});

// Invoice related schemas
export const invoiceItemSchema = z.object({
  productId: z.string().optional(),
  description: z
    .string()
    .min(1, "Описанието/името на артикула е задължително")
    .max(FIELD_LIMITS.description, "Описанието на артикула е твърде дълго"),
  quantity: z.number().min(0.01, "Количеството трябва да бъде положително число"),
  price: z.number().min(0.01, "Цената е задължителна и трябва да е положителна"),
  taxRate: z.number().min(0, "ДДС ставката не може да бъде отрицателна").max(100, "ДДС не може да надвишава 100%").default(20),
  vatExemptReason: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.taxRate === 0 && (!data.vatExemptReason || data.vatExemptReason.trim() === "")) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "При ДДС ставка 0% е необходимо основание за освобождаване (напр. чл. 69, ал. 2 ЗДДС)",
      path: ["vatExemptReason"],
    });
  }
});

/** Optional person receiving goods (same buyer client; may differ from client MOL). */
export const invoiceGoodsRecipientSchema = z
  .object({
    name: z.string().max(FIELD_LIMITS.name).optional().or(z.literal("")),
    phone: z.string().max(FIELD_LIMITS.phone).optional().or(z.literal("")),
    mol: z.string().max(FIELD_LIMITS.mol).optional().or(z.literal("")),
  })
  .optional();

export const invoiceSchema = z.object({
  clientId: z.string().min(1, "Клиентът е задължителен"),
  companyId: z.string().min(1, "Фирмата е задължителна"),
  issueDate: z.string().refine(str => !isNaN(Date.parse(str)), "Невалидна дата"),
  dueDate: z.string().refine(str => !isNaN(Date.parse(str)), "Невалидна дата"),
  supplyDate: z.string().refine(str => !isNaN(Date.parse(str)), "Невалидна дата").optional(),
  status: z.enum(['DRAFT', 'ISSUED', 'VOIDED', 'CANCELLED']).default('DRAFT'),
  currency: z.string().optional().default('EUR'),
  locale: z.string().optional().default('bg'),
  placeOfIssue: z.string().optional().default('София'),
  paymentMethod: z.string().optional().default('BANK_TRANSFER'),
  isEInvoice: z.boolean().optional().default(false),
  isOriginal: z.boolean().optional().default(true),
  reverseCharge: z.boolean().default(false),
  items: z.array(invoiceItemSchema).min(1, "Фактурата трябва да има поне един артикул"),
  goodsRecipient: invoiceGoodsRecipientSchema,
  notes: z.string().max(FIELD_LIMITS.notes, "Бележките са твърде дълги").optional(),
  termsAndConditions: z.string().max(FIELD_LIMITS.termsAndConditions, "Условията са твърде дълги").optional(),
}).refine(data => {
  const issueDate = new Date(data.issueDate);
  const dueDate = new Date(data.dueDate);
  return dueDate >= issueDate;
}, {
  message: "Падежната дата трябва да бъде след датата на издаване",
  path: ["dueDate"],
});

// Payment related schemas
export const paymentSchema = z.object({
  invoiceId: z.string().min(1, "Фактурата е задължителна"),
  amount: z.number().min(0.01, "Сумата трябва да бъде положително число"),
  paymentDate: z.string().refine(str => !isNaN(Date.parse(str)), "Невалидна дата на плащане"),
  paymentMethod: z.enum(['BANK_TRANSFER', 'CREDIT_CARD', 'CARD', 'CASH', 'OTHER']),
  notes: z.string().max(FIELD_LIMITS.notes, "Бележките са твърде дълги").optional(),
});

// Settings related schemas
export const emailTemplateSchema = z.object({
  subject: z.string().min(1, "Заглавието е задължително").max(FIELD_LIMITS.subject, "Заглавието е твърде дълго"),
  body: z.string().min(1, "Съдържанието е задължително").max(FIELD_LIMITS.body, "Съдържанието е твърде дълго"),
});

export const userSettingsSchema = z.object({
  language: z.string().default("bg"),
  theme: z.enum(["light", "dark", "system"]).default("system"),
  emailNotifications: z.boolean().default(true),
  dateFormat: z.string().default("DD.MM.YYYY"),
  numberFormat: z.string().default("bg-BG"),
}); 
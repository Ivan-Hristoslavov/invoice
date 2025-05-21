import { z } from "zod";

// Common validation schemas
export const emailSchema = z
  .string()
  .email("Невалиден имейл адрес");

export const passwordSchema = z
  .string()
  .min(8, "Паролата трябва да бъде поне 8 символа")
  .regex(/[A-Z]/, "Паролата трябва да съдържа поне една главна буква")
  .regex(/[0-9]/, "Паролата трябва да съдържа поне една цифра")
  .regex(/[^A-Za-z0-9]/, "Паролата трябва да съдържа поне един специален символ");

// User related schemas
export const userProfileSchema = z.object({
  name: z.string().min(2, "Името е задължително"),
  email: emailSchema,
  phone: z.string().optional(),
  language: z.string().default("bg"),
});

// Company related schemas
export const companySchema = z.object({
  name: z.string().min(2, "Името на фирмата е задължително"),
  vat: z.string().min(9, "ДДС номерът трябва да бъде валиден").optional(),
  email: emailSchema.optional(),
  phone: z.string().optional(),
  address: z.string().min(5, "Адресът е задължителен"),
  city: z.string().min(2, "Градът е задължителен"),
  country: z.string().min(2, "Страната е задължителна"),
  postalCode: z.string().optional(),
  logoUrl: z.string().url().optional(),
});

// Client related schemas
export const clientSchema = z.object({
  name: z.string().min(2, "Името на клиента е задължително"),
  email: emailSchema.optional(),
  phone: z.string().optional(),
  vat: z.string().optional(),
  address: z.string().min(5, "Адресът е задължителен"),
  city: z.string().min(2, "Градът е задължителен"),
  country: z.string().min(2, "Страната е задължителна"),
  postalCode: z.string().optional(),
  notes: z.string().optional(),
});

// Product related schemas
export const productSchema = z.object({
  name: z.string().min(2, "Името на продукта е задължително"),
  description: z.string().optional(),
  price: z.number().min(0, "Цената не може да бъде отрицателна"),
  taxRate: z.number().min(0, "ДДС ставката не може да бъде отрицателна").default(20),
});

// Invoice related schemas
export const invoiceItemSchema = z.object({
  productId: z.string().optional(),
  description: z.string().min(1, "Описанието е задължително"),
  quantity: z.number().min(0.01, "Количеството трябва да бъде положително число"),
  price: z.number().min(0, "Цената не може да бъде отрицателна"),
  taxRate: z.number().min(0, "ДДС ставката не може да бъде отрицателна").default(20),
});

export const invoiceSchema = z.object({
  clientId: z.string().min(1, "Клиентът е задължителен"),
  companyId: z.string().min(1, "Фирмата е задължителна"),
  issueDate: z.string().refine(str => !isNaN(Date.parse(str)), "Невалидна дата"),
  dueDate: z.string().refine(str => !isNaN(Date.parse(str)), "Невалидна дата"),
  status: z.enum(['DRAFT', 'UNPAID', 'PAID', 'OVERDUE', 'CANCELLED']).default('DRAFT'),
  items: z.array(invoiceItemSchema).min(1, "Фактурата трябва да има поне един артикул"),
  notes: z.string().optional(),
  termsAndConditions: z.string().optional(),
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
  paymentDate: z.string().refine(str => !isNaN(Date.parse(str)), "Невалидна дата"),
  paymentMethod: z.enum(['BANK_TRANSFER', 'CARD', 'CASH', 'OTHER']),
  notes: z.string().optional(),
});

// Settings related schemas
export const emailTemplateSchema = z.object({
  subject: z.string().min(1, "Заглавието е задължително"),
  body: z.string().min(1, "Съдържанието е задължително"),
});

export const userSettingsSchema = z.object({
  language: z.string().default("bg"),
  theme: z.enum(["light", "dark", "system"]).default("system"),
  emailNotifications: z.boolean().default(true),
  dateFormat: z.string().default("DD.MM.YYYY"),
  numberFormat: z.string().default("bg-BG"),
}); 
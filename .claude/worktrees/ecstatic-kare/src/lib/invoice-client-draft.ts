import { z } from "zod";
import { validateBulgarianPartyInput } from "@/lib/bulgarian-party";

export const invoiceClientDraftSchema = z.object({
  name: z.string().min(1, "Името на клиента е задължително"),
  email: z.string().email("Моля, въведете валиден имейл").optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  address: z.string().min(1, "Адресът е задължителен за издаване на фактури"),
  city: z.string().min(1, "Градът е задължителен"),
  state: z.string().optional().or(z.literal("")),
  zipCode: z.string().optional().or(z.literal("")),
  country: z.string().min(1, "Държавата е задължителна"),
  vatNumber: z.string().optional().or(z.literal("")),
  taxIdNumber: z.string().optional().or(z.literal("")),
  bulstatNumber: z.string().min(1, "ЕИК/БУЛСТАТ е задължителен"),
  vatRegistered: z.boolean().optional().default(false),
  vatRegistrationNumber: z.string().optional().or(z.literal("")),
  mol: z.string().optional().or(z.literal("")),
  uicType: z.enum(["BULSTAT", "EGN"]).default("BULSTAT"),
  locale: z.string().default("bg"),
}).superRefine((value, ctx) => {
  const { issues } = validateBulgarianPartyInput(value);

  for (const issue of issues) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: issue.path,
      message: issue.message,
    });
  }
});

export type InvoiceClientDraft = z.output<typeof invoiceClientDraftSchema>;
export type InvoiceClientDraftInput = z.input<typeof invoiceClientDraftSchema>;
export type InvoiceClientDraftErrors = Partial<Record<keyof InvoiceClientDraft, string>>;

export const defaultInvoiceClientDraft: InvoiceClientDraftInput = {
  name: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  state: "",
  zipCode: "",
  country: "България",
  vatNumber: "",
  taxIdNumber: "",
  bulstatNumber: "",
  vatRegistered: false,
  vatRegistrationNumber: "",
  mol: "",
  uicType: "BULSTAT",
  locale: "bg",
};

export function validateInvoiceClientDraft(input: InvoiceClientDraftInput): InvoiceClientDraftErrors {
  const result = invoiceClientDraftSchema.safeParse(input);

  if (result.success) return {};

  const errors: InvoiceClientDraftErrors = {};

  for (const issue of result.error.issues) {
    const field = issue.path[0];
    if (!field || typeof field !== "string") continue;
    if (errors[field as keyof InvoiceClientDraft]) continue;
    errors[field as keyof InvoiceClientDraft] = issue.message;
  }

  return errors;
}

export function parseInvoiceClientDraft(input: InvoiceClientDraftInput) {
  return invoiceClientDraftSchema.parse(input);
}

export function mapInvoiceClientApiErrors(
  details?: Array<{ path?: string[]; message?: string }> | null
) {
  const errors: InvoiceClientDraftErrors = {};

  for (const detail of details ?? []) {
    const field = detail.path?.[0];
    if (!field || !detail.message) continue;
    if (errors[field as keyof InvoiceClientDraft]) continue;
    errors[field as keyof InvoiceClientDraft] = detail.message;
  }

  return errors;
}

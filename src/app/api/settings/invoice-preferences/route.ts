import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { getInvoicePreferencesForUser } from "@/lib/invoice-preferences-load";

const invoicePreferencesSchema = z.object({
  defaultVatRate: z.number().min(0).max(100),
  invoicePrefix: z.union([z.string().max(10), z.literal("")]).optional(),
  resetNumberingYearly: z.boolean(),
  startingInvoiceNumber: z
    .number()
    .int()
    .min(1)
    .max(9999999999)
    .nullable()
    .optional(),
  startingVatProtocolNumber: z
    .number()
    .int()
    .min(1)
    .max(9999999999)
    .nullable()
    .optional(),
  defaultCurrency: z.string().min(1).max(8),
  showAmountInWords: z.boolean(),
  defaultTermsAndConditions: z.string().max(1000).optional().nullable(),
  defaultNotes: z.string().max(500).optional().nullable(),
  showCompanyLogo: z.boolean(),
  autoArchiveAfterDays: z.number().min(0),
  keepDraftDays: z.number().min(1),
});

export type InvoicePreferencesJson = {
  invoicePrefix?: string | null;
  resetNumberingYearly?: boolean;
  defaultCurrency?: string;
  showAmountInWords?: boolean;
  defaultTermsAndConditions?: string | null;
  defaultNotes?: string | null;
  showCompanyLogo?: boolean;
  autoArchiveAfterDays?: number;
  keepDraftDays?: number;
  startingVatProtocolNumber?: number | null;
};

function parsePreferencesJson(value: Prisma.JsonValue | null): InvoicePreferencesJson {
  if (value === null || value === undefined) return {};
  if (typeof value !== "object" || Array.isArray(value)) return {};
  return value as InvoicePreferencesJson;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Неоторизиран достъп" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = invoicePreferencesSchema.parse(body);

    const prefixNorm =
      validatedData.invoicePrefix && validatedData.invoicePrefix.trim() !== ""
        ? validatedData.invoicePrefix.trim()
        : null;

    const invoicePreferences: Prisma.InputJsonValue = {
      invoicePrefix: prefixNorm,
      resetNumberingYearly: validatedData.resetNumberingYearly,
      defaultCurrency: validatedData.defaultCurrency,
      showAmountInWords: validatedData.showAmountInWords,
      defaultTermsAndConditions: validatedData.defaultTermsAndConditions ?? null,
      defaultNotes: validatedData.defaultNotes ?? null,
      showCompanyLogo: validatedData.showCompanyLogo,
      autoArchiveAfterDays: validatedData.autoArchiveAfterDays,
      keepDraftDays: validatedData.keepDraftDays,
      startingVatProtocolNumber:
        validatedData.startingVatProtocolNumber === null ||
        validatedData.startingVatProtocolNumber === undefined
          ? null
          : validatedData.startingVatProtocolNumber,
    };

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        defaultVatRate: new Prisma.Decimal(validatedData.defaultVatRate),
        startingInvoiceNumber:
          validatedData.startingInvoiceNumber === null || validatedData.startingInvoiceNumber === undefined
            ? null
            : validatedData.startingInvoiceNumber,
        invoicePreferences,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Невалидни данни", details: error.flatten() },
        { status: 400 }
      );
    }

    console.error("Error saving invoice preferences:", error);
    return NextResponse.json({ error: "Грешка при запазване на настройките" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Неоторизиран достъп" }, { status: 401 });
    }

    const payload = await getInvoicePreferencesForUser(session.user.id);

    if (!payload) {
      return NextResponse.json({ error: "Потребителят не е намерен" }, { status: 404 });
    }

    return NextResponse.json(payload);
  } catch (error) {
    console.error("Error fetching invoice preferences:", error);
    return NextResponse.json({ error: "Грешка при зареждане на настройките" }, { status: 500 });
  }
}

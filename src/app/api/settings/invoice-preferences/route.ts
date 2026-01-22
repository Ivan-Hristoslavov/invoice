import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { z } from "zod";

const invoicePreferencesSchema = z.object({
  defaultVatRate: z.number().min(0).max(100).optional(),
  invoicePrefix: z.string().max(10).optional(),
  resetNumberingYearly: z.boolean().optional(),
  startingInvoiceNumber: z.number().int().min(1).max(9999999999).optional(),
  defaultCurrency: z.string().optional(),
  showAmountInWords: z.boolean().optional(),
  defaultTermsAndConditions: z.string().max(1000).optional(),
  defaultNotes: z.string().max(500).optional(),
  showCompanyLogo: z.boolean().optional(),
  autoArchiveAfterDays: z.number().min(0).optional(),
  keepDraftDays: z.number().min(1).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: "Неоторизиран достъп" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = invoicePreferencesSchema.parse(body);

    const supabase = createAdminClient();

    // Update user's invoice preferences
    const updateData: any = {};

    if (validatedData.defaultVatRate !== undefined) {
      updateData.defaultVatRate = validatedData.defaultVatRate.toString();
    }

    if (validatedData.startingInvoiceNumber !== undefined) {
      updateData.startingInvoiceNumber = validatedData.startingInvoiceNumber;
    }

    // Note: Other preferences like invoicePrefix, resetNumberingYearly, etc.
    // could be stored in a separate UserPreferences table or as JSON in User table
    // For now, we only update the fields that exist in the User model

    const { error } = await supabase
      .from("User")
      .update(updateData)
      .eq("id", session.user.id);

    if (error) {
      console.error("Error updating invoice preferences:", error);
      return NextResponse.json(
        { error: "Грешка при запазване на настройките" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Невалидни данни", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error saving invoice preferences:", error);
    return NextResponse.json(
      { error: "Грешка при запазване на настройките" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: "Неоторизиран достъп" },
        { status: 401 }
      );
    }

    const supabase = createAdminClient();

    const { data: user, error } = await supabase
      .from("User")
      .select("defaultVatRate, startingInvoiceNumber")
      .eq("id", session.user.id)
      .single();

    if (error) {
      console.error("Error fetching invoice preferences:", error);
      return NextResponse.json(
        { error: "Грешка при зареждане на настройките" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      defaultVatRate: user?.defaultVatRate ? Number(user.defaultVatRate) : undefined,
      startingInvoiceNumber: user?.startingInvoiceNumber || undefined,
    });
  } catch (error) {
    console.error("Error fetching invoice preferences:", error);
    return NextResponse.json(
      { error: "Грешка при зареждане на настройките" },
      { status: 500 }
    );
  }
}

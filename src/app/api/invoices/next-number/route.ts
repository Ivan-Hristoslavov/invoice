import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateBulgarianInvoiceNumber } from "@/lib/bulgarian-invoice";
import {
  applyInvoicePrefix,
  getCurrentSequence,
  getInvoicePrefixForUser,
} from "@/lib/invoice-sequence";
import { resolveSessionUser } from "@/lib/session-user";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return new NextResponse("Неоторизиран достъп", { status: 401 });
    }
    const sessionUser = await resolveSessionUser(session.user);
    if (!sessionUser) {
      return new NextResponse("Потребителят не е намерен", { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const requestedCompanyId = searchParams.get("companyId");
    const supabase = createAdminClient();

    let companyQuery = supabase
      .from("Company")
      .select("id, bulstatNumber")
      .eq("userId", sessionUser.id)
      .order("createdAt", { ascending: true })
      .limit(1);

    if (requestedCompanyId) {
      companyQuery = supabase
        .from("Company")
        .select("id, bulstatNumber")
        .eq("id", requestedCompanyId)
        .eq("userId", sessionUser.id)
        .limit(1);
    }

    const { data: companies, error: companyError } = await companyQuery;
    const company = companies?.[0];

    if (companyError || !company) {
      return new NextResponse("Компанията не е намерена", { status: 404 });
    }

    const currentSequence = await getCurrentSequence(sessionUser.id, company.id);
    const baseNumber = generateBulgarianInvoiceNumber(
      currentSequence + 1,
      company.bulstatNumber,
      "invoice"
    );
    const prefix = await getInvoicePrefixForUser(supabase, sessionUser.id);
    const nextNumber = applyInvoicePrefix(baseNumber, prefix);

    return NextResponse.json({ invoiceNumber: nextNumber });
  } catch (error) {
    console.error("Грешка при генериране на номер на фактура:", error);
    const defaultNumber = `${new Date().getFullYear().toString().slice(-2)}0000000001`;
    return NextResponse.json({ invoiceNumber: defaultNumber });
  }
} 
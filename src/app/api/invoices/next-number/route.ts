import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateNextInvoiceNumber } from "@/lib/invoice-number";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return new NextResponse("Неоторизиран достъп", { status: 401 });
    }

    // Invoice numbers are now per-user, 10-digit format (0000000001, 0000000002, etc.)
    // generateNextInvoiceNumber already handles errors internally and returns a default number
    const nextNumber = await generateNextInvoiceNumber(session.user.id as string);

    return NextResponse.json({ invoiceNumber: nextNumber });
  } catch (error) {
    // Fallback: generate a default invoice number if everything fails
    console.error("Грешка при генериране на номер на фактура:", error);
    const defaultNumber = "0000000001";
    return NextResponse.json({ invoiceNumber: defaultNumber });
  }
} 
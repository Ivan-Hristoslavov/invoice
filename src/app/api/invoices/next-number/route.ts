import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateNextInvoiceNumber } from "@/lib/invoice-number";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Get companyId from query params
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("companyId");

    if (!companyId) {
      return new NextResponse("Company ID is required", { status: 400 });
    }

    const nextNumber = await generateNextInvoiceNumber(companyId);

    return NextResponse.json({ invoiceNumber: nextNumber });
  } catch (error) {
    console.error("Error generating invoice number:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
} 
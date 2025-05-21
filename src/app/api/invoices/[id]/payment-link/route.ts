import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createPaymentLink } from "@/lib/services/payment-service";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const paymentLink = await createPaymentLink(params.id);

    return NextResponse.json(paymentLink);
  } catch (error: any) {
    console.error("Error creating payment link:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create payment link" },
      { status: 500 }
    );
  }
} 
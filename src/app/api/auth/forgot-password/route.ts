import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { message: "Имейл адресът е задължителен" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Check if user exists
    const { data: user, error: userError } = await supabase
      .from("User")
      .select("id, email, name")
      .eq("email", email.toLowerCase().trim())
      .single();

    if (userError || !user) {
      // Don't reveal if email exists for security
      return NextResponse.json(
        { message: "Ако този имейл съществува, ще получите линк за възстановяване на паролата" },
        { status: 200 }
      );
    }

    // TODO: Generate reset token and send email
    // For now, just return success
    // In production, you would:
    // 1. Generate a secure token
    // 2. Store it in database with expiration
    // 3. Send email with reset link

    return NextResponse.json(
      { message: "Ако този имейл съществува, ще получите линк за възстановяване на паролата" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { message: "Възникна грешка. Моля, опитайте отново." },
      { status: 500 }
    );
  }
}

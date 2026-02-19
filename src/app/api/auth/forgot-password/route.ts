import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import crypto from "crypto";
import { sendPasswordResetEmail } from "@/lib/email";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request.headers);
    const limiter = rateLimit(`forgot-password:${ip}`, { windowMs: 300_000, maxRequests: 3 });
    if (!limiter.success) {
      return NextResponse.json(
        { message: "Твърде много заявки. Моля, опитайте отново след няколко минути." },
        { status: 429 }
      );
    }

    const { email } = await request.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { message: "Имейл адресът е задължителен" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    const normalizedEmail = email.toLowerCase().trim();

    const { data: user } = await supabase
      .from("User")
      .select("id, email, name")
      .eq("email", normalizedEmail)
      .single();

    if (!user) {
      return NextResponse.json(
        { message: "Ако този имейл съществува, ще получите линк за възстановяване на паролата" },
        { status: 200 }
      );
    }

    // Delete any existing tokens for this user
    await supabase
      .from("PasswordResetToken")
      .delete()
      .eq("userId", user.id);

    // Generate secure token
    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await supabase.from("PasswordResetToken").insert({
      token,
      userId: user.id,
      expires: expires.toISOString(),
    });

    const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const resetUrl = `${baseUrl}/reset-password?token=${token}`;

    await sendPasswordResetEmail({
      to: user.email!,
      name: user.name || "потребител",
      resetUrl,
    });

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

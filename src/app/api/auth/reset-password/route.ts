import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import bcrypt from "bcryptjs";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { getPasswordValidationError } from "@/lib/validation";

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request.headers);
    const limiter = rateLimit(`reset-password:${ip}`, { windowMs: 300_000, maxRequests: 5 });
    if (!limiter.success) {
      return NextResponse.json(
        { message: "Твърде много заявки. Моля, опитайте отново след няколко минути." },
        { status: 429 }
      );
    }

    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json(
        { message: "Токенът и паролата са задължителни" },
        { status: 400 }
      );
    }

    const passwordError = getPasswordValidationError(password);
    if (passwordError) {
      return NextResponse.json(
        { message: passwordError },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    const { data: resetToken, error } = await supabase
      .from("PasswordResetToken")
      .select("id, userId, expires")
      .eq("token", token)
      .single();

    if (error || !resetToken) {
      return NextResponse.json(
        { message: "Невалиден или изтекъл линк за възстановяване" },
        { status: 400 }
      );
    }

    if (new Date(resetToken.expires) < new Date()) {
      await supabase.from("PasswordResetToken").delete().eq("id", resetToken.id);
      return NextResponse.json(
        { message: "Линкът за възстановяване е изтекъл. Моля, заявете нов." },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const { error: updateError } = await supabase
      .from("User")
      .update({ password: hashedPassword })
      .eq("id", resetToken.userId);

    if (updateError) {
      return NextResponse.json(
        { message: "Грешка при обновяване на паролата" },
        { status: 500 }
      );
    }

    // Delete all tokens for this user
    await supabase.from("PasswordResetToken").delete().eq("userId", resetToken.userId);

    return NextResponse.json(
      { message: "Паролата е променена успешно" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { message: "Възникна грешка. Моля, опитайте отново." },
      { status: 500 }
    );
  }
}

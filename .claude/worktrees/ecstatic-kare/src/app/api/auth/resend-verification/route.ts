import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { createEmailVerificationToken } from "@/lib/email-verification";
import { sendVerificationEmail } from "@/lib/email";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { getAppBaseUrl } from "@/lib/app-url";

/**
 * Resend verification email. Only sends if user exists and email is not yet verified.
 * Always returns the same success message to avoid user enumeration.
 */
export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request.headers);
    const limiter = rateLimit(`resend-verification:${ip}`, {
      windowMs: 300_000,
      maxRequests: 3,
    });
    if (!limiter.success) {
      return NextResponse.json(
        {
          message:
            "Твърде много заявки. Моля, изчакайте няколко минути преди да поискате нов имейл.",
        },
        { status: 429 }
      );
    }

    const body = await request.json();
    const email =
      typeof body?.email === "string" ? body.email.trim().toLowerCase() : null;

    if (!email) {
      return NextResponse.json(
        { message: "Имейл адресът е задължителен" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    const { data: user } = await supabase
      .from("User")
      .select("id, name, emailVerified")
      .eq("email", email)
      .maybeSingle();

    // Same response whether user exists or not, and whether already verified or not
    const successMessage =
      "Ако има регистрация с този имейл и тя не е потвърдена, ще получите нов линк за потвърждение.";

    if (!user || user.emailVerified) {
      return NextResponse.json({ message: successMessage }, { status: 200 });
    }

      try {
      const { token } = await createEmailVerificationToken(email);
      const baseUrl = getAppBaseUrl();
      const confirmUrl = `${baseUrl}/confirm-email?token=${token}`;
      await sendVerificationEmail({
        to: email,
        name: user.name || email.split("@")[0],
        confirmUrl,
      });
    } catch (emailErr) {
      console.error("Resend verification email failed:", emailErr);
      // Still return 200 with generic message so we don't leak internal errors
    }

    return NextResponse.json({ message: successMessage }, { status: 200 });
  } catch (error) {
    console.error("Resend verification error:", error);
    return NextResponse.json(
      {
        message: "Възникна грешка. Моля, опитайте отново по-късно.",
      },
      { status: 500 }
    );
  }
}

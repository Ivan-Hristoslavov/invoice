import { NextRequest, NextResponse } from "next/server";
import { consumeEmailVerificationToken, createOneTimeLoginToken } from "@/lib/email-verification";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request.headers);
    const limiter = rateLimit(`confirm-email:${ip}`, {
      windowMs: 300_000,
      maxRequests: 10,
    });
    if (!limiter.success) {
      return NextResponse.json(
        {
          message:
            "Твърде много опити. Моля, изчакайте няколко минути и опитайте отново.",
        },
        { status: 429 }
      );
    }

    const body = await request.json();
    const token = typeof body?.token === "string" ? body.token.trim() : null;

    if (!token) {
      return NextResponse.json(
        { message: "Липсва токен за потвърждение" },
        { status: 400 }
      );
    }

    const email = await consumeEmailVerificationToken(token);

    if (!email) {
      return NextResponse.json(
        {
          message:
            "Линкът е невалиден или е изтекъл. Моля, регистрирайте се отново или поискайте нов имейл за потвърждение.",
        },
        { status: 400 }
      );
    }

    let oneTimeLoginToken: string | null = null;
    try {
      oneTimeLoginToken = await createOneTimeLoginToken(email);
    } catch {
      // Continue without auto-login; user can still sign in with email/password
    }

    return NextResponse.json(
      {
        message: "Имейлът е потвърден. Влизате в акаунта си.",
        email,
        oneTimeLoginToken,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Confirm email error:", error);
    return NextResponse.json(
      { message: "Възникна грешка. Моля, опитайте отново." },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import cuid from "cuid";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/server";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { createEmailVerificationToken } from "@/lib/email-verification";
import { sendVerificationEmail } from "@/lib/email";
import { isValidEmail, getPasswordStrength } from "@/lib/validation";

const registerSchema = z.object({
  name: z.string().min(1, "Името е задължително").max(200),
  email: z.string().min(1, "Имейлът е задължителен").refine(isValidEmail, "Моля, въведете валиден имейл адрес"),
  password: z
    .string()
    .min(8, "Паролата трябва да е поне 8 символа")
    .refine((p) => getPasswordStrength(p).isTooWeak === false, "Изберете по-силна парола (малки и главни букви, цифри, препоръчително и специален символ)"),
});

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req.headers);
    const limiter = rateLimit(`register:${ip}`, { windowMs: 300_000, maxRequests: 5 });
    if (!limiter.success) {
      return NextResponse.json(
        { message: "Твърде много заявки. Моля, опитайте отново след няколко минути." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      const msg = parsed.error.flatten().fieldErrors?.password?.[0]
        ?? parsed.error.flatten().fieldErrors?.email?.[0]
        ?? parsed.error.flatten().fieldErrors?.name?.[0]
        ?? "Невалидни данни";
      return NextResponse.json({ message: msg }, { status: 400 });
    }

    const { name, email, password } = parsed.data;
    const supabase = createAdminClient();

    // Check if user already exists
    const { data: existingUser, error: checkError } = await supabase
      .from("User")
      .select("id, email")
      .eq("email", email)
      .single();

    if (existingUser) {
      return NextResponse.json(
        { message: "Потребител с този имейл вече съществува" },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate CUID for user ID
    const userId = cuid();

    // Create new user
    const { data: user, error: createError } = await supabase
      .from("User")
      .insert({
        id: userId,
        name,
        email,
        password: hashedPassword,
        updatedAt: new Date().toISOString(),
      })
      .select("id, name, email, createdAt, updatedAt, defaultLocale, defaultVatRate")
      .single();

    if (createError) {
      console.error("Грешка при регистрация:", createError);
      return NextResponse.json(
        { message: "Възникна грешка при регистрация", error: createError.message },
        { status: 500 }
      );
    }

    // Send email verification (non-blocking: do not fail register if email fails)
    try {
      const { token } = await createEmailVerificationToken(email);
      const baseUrl =
        process.env.NEXTAUTH_URL ||
        process.env.NEXT_PUBLIC_APP_URL ||
        (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
      const confirmUrl = `${baseUrl}/confirm-email?token=${token}`;
      await sendVerificationEmail({
        to: email,
        name: name || email.split("@")[0],
        confirmUrl,
      });
    } catch (emailErr) {
      console.error("Verification email send failed:", emailErr);
      // Still return 201; user can request a new verification link later if we add that
    }

    return NextResponse.json(
      {
        message:
          "Акаунтът е създаден. Проверете имейла си за линк за потвърждение преди първи вход.",
        user: { id: user.id, name: user.name, email: user.email },
      },
      { status: 201 }
    );
    
  } catch (error) {
    console.error("Грешка при регистрация:", error);
    return NextResponse.json(
      { message: "Възникна грешка при регистрация" },
      { status: 500 }
    );
  }
} 
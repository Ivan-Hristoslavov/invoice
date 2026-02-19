import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import cuid from "cuid";
import { createAdminClient } from "@/lib/supabase/server";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

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

    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { message: "Липсват задължителни полета" },
        { status: 400 }
      );
    }

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

    return NextResponse.json(
      { 
        message: "Потребителят е регистриран успешно", 
        user 
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
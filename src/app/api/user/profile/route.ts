import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/server";
import { authOptions } from "@/lib/auth";

const profileSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
});

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Неоторизиран достъп" },
        { status: 401 }
      );
    }

    const json = await request.json();
    const validated = profileSchema.parse(json);

    const supabase = createAdminClient();
    
    // Check if email is being changed and if it's already taken
    if (validated.email !== session.user.email) {
      const { data: existingUser } = await supabase
        .from("User")
        .select("id")
        .eq("email", validated.email)
        .single();

      if (existingUser && existingUser.id !== session.user.id) {
        return NextResponse.json(
          { error: "Имейлът вече се използва" },
          { status: 400 }
        );
      }
    }

    // Update user profile
    const { data: updatedUser, error: updateError } = await supabase
      .from("User")
      .update({
        name: validated.name,
        email: validated.email,
        updatedAt: new Date().toISOString(),
      })
      .eq("id", session.user.id)
      .select("id, name, email")
      .single();
    
    if (updateError || !updatedUser) {
      throw updateError;
    }

    // Return sanitized user data
    return NextResponse.json({
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Невалидни данни за профила", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Грешка при обновяване на профил:", error);
    return NextResponse.json(
      { error: "Неуспешно обновяване на профил" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Неоторизиран достъп" },
        { status: 401 }
      );
    }

    const supabase = createAdminClient();
    const { data: user, error } = await supabase
      .from("User")
      .select("id, name, email, image, defaultLocale")
      .eq("id", session.user.id)
      .single();

    if (!user) {
      return NextResponse.json(
        { error: "Потребителят не е намерен" },
        { status: 404 }
      );
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Грешка при зареждане на профил:", error);
    return NextResponse.json(
      { error: "Неуспешно зареждане на профил" },
      { status: 500 }
    );
  }
} 
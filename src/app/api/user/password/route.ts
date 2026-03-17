import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase";
import { authOptions } from "@/lib/auth";
import * as bcrypt from "bcryptjs";

const passwordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z
    .string()
    .min(8)
    .regex(/[A-Z]/) // At least one uppercase letter
    .regex(/[a-z]/) // At least one lowercase letter
    .regex(/[0-9]/), // At least one number
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Неоторизиран достъп" },
        { status: 401 }
      );
    }

    const json = await request.json();
    const validated = passwordSchema.parse(json);

    // Get user with password
    const { data: user, error } = await supabaseAdmin
      .from('User')
      .select('id, password')
      .eq('id', session.user.id)
      .single();

    if (error || !user || !user.password) {
      return NextResponse.json(
        { error: "Потребителят не е намерен или няма зададена парола" },
        { status: 404 }
      );
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(
      validated.currentPassword,
      user.password
    );

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Текущата парола е грешна" },
        { status: 400 }
      );
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(validated.newPassword, 10);

    // Update password
    await supabaseAdmin
      .from('User')
      .update({ password: hashedPassword })
      .eq('id', session.user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Невалидни данни за парола", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Грешка при обновяване на парола:", error);
    return NextResponse.json(
      { error: "Неуспешно обновяване на парола" },
      { status: 500 }
    );
  }
}

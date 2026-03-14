import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { resolveSessionUser } from "@/lib/session-user";
import { z } from "zod";

const productSchema = z.object({
  name: z.string().min(1, "Името на продукта е задължително"),
  description: z.string().optional().or(z.literal("")),
  price: z.number().nonnegative("Цената трябва да бъде положително число"),
  unit: z.string().min(1, "Единицата е задължителна"),
  taxRate: z.number().nonnegative("Данъчната ставка трябва да бъде положително число").default(0),
});

// GET - Взима един продукт по ID
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Неоторизиран достъп" },
        { status: 401 }
      );
    }

    const sessionUser = await resolveSessionUser(session.user);
    if (!sessionUser) {
      return NextResponse.json(
        { error: "Сесията ви е невалидна. Моля, влезте отново." },
        { status: 401 }
      );
    }

    // Получаване на ID параметър по правилния асинхронен начин
    const productId = (await context.params).id;

    const supabase = createAdminClient();
    const { data: product, error } = await supabase
      .from("Product")
      .select("*")
      .eq("id", productId)
      .eq("userId", sessionUser.id)
      .single();
    
    if (error || !product) {
      return NextResponse.json(
        { error: "Продуктът не е намерен" },
        { status: 404 }
      );
    }

    if (!product) {
      return NextResponse.json(
        { error: "Продуктът не е намерен" },
        { status: 404 }
      );
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error("Грешка при извличане на продукт:", error);
    return NextResponse.json(
      { error: "Неуспешно извличане на продукт" },
      { status: 500 }
    );
  }
}

// PUT - Обновява съществуващ продукт
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Неоторизиран достъп" },
        { status: 401 }
      );
    }

    const sessionUser = await resolveSessionUser(session.user);
    if (!sessionUser) {
      return NextResponse.json(
        { error: "Сесията ви е невалидна. Моля, влезте отново." },
        { status: 401 }
      );
    }

    // Получаване на ID параметър по правилния асинхронен начин
    const productId = (await context.params).id;
    const json = await request.json();

    // Валидиране на данните
    const validated = productSchema.parse(json);

    const supabase = createAdminClient();
    
    // Проверка дали продуктът съществува и принадлежи на потребителя
    const { data: existingProduct, error: checkError } = await supabase
      .from("Product")
      .select("*")
      .eq("id", productId)
      .eq("userId", sessionUser.id)
      .single();

    if (checkError || !existingProduct) {
      return NextResponse.json(
        { error: "Продуктът не е намерен" },
        { status: 404 }
      );
    }

    // Обновяване на продукта
    const { data: updatedProduct, error: updateError } = await supabase
      .from("Product")
      .update({
        name: validated.name,
        description: validated.description || null,
        price: validated.price,
        unit: validated.unit,
        taxRate: validated.taxRate,
        updatedAt: new Date().toISOString(),
      })
      .eq("id", productId)
      .select()
      .single();
    
    if (updateError || !updatedProduct) {
      throw updateError;
    }

    return NextResponse.json(updatedProduct);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Невалидни данни за продукта", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Грешка при обновяване на продукт:", error);
    return NextResponse.json(
      { error: "Неуспешно обновяване на продукт" },
      { status: 500 }
    );
  }
}

// DELETE - Изтрива продукт
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Неоторизиран достъп" },
        { status: 401 }
      );
    }

    const sessionUser = await resolveSessionUser(session.user);
    if (!sessionUser) {
      return NextResponse.json(
        { error: "Сесията ви е невалидна. Моля, влезте отново." },
        { status: 401 }
      );
    }

    // Получаване на ID параметър по правилния асинхронен начин
    const productId = (await context.params).id;

    const supabase = createAdminClient();
    
    // Проверка дали продуктът съществува и принадлежи на потребителя
    const { data: existingProduct, error: checkError } = await supabase
      .from("Product")
      .select("*")
      .eq("id", productId)
      .eq("userId", sessionUser.id)
      .single();

    if (checkError || !existingProduct) {
      return NextResponse.json(
        { error: "Продуктът не е намерен" },
        { status: 404 }
      );
    }

    // Изтриване на продукта
    const { error: deleteError } = await supabase
      .from("Product")
      .delete()
      .eq("id", productId);
    
    if (deleteError) {
      throw deleteError;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Грешка при изтриване на продукт:", error);
    return NextResponse.json(
      { error: "Неуспешно изтриване на продукт" },
      { status: 500 }
    );
  }
} 
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
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
  context: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Неоторизиран достъп" },
        { status: 401 }
      );
    }

    // Получаване на ID параметър по правилния асинхронен начин
    const productId = context.params.id;

    const product = await prisma.product.findUnique({
      where: {
        id: productId,
        userId: session.user.id,
      },
    });

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
  context: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Неоторизиран достъп" },
        { status: 401 }
      );
    }

    // Получаване на ID параметър по правилния асинхронен начин
    const productId = context.params.id;
    const json = await request.json();

    // Валидиране на данните
    const validated = productSchema.parse(json);

    // Проверка дали продуктът съществува и принадлежи на потребителя
    const existingProduct = await prisma.product.findUnique({
      where: {
        id: productId,
        userId: session.user.id,
      },
    });

    if (!existingProduct) {
      return NextResponse.json(
        { error: "Продуктът не е намерен" },
        { status: 404 }
      );
    }

    // Обновяване на продукта
    const updatedProduct = await prisma.product.update({
      where: {
        id: productId,
      },
      data: {
        name: validated.name,
        description: validated.description || "",
        price: validated.price,
        unit: validated.unit,
        taxRate: validated.taxRate,
      },
    });

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
  context: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Неоторизиран достъп" },
        { status: 401 }
      );
    }

    // Получаване на ID параметър по правилния асинхронен начин
    const productId = context.params.id;

    // Проверка дали продуктът съществува и принадлежи на потребителя
    const existingProduct = await prisma.product.findUnique({
      where: {
        id: productId,
        userId: session.user.id,
      },
    });

    if (!existingProduct) {
      return NextResponse.json(
        { error: "Продуктът не е намерен" },
        { status: 404 }
      );
    }

    // Изтриване на продукта
    await prisma.product.delete({
      where: {
        id: productId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Грешка при изтриване на продукт:", error);
    return NextResponse.json(
      { error: "Неуспешно изтриване на продукт" },
      { status: 500 }
    );
  }
} 
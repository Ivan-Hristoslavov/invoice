import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/server";
import { authOptions } from "@/lib/auth";
import { resolveSessionUser } from "@/lib/session-user";
import { FIELD_LIMITS } from "@/lib/validations/field-limits";
import cuid from "cuid";

const productSchema = z.object({
  name: z
    .string()
    .min(2, "Името на продукта е задължително (минимум 2 символа)")
    .max(FIELD_LIMITS.name, "Името на продукта е твърде дълго"),
  description: z.string().max(FIELD_LIMITS.description, "Описанието е твърде дълго").optional().or(z.literal("")),
  price: z.number().min(0, "Цената не може да бъде отрицателна"),
  unit: z.string().min(1, "Единицата е задължителна").max(50, "Единицата е твърде дълга"),
  taxRate: z.number().min(0, "ДДС ставката не може да бъде отрицателна").max(100, "ДДС не може да надвишава 100%").default(20),
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

    const sessionUser = await resolveSessionUser(session.user);
    if (!sessionUser) {
      return NextResponse.json(
        { error: "Сесията ви е невалидна. Моля, влезте отново." },
        { status: 401 }
      );
    }

    // Check subscription limits - брой продукти
    const { checkSubscriptionLimits } = await import("@/middleware/subscription");
    const productLimitCheck = await checkSubscriptionLimits(
      sessionUser.id,
      'products'
    );
    
    if (!productLimitCheck.allowed) {
      return NextResponse.json(
        { error: productLimitCheck.message || "Достигнат е лимитът за продукти за вашия план" },
        { status: 403 }
      );
    }

    const json = await request.json();
    const validated = productSchema.parse(json);

    const supabase = createAdminClient();
    const productId = cuid();
    
    const { data: product, error } = await supabase
      .from("Product")
      .insert({
        id: productId,
        name: validated.name,
        description: validated.description || null,
        price: validated.price,
        unit: validated.unit,
        taxRate: validated.taxRate,
        userId: sessionUser.id,
        isActive: true,
        updatedAt: new Date().toISOString(),
      })
      .select()
      .single();
    
    if (error) {
      throw error;
    }

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const details = error.errors.map((e) => ({
        path: e.path.map(String),
        message: e.message,
      }));
      return NextResponse.json(
        { error: "Невалидни данни за продукта. Моля, проверете полетата.", details },
        { status: 400 }
      );
    }

    console.error("Грешка при създаване на продукт:", error);
    return NextResponse.json(
      { error: "Неуспешно създаване на продукт. Моля, опитайте отново." },
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

    const sessionUser = await resolveSessionUser(session.user);
    if (!sessionUser) {
      return NextResponse.json(
        { error: "Сесията ви е невалидна. Моля, влезте отново." },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const rawQuery = searchParams.get("query") || "";
    const query = rawQuery.slice(0, FIELD_LIMITS.searchQuery).trim().replace(/[%_]/g, " ");
    const page = parseInt(searchParams.get("page") || "0");
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") || "12")));

    const supabase = createAdminClient();

    const includeInactive =
      searchParams.get("includeInactive") === "true" ||
      searchParams.get("includeInactive") === "1";

    let productQuery = supabase
      .from("Product")
      .select("*", { count: "exact" })
      .eq("userId", sessionUser.id);

    // By default, return only active products. Admin UIs can pass
    // ?includeInactive=true to see archived ones as well.
    if (!includeInactive) {
      productQuery = productQuery.eq("isActive", true);
    }

    if (query) {
      productQuery = productQuery.or(
        `name.ilike.%${query}%,description.ilike.%${query}%`
      );
    }

    productQuery = productQuery.order("name", { ascending: true });

    if (page > 0) {
      const skip = (page - 1) * pageSize;
      productQuery = productQuery.range(skip, skip + pageSize - 1);
    }

    const { data: products, count, error } = await productQuery;

    if (error) {
      throw error;
    }

    if (page > 0) {
      return NextResponse.json({
        data: products || [],
        meta: {
          page,
          pageSize,
          totalItems: count || 0,
          totalPages: Math.ceil((count || 0) / pageSize),
        },
      });
    }

    return NextResponse.json(products || []);
  } catch (error) {
    console.error("Грешка при извличане на продукти:", error);
    return NextResponse.json([]);
  }
} 
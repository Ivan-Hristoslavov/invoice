import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/server";
import { authOptions } from "@/lib/auth";
import cuid from "cuid";

const productSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.number().nonnegative(),
  unit: z.string().min(1),
  taxRate: z.number().nonnegative().default(0),
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

    // Check subscription limits - брой продукти
    const { checkSubscriptionLimits } = await import("@/middleware/subscription");
    const productLimitCheck = await checkSubscriptionLimits(
      session.user.id as string,
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
        userId: session.user.id,
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
      return NextResponse.json(
        { error: "Невалидни данни за продукта", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Грешка при създаване на продукт:", error);
    return NextResponse.json(
      { error: "Неуспешно създаване на продукт" },
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

    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("query") || "";
    const page = parseInt(searchParams.get("page") || "0");
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") || "12")));

    const supabase = createAdminClient();

    let productQuery = supabase
      .from("Product")
      .select("*", { count: "exact" })
      .eq("userId", session.user.id);

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
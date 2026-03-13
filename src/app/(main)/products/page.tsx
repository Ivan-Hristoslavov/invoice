import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { APP_NAME } from "@/config/constants";
import { createAdminClient } from "@/lib/supabase/server";
import { resolveSessionUser } from "@/lib/session-user";
import { redirect } from "next/navigation";
import { PLAN_LIMITS } from "@/middleware/subscription";
import ProductsClient from "./ProductsClient";

export const metadata: Metadata = {
  title: `Продукти | ${APP_NAME}`,
  description: "Управлявайте вашите продукти и услуги",
};

export default async function ProductsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/signin");
  }

  const sessionUser = await resolveSessionUser(session.user);
  if (!sessionUser) {
    redirect("/signin");
  }

  const supabase = createAdminClient();
  const { data: products, error } = await supabase
    .from("Product")
    .select("*")
    .eq("userId", sessionUser.id)
    .order("name", { ascending: true });
  
  if (error) {
    console.error("Error fetching products:", error);
  }
  
  const productsList = (products || []).map((p: any) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    price: Number(p.price),
    unit: p.unit,
    taxRate: Number(p.taxRate),
  }));

  // Get user's subscription plan
  const { data: subscriptions } = await supabase
    .from("Subscription")
    .select("*")
    .eq("userId", sessionUser.id)
    .in("status", ["ACTIVE", "TRIALING", "PAST_DUE"])
    .limit(1);
  
  const subscription = subscriptions && subscriptions.length > 0 ? subscriptions[0] : null;
  const plan = (subscription?.plan || "FREE") as keyof typeof PLAN_LIMITS;
  const limits = PLAN_LIMITS[plan];
  const productLimit = limits.maxProducts === Infinity ? -1 : limits.maxProducts;
  const canCreateProduct = productLimit === -1 || productsList.length < productLimit;
  const productsRemaining = productLimit === -1 ? Infinity : productLimit - productsList.length;
  const isApproachingLimit = productLimit !== -1 && productsRemaining > 0 && productsRemaining <= 2;
  const isAtLimit = productLimit !== -1 && productsRemaining <= 0;

  return (
    <ProductsClient 
      products={productsList}
      plan={plan}
      productLimit={productLimit}
      canCreateProduct={canCreateProduct}
      productsRemaining={productsRemaining === Infinity ? -1 : productsRemaining}
      isApproachingLimit={isApproachingLimit}
      isAtLimit={isAtLimit}
    />
  );
}

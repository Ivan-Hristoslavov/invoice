import Link from "next/link";
import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Package, Plus, Search, Tag, ArrowUpRight, Euro, Percent, Lock, AlertTriangle, XCircle, Crown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { CardStatsMetric } from "@/components/ui/CardStatsMetric";
import { Button } from "@/components/ui/button";
import { Button as RadixButton } from "@radix-ui/themes";
import { Badge } from "@/components/ui/badge";
import { APP_NAME } from "@/config/constants";
import { createAdminClient } from "@/lib/supabase/server";
import { Input } from "@/components/ui/input";
import { redirect } from "next/navigation";
import { PLAN_LIMITS } from "@/middleware/subscription";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { UsageCounter } from "@/components/ui/pro-feature-lock";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  unit: string;
  taxRate: number;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export const metadata: Metadata = {
  title: `Продукти | ${APP_NAME}`,
  description: "Управлявайте вашите продукти и услуги",
};

export default async function ProductsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/signin");
  }

  const supabase = createAdminClient();
  const { data: products, error } = await supabase
    .from("Product")
    .select("*")
    .eq("userId", session.user.id)
    .order("name", { ascending: true });
  
  if (error) {
    console.error("Error fetching products:", error);
  }
  
  const productsList = (products || []).map((p: any) => ({
    ...p,
    price: Number(p.price),
    taxRate: Number(p.taxRate),
  }));

  // Calculate stats
  const totalProducts = productsList.length;
  const avgPrice = totalProducts > 0 
    ? productsList.reduce((sum: number, p: Product) => sum + p.price, 0) / totalProducts 
    : 0;
  const withTax = productsList.filter((p: Product) => p.taxRate > 0).length;

  // Get user's subscription plan
  const { data: subscriptions } = await supabase
    .from("Subscription")
    .select("*")
    .eq("userId", session.user.id)
    .in("status", ["ACTIVE", "TRIALING", "PAST_DUE"])
    .limit(1);
  
  const subscription = subscriptions && subscriptions.length > 0 ? subscriptions[0] : null;
  const plan = (subscription?.plan || "FREE") as keyof typeof PLAN_LIMITS;
  const limits = PLAN_LIMITS[plan];
  const productLimit = limits.maxProducts === Infinity ? -1 : limits.maxProducts;
  const canCreateProduct = productLimit === -1 || totalProducts < productLimit;
  const productsRemaining = productLimit === -1 ? Infinity : productLimit - totalProducts;
  const isApproachingLimit = productLimit !== -1 && productsRemaining > 0 && productsRemaining <= 2;
  const isAtLimit = productLimit !== -1 && productsRemaining <= 0;

  // Generate gradient based on product name
  const getGradient = (name: string) => {
    const gradients = [
      "from-emerald-500 to-teal-600",
      "from-blue-500 to-indigo-600",
      "from-slate-500 to-slate-600",
      "from-amber-500 to-orange-600",
      "from-cyan-500 to-teal-600",
      "from-cyan-500 to-blue-600",
    ];
    const index = name.charCodeAt(0) % gradients.length;
    return gradients[index];
  };

  return (
    <div className="space-y-6">
      {/* Soft Upgrade Prompts */}
      {isApproachingLimit && (
        <Alert className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="flex items-center justify-between">
            <span className="text-amber-800 dark:text-amber-200">
              {productsRemaining === 1 ? (
                <>Остава ви само <strong>1 продукт</strong> в {plan} плана.</>
              ) : (
                <>Остават ви само <strong>{productsRemaining} продукта</strong> в {plan} плана.</>
              )}
              {' '}Надградете за повече продукти.
            </span>
            <Link href="/settings/subscription">
              <Button size="sm" variant="outline" className="ml-4 border-amber-300 text-amber-700 hover:bg-amber-100">
                <Crown className="h-4 w-4 mr-2" />
                Надградете
              </Button>
            </Link>
          </AlertDescription>
        </Alert>
      )}
      
      {isAtLimit && (
        <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/30">
          <XCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="flex items-center justify-between">
            <span className="text-red-800 dark:text-red-200">
              Достигнахте лимита от <strong>{productLimit} продукта</strong> за {plan} плана.
              {plan === 'FREE' && ' Надградете до STARTER за до 50 продукта или до PRO за до 200.'}
              {plan === 'STARTER' && ' Надградете до PRO за до 200 продукта или до BUSINESS за неограничени.'}
              {plan === 'PRO' && ' Надградете до BUSINESS за неограничени продукти.'}
            </span>
            <Link href="/settings/subscription">
              <Button size="sm" className="ml-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white">
                <Crown className="h-4 w-4 mr-2" />
                Надградете
              </Button>
            </Link>
          </AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">Продукти</h1>
            {productLimit !== -1 && (
              <UsageCounter 
                used={totalProducts} 
                limit={productLimit}
                label=""
              />
            )}
          </div>
          <p className="text-muted-foreground mt-1">
            Управлявайте вашите продукти и услуги
          </p>
        </div>
        {canCreateProduct ? (
          <RadixButton 
            asChild 
            size="3" 
            variant="solid" 
            color="green"
            className="shadow-lg"
          >
            <Link href="/products/new">
              <Plus className="mr-2 h-5 w-5" />
              Нов продукт
            </Link>
          </RadixButton>
        ) : (
          <RadixButton 
            asChild 
            size="3" 
            variant="soft" 
            color="gray"
            className="shadow-lg"
          >
            <Link href="/settings/subscription">
              <Lock className="mr-2 h-4 w-4" />
              Надграждане за повече продукти
            </Link>
          </RadixButton>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <CardStatsMetric
          title="Общо продукти"
          value={totalProducts}
          icon={Package}
          gradient="from-emerald-500 to-teal-600"
        />
        <CardStatsMetric
          title="Средна цена"
          value={avgPrice.toFixed(2)}
          valueSuffix="€"
          icon={Euro}
          gradient="from-blue-500 to-indigo-600"
        />
        <CardStatsMetric
          title="С ДДС"
          value={withTax}
          valueClassName="text-violet-600"
          icon={Percent}
          gradient="from-slate-500 to-slate-600"
        />
      </div>

      {/* Search */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input 
              placeholder="Търсене по име или описание..." 
              className="pl-10 h-11 border-border"
            />
          </div>
        </CardContent>
      </Card>

      {/* Products Grid */}
      {productsList.length === 0 ? (
        <Card className="border-0 shadow-lg">
          <CardContent className="py-16">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Package className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-1">Все още нямате продукти</h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-sm">
                Добавете първия си продукт или услуга, за да ги използвате във фактурите
              </p>
              <Button asChild>
                <Link href="/products/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Добави първия продукт
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {productsList.map((product: Product) => (
            <Link key={product.id} href={`/products/${product.id}`}>
              <Card className="h-full border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${getGradient(product.name)} flex items-center justify-center shadow-lg`}>
                      <Package className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold truncate group-hover:text-primary transition-colors">
                            {product.name}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              <Tag className="h-3 w-3 mr-1" />
                              {product.unit}
                            </Badge>
                          </div>
                        </div>
                        <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      
                      {product.description && (
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                          {product.description}
                        </p>
                      )}
                      
                      <div className="mt-4 pt-3 border-t flex items-center justify-between">
                        <div>
                          <span className="text-xl font-bold">
                            {product.price.toFixed(2)}
                          </span>
                          <span className="text-sm text-muted-foreground ml-1">€</span>
                        </div>
                        {product.taxRate > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            +{product.taxRate}% ДДС
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

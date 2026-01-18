import Link from "next/link";
import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Package, Plus, Search, Tag, ArrowUpRight, Euro, Percent } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Button as RadixButton } from "@radix-ui/themes";
import { Badge } from "@/components/ui/badge";
import { APP_NAME } from "@/config/constants";
import { createAdminClient } from "@/lib/supabase/server";
import { Input } from "@/components/ui/input";
import { redirect } from "next/navigation";

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
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Продукти</h1>
          <p className="text-muted-foreground mt-1">
            Управлявайте вашите продукти и услуги
          </p>
        </div>
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
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-500/5 to-teal-600/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Общо продукти</p>
                <p className="text-2xl font-bold">{totalProducts}</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <Package className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500/5 to-indigo-600/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Средна цена</p>
                <p className="text-2xl font-bold">{avgPrice.toFixed(2)} лв</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                <Euro className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-lg bg-gradient-to-br from-slate-500/5 to-slate-600/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">С ДДС</p>
                <p className="text-2xl font-bold text-violet-600">{withTax}</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-slate-500 to-slate-600 flex items-center justify-center">
                <Percent className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
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
                          <span className="text-sm text-muted-foreground ml-1">лв</span>
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

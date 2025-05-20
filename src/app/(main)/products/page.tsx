import Link from "next/link";
import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Package, Plus, Search, Tag } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { APP_NAME } from "@/config/constants";
import { prisma } from "@/lib/db";
import { Input } from "@/components/ui/input";
import { Decimal } from "@prisma/client/runtime/library";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: Decimal;
  unit: string;
  taxRate: Decimal;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export const metadata: Metadata = {
  title: `Продукти | ${APP_NAME}`,
  description: "Управлявайте вашите продукти и услуги",
};

export default async function ProductsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Достъпът е отказан</h2>
          <p className="text-muted-foreground mb-6">
            Моля, влезте в системата, за да имате достъп до продуктите
          </p>
          <Button asChild>
            <Link href="/signin">Вход</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Fetch products from database
  const products = await prisma.product.findMany({
    where: { userId: session.user.id },
    orderBy: { name: "asc" },
  });

  // Default currency for all products
  const defaultCurrency = "BGN";

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Продукти</h1>
        <Button asChild>
          <Link href="/products/new">
            <Plus className="mr-2 h-4 w-4" /> Добавяне на продукт
          </Link>
        </Button>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Търсене на продукти..." className="pl-10" />
        </div>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-12">
          <Package className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
          <h3 className="mt-4 text-lg font-semibold">
            Все още нямате продукти
          </h3>
          <p className="mt-2 text-muted-foreground">
            Добавете първия си продукт, за да започнете да създавате фактури
          </p>
          <Button className="mt-4" asChild>
            <Link href="/products/new">
              <Plus className="mr-2 h-4 w-4" /> Добавяне на продукт
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {products.map((product: Product) => (
            <Link key={product.id} href={`/products/${product.id}`}>
              <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <Package className="h-5 w-5" />
                      </span>
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-medium">{product.name}</h3>
                      {product.description && (
                        <p className="text-sm text-muted-foreground">
                          {product.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">
                          {defaultCurrency === "BGN"
                            ? "лв. "
                            : defaultCurrency === "EUR"
                            ? "€"
                            : defaultCurrency === "GBP"
                            ? "£"
                            : "$"}
                          {Number(product.price).toFixed(2)}
                        </p>
                        {product.taxRate && Number(product.taxRate) > 0 && (
                          <span className="text-xs bg-muted px-2 py-0.5 rounded-full">
                            +{Number(product.taxRate)}% данък
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        <Tag className="h-3 w-3" />
                        За {product.unit}
                      </p>
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

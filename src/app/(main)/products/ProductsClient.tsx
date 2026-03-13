"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Search, Lock, AlertTriangle, XCircle, Crown, LayoutGrid, List, Euro, Percent, Package } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { CardStatsMetric } from "@/components/ui/CardStatsMetric";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { UsageCounter } from "@/components/ui/pro-feature-lock";
import { Pagination } from "@/components/ui/pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  unit: string;
  taxRate: number;
}

interface ProductsClientProps {
  products: Product[];
  plan: string;
  productLimit: number;
  canCreateProduct: boolean;
  productsRemaining: number;
  isApproachingLimit: boolean;
  isAtLimit: boolean;
}

export default function ProductsClient({
  products,
  plan,
  productLimit,
  canCreateProduct,
  productsRemaining,
  isApproachingLimit,
  isAtLimit,
}: ProductsClientProps) {
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => { setCurrentPage(1); }, [searchQuery]);

  const filteredProducts = products.filter((product) => {
    const query = searchQuery.toLowerCase();
    return (
      product.name.toLowerCase().includes(query) ||
      product.description?.toLowerCase().includes(query)
    );
  });

  const ITEMS_PER_PAGE = 12;
  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Calculate stats
  const totalProducts = products.length;
  const avgPrice = totalProducts > 0 
    ? products.reduce((sum, p) => sum + p.price, 0) / totalProducts 
    : 0;
  const withTax = products.filter((p) => p.taxRate > 0).length;

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
            <Link href="/settings/subscription" className="flex items-center whitespace-nowrap">
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
            <Link href="/settings/subscription" className="flex items-center whitespace-nowrap">
              <Button size="sm" className="ml-4 bg-linear-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white">
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
          <Button 
            asChild 
            size="3" 
            variant="solid" 
            color="green"
            className="shadow-lg"
          >
            <Link href="/products/new" className="flex items-center whitespace-nowrap">
              <Plus className="mr-2 h-5 w-5" />
              Нов продукт
            </Link>
          </Button>
        ) : (
          <Button 
            asChild 
            size="3" 
            variant="soft" 
            color="gray"
            className="shadow-lg"
          >
            <Link href="/settings/subscription" className="flex items-center whitespace-nowrap">
              <Lock className="mr-2 h-4 w-4" />
              Надграждане за повече продукти
            </Link>
          </Button>
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

      {/* Search & View Toggle */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input 
                placeholder="Търсене по име или описание..." 
                className="pl-10 h-11 border-border"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-1 p-1 rounded-lg bg-muted/50">
              <Button
                variant={viewMode === "cards" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("cards")}
                className="h-9 px-3"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "table" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("table")}
                className="h-9 px-3"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Empty State */}
      {filteredProducts.length === 0 ? (
        <Card className="border-0 shadow-lg">
          <CardContent className="py-16">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Package className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-1">
                {searchQuery ? "Няма намерени продукти" : "Все още нямате продукти"}
              </h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-sm">
                {searchQuery 
                  ? "Опитайте с друга ключова дума" 
                  : "Добавете първия си продукт или услуга, за да ги използвате във фактурите"}
              </p>
              {!searchQuery && (
                <Button asChild>
                  <Link href="/products/new" className="flex items-center whitespace-nowrap">
                    <Plus className="mr-2 h-4 w-4" />
                    Добави първия продукт
                  </Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : viewMode === "cards" ? (
        /* Cards View */
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {paginatedProducts.map((product) => (
            <Link key={product.id} href={`/products/${product.id}`}>
              <Card className="h-full min-h-[120px] border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group cursor-pointer">
                <CardContent className="p-5 h-full flex flex-col items-center text-center">
                  {/* Name */}
                  <h3 className="font-semibold group-hover:text-primary transition-colors truncate w-full">
                    {product.name}
                  </h3>
                  
                  {/* Description */}
                  {product.description && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-1 w-full">
                      {product.description}
                    </p>
                  )}
                  
                  {/* Price */}
                  <div className="mt-auto pt-3 w-full border-t flex items-center justify-center gap-2">
                    <span className="text-lg font-bold">
                      {product.price.toFixed(2)} €
                    </span>
                    <span className="text-xs text-muted-foreground">/ {product.unit}</span>
                    {product.taxRate > 0 && (
                      <Badge variant="secondary" className="text-xs ml-1">
                        {product.taxRate}%
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        /* Table View */
        <Card className="border-0 shadow-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-border/50">
                <TableHead className="font-medium text-muted-foreground">Продукт</TableHead>
                <TableHead className="font-medium text-muted-foreground">Описание</TableHead>
                <TableHead className="font-medium text-muted-foreground text-right">Цена</TableHead>
                <TableHead className="font-medium text-muted-foreground text-center">Единица</TableHead>
                <TableHead className="font-medium text-muted-foreground text-center">ДДС</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedProducts.map((product) => (
                <TableRow 
                  key={product.id} 
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => window.location.href = `/products/${product.id}`}
                >
                  <TableCell>
                    <span className="font-medium">{product.name}</span>
                  </TableCell>
                  <TableCell className="text-muted-foreground max-w-[200px] truncate">
                    {product.description || "-"}
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {product.price.toFixed(2)} €
                  </TableCell>
                  <TableCell className="text-center text-muted-foreground">
                    {product.unit}
                  </TableCell>
                  <TableCell className="text-center">
                    {product.taxRate > 0 ? (
                      <Badge variant="secondary" className="text-xs">
                        {product.taxRate}%
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-sm text-muted-foreground">
            {(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filteredProducts.length)} от {filteredProducts.length} продукта
          </p>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            size="sm"
          />
        </div>
      )}
    </div>
  );
}

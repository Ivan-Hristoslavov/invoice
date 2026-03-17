"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Search, Lock, LayoutGrid, List, Euro, Percent, Package } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { CardStatsMetric } from "@/components/ui/CardStatsMetric";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { UsageCounter, LimitBanner } from "@/components/ui/pro-feature-lock";
import { EmptyState } from "@/components/ui/empty-state";
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
  isActive?: boolean;
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
    <div className="space-y-4 sm:space-y-6">
      {/* Soft Upgrade Prompts */}
      {isApproachingLimit && (
        <LimitBanner
          variant="warning"
          message={productsRemaining === 1
            ? <><strong>Остава 1 продукт</strong> в плана. Надградете за неограничени артикули.</>
            : <><strong>Остават {productsRemaining} продукта</strong> в плана. Надградете за неограничени артикули.</>
          }
        />
      )}

      {isAtLimit && (
        <LimitBanner
          variant="error"
          message={<>Лимитът за продукти е достигнат. Надградете за неограничени артикули.</>}
        />
      )}

      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Продукти</h1>
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
            className="h-11 w-full shadow-lg sm:h-auto sm:w-auto"
          >
            <Link href="/products/new" className="flex items-center whitespace-nowrap">
              <Plus className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
              Нов продукт
            </Link>
          </Button>
        ) : (
          <Button 
            asChild 
            size="3" 
            variant="soft" 
            color="gray"
            className="h-11 w-full shadow-lg sm:h-auto sm:w-auto"
          >
            <Link href="/settings/subscription" className="flex items-center whitespace-nowrap">
              <Lock className="mr-2 h-4 w-4" />
              Надграждане за повече продукти
            </Link>
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-4">
        <CardStatsMetric
          title="Общо продукти"
          value={totalProducts}
          icon={Package}
          gradient="from-emerald-500 to-teal-600"
        />
        <CardStatsMetric
          title="Средна цена"
          value={formatPrice(avgPrice)}
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
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input 
                placeholder="Търсене по име или описание..." 
                className="pl-10 h-11 border-border"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="hidden items-center gap-1 rounded-lg bg-muted/50 p-1 sm:flex">
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
          <CardContent className="p-0">
            <EmptyState
              icon={Package}
              heading={searchQuery ? "Няма намерени продукти" : "Все още нямате продукти"}
              description={searchQuery ? "Опитайте с друга ключова дума" : "Добавете първия си продукт или услуга, за да ги използвате във фактурите"}
              action={!searchQuery ? (
                <Button asChild>
                  <Link href="/products/new" className="flex items-center whitespace-nowrap">
                    <Plus className="mr-2 h-4 w-4" />
                    Добави първия продукт
                  </Link>
                </Button>
              ) : undefined}
            />
          </CardContent>
        </Card>
      ) : viewMode === "cards" ? (
        /* Cards View */
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {paginatedProducts.map((product) => (
            <Link key={product.id} href={`/products/${product.id}`}>
              <Card className="group h-full min-h-[112px] cursor-pointer border-0 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
                <CardContent className="flex h-full flex-col items-center p-4 text-center sm:p-5">
                  {/* Name */}
                  <div className="flex w-full items-center justify-center gap-2">
                    <h3 className="truncate text-sm font-semibold transition-colors group-hover:text-primary sm:text-base">
                      {product.name}
                    </h3>
                    {product.isActive === false && (
                      <Badge variant="outline" className="text-[10px] uppercase tracking-wide">
                        Архивиран
                      </Badge>
                    )}
                  </div>
                  
                  {/* Description */}
                  {product.description && (
                    <p className="mt-1 line-clamp-1 w-full text-[11px] text-muted-foreground sm:text-xs">
                      {product.description}
                    </p>
                  )}
                  
                  {/* Price */}
                  <div className="mt-auto flex w-full items-center justify-center gap-1.5 border-t pt-3">
                    <span className="text-base font-bold sm:text-lg">
                      {formatPrice(product.price)} €
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
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{product.name}</span>
                      {product.isActive === false && (
                        <Badge variant="outline" className="text-[10px] uppercase tracking-wide">
                          Архивиран
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground max-w-[200px] truncate">
                    {product.description || "-"}
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {formatPrice(product.price)} €
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

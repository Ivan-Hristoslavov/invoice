"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus,
  Search,
  Lock,
  LayoutGrid,
  List,
  Euro,
  Percent,
  Package,
  ChevronRight,
} from "lucide-react";
import { cn, formatPrice } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
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
  const router = useRouter();
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
    <div className="min-w-0 space-y-4 sm:space-y-6">
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

      {/* Stats — един ред × 3; min-w-0 за grid overflow */}
      <div className="grid w-full min-w-0 grid-cols-3 gap-1 sm:gap-2">
        <CardStatsMetric compact title="Общо продукти" value={totalProducts} icon={Package} />
        <CardStatsMetric
          compact
          title="Средна цена"
          value={formatPrice(avgPrice)}
          valueSuffix="€"
          icon={Euro}
        />
        <CardStatsMetric
          compact
          title="С ДДС"
          value={withTax}
          valueClassName="text-violet-600 dark:text-violet-400"
          icon={Percent}
        />
      </div>

      {/* Search & View Toggle */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-3 sm:p-4">
          <div className="flex flex-col gap-3 min-[420px]:flex-row min-[420px]:items-center min-[420px]:gap-3">
            <div className="relative min-w-0 w-full flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Търсене по име или описание..."
                className="h-10 min-h-11 border-border pl-10 text-base sm:h-11 sm:text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex shrink-0 items-center justify-stretch gap-1 rounded-lg bg-muted/50 p-1 min-[420px]:justify-center">
              <Button
                variant={viewMode === "cards" ? "default" : "ghost"}
                size="sm"
                type="button"
                onClick={() => setViewMode("cards")}
                className="h-9 min-h-9 flex-1 px-2 min-[420px]:flex-none min-[420px]:px-3"
                aria-pressed={viewMode === "cards"}
                aria-label="Картичен изглед"
              >
                <LayoutGrid className="mx-auto h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "table" ? "default" : "ghost"}
                size="sm"
                type="button"
                onClick={() => setViewMode("table")}
                className="h-9 min-h-9 flex-1 px-2 min-[420px]:flex-none min-[420px]:px-3"
                aria-pressed={viewMode === "table"}
                aria-label="Табличен изглед"
              >
                <List className="mx-auto h-4 w-4" />
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
        <div className="grid min-w-0 grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
          {paginatedProducts.map((product) => (
            <Link key={product.id} href={`/products/${product.id}`} className="block h-full min-w-0">
              <Card
                variant="secondary"
                className="group h-full cursor-pointer rounded-xl border border-border/50 bg-card/90 shadow-none ring-0 transition-[border-color,background-color,box-shadow] hover:border-primary/35 hover:bg-muted/25 hover:shadow-sm"
              >
                <CardContent className="!p-0">
                  {/* Мобилен: вертикален блок; sm+: хоризонтален ред */}
                  <div className="flex flex-col gap-2.5 p-3 sm:flex-row sm:items-stretch sm:gap-3 sm:p-3.5">
                    <div className="flex min-w-0 items-start gap-3 sm:min-w-0 sm:flex-1">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary sm:h-[52px] sm:w-[52px]">
                        <Package className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <CardTitle className="line-clamp-2 text-sm font-semibold leading-snug text-foreground group-hover:text-primary sm:text-base">
                            {product.name}
                          </CardTitle>
                          {product.isActive === false && (
                            <Badge
                              variant="outline"
                              className="shrink-0 border-amber-500/40 text-[9px] uppercase tracking-wide text-amber-800 dark:text-amber-200"
                            >
                              Архив
                            </Badge>
                          )}
                        </div>
                        <CardDescription className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground sm:mt-1.5">
                          {product.description?.trim() || `Артикул · ${product.unit}`}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-3 border-t border-border/40 pt-2.5 sm:w-[5.75rem] sm:min-w-[5.75rem] sm:flex-col sm:items-end sm:justify-center sm:border-l sm:border-t-0 sm:pt-0 sm:pl-3 sm:shrink-0">
                      <div className="text-left sm:w-full sm:text-right">
                        <span className="text-base font-bold tabular-nums text-foreground sm:text-lg">
                          {formatPrice(product.price)}
                          <span className="text-xs font-semibold text-muted-foreground"> €</span>
                        </span>
                        <p className="text-[11px] text-muted-foreground sm:mt-0.5">/ {product.unit}</p>
                      </div>
                      <div className="flex items-center gap-2 sm:flex-col sm:items-end sm:gap-1">
                        {product.taxRate > 0 ? (
                          <Badge variant="secondary" className="text-[10px] font-medium whitespace-nowrap">
                            ДДС {product.taxRate}%
                          </Badge>
                        ) : null}
                        <ChevronRight
                          className="h-4 w-4 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5 group-hover:text-primary sm:hidden"
                          aria-hidden
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Table
          variant="secondary"
          stickyHeader
          className="min-w-0 rounded-2xl border border-border/50 bg-card shadow-sm"
          contentAriaLabel="Списък с продукти"
          contentClassName="min-w-[680px]"
          scrollContainerClassName="overflow-x-auto overscroll-x-contain"
        >
          <TableHeader
            sticky
            className="border-b border-border/50 bg-muted/40 backdrop-blur-sm dark:bg-muted/25"
          >
            <TableRow className="border-0 hover:bg-transparent">
              <TableHead className="w-[36%] text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Продукт
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Описание
              </TableHead>
              <TableHead className="text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Цена
              </TableHead>
              <TableHead className="text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Мярка
              </TableHead>
              <TableHead className="text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                ДДС
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedProducts.map((product, index) => (
              <TableRow
                key={product.id}
                className={cn(
                  "cursor-pointer border-b border-border/30 transition-colors last:border-0",
                  "hover:bg-primary/[0.04] dark:hover:bg-primary/[0.07]",
                  index % 2 === 1 && "bg-muted/20 dark:bg-muted/10"
                )}
                onClick={() => router.push(`/products/${product.id}`)}
              >
                <TableCell className="py-2 sm:py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Package className="h-4 w-4" aria-hidden />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-medium text-foreground">{product.name}</p>
                      {product.isActive === false && (
                        <Badge variant="outline" className="mt-1 text-[10px] uppercase tracking-wide">
                          Архив
                        </Badge>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="max-w-[220px] py-2 text-sm text-muted-foreground sm:py-3.5">
                  <span className="line-clamp-2">{product.description || "—"}</span>
                </TableCell>
                <TableCell className="py-2 text-right sm:py-3.5">
                  <span className="font-semibold tabular-nums text-foreground">
                    {formatPrice(product.price)} €
                  </span>
                </TableCell>
                <TableCell className="py-2 text-center text-sm text-muted-foreground sm:py-3.5">{product.unit}</TableCell>
                <TableCell className="py-2 text-center sm:py-3.5">
                  {product.taxRate > 0 ? (
                    <Badge variant="secondary" className="font-medium tabular-nums">
                      {product.taxRate}%
                    </Badge>
                  ) : (
                    <span className="text-sm text-muted-foreground">—</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col items-center gap-3 pt-3 sm:flex-row sm:items-center sm:justify-between sm:pt-2">
          <p className="order-2 text-center text-xs text-muted-foreground sm:order-1 sm:text-left sm:text-sm">
            {(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filteredProducts.length)} от {filteredProducts.length} продукта
          </p>
          <div className="order-1 flex w-full justify-center overflow-x-auto pb-1 sm:order-2 sm:w-auto sm:justify-end sm:pb-0">
            <Pagination
              className="shrink-0"
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              size="sm"
            />
          </div>
        </div>
      )}
    </div>
  );
}

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
  Upload,
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
          <div className="flex w-full gap-2 sm:w-auto">
            <Button asChild size="3" variant="outline" className="hidden sm:inline-flex h-11 sm:h-auto">
              <Link href="/products/import" className="flex items-center whitespace-nowrap">
                <Upload className="mr-2 h-4 w-4" />
                Импорт
              </Link>
            </Button>
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
          </div>
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
      <Card className="rounded-2xl border border-border/50 bg-card/60 shadow-sm backdrop-blur-sm">
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
        <Card className="rounded-2xl border border-border/50 bg-card/60 shadow-sm backdrop-blur-sm">
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
        <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {paginatedProducts.map((product) => (
            <Link key={product.id} href={`/products/${product.id}`} className="block h-full min-w-0">
              <Card
                variant="secondary"
                className={cn(
                  "group h-full cursor-pointer overflow-hidden rounded-2xl border border-border/45",
                  "bg-card/50 shadow-sm backdrop-blur-sm transition-all duration-200",
                  "hover:border-emerald-500/35 hover:bg-card/80 hover:shadow-md hover:shadow-emerald-500/6"
                )}
              >
                <CardContent className="p-0!">
                  <div className="flex flex-col">
                    <div className="flex gap-3.5 p-4 pb-3 sm:p-5 sm:pb-4">
                      <div
                        className={cn(
                          "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl sm:h-14 sm:w-14",
                          "bg-linear-to-br from-emerald-500/18 via-emerald-500/8 to-cyan-500/12",
                          "text-emerald-600 shadow-inner ring-1 ring-emerald-500/20",
                          "dark:from-emerald-500/25 dark:via-emerald-500/12 dark:to-cyan-500/15 dark:text-emerald-400"
                        )}
                      >
                        <Package className="h-6 w-6 sm:h-7 sm:w-7" aria-hidden />
                      </div>
                      <div className="min-w-0 flex-1 pt-0.5">
                        <div className="flex items-start justify-between gap-2">
                          <CardTitle className="line-clamp-2 text-base font-semibold leading-snug tracking-tight text-foreground transition-colors group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                            {product.name}
                          </CardTitle>
                          <ChevronRight
                            className="mt-0.5 hidden h-4 w-4 shrink-0 text-muted-foreground/40 transition-all group-hover:translate-x-0.5 group-hover:text-emerald-500 sm:block"
                            aria-hidden
                          />
                        </div>
                        {product.isActive === false && (
                          <Badge
                            variant="outline"
                            className="mt-2 border-amber-500/45 text-[10px] font-semibold uppercase tracking-wide text-amber-800 dark:text-amber-200"
                          >
                            Архив
                          </Badge>
                        )}
                        <CardDescription className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                          {product.description?.trim() || `Артикул · ${product.unit}`}
                        </CardDescription>
                      </div>
                    </div>

                    <div
                      className={cn(
                        "mx-3 mb-3 flex flex-wrap items-end justify-between gap-3 rounded-xl border border-border/30 px-3.5 py-3 sm:mx-4 sm:mb-4 sm:px-4 sm:py-3.5",
                        "bg-linear-to-br from-muted/50 via-muted/30 to-emerald-500/8 dark:from-muted/25 dark:via-muted/12 dark:to-emerald-500/10"
                      )}
                    >
                      <div className="min-w-0">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                          Цена
                        </p>
                        <p className="mt-0.5 flex flex-wrap items-baseline gap-x-1">
                          <span className="text-2xl font-bold tabular-nums tracking-tight text-foreground sm:text-[1.65rem]">
                            {formatPrice(product.price)}
                          </span>
                          <span className="text-sm font-medium text-muted-foreground">€</span>
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">за {product.unit}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {product.taxRate > 0 ? (
                          <Badge
                            variant="outline"
                            className="border-emerald-500/40 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold tabular-nums text-emerald-800 dark:border-emerald-500/35 dark:bg-emerald-500/15 dark:text-emerald-200"
                          >
                            ДДС {product.taxRate}%
                          </Badge>
                        ) : (
                          <span className="text-[11px] font-medium text-muted-foreground">Без ДДС</span>
                        )}
                        <ChevronRight
                          className="h-4 w-4 shrink-0 text-muted-foreground/45 transition-transform group-hover:translate-x-0.5 group-hover:text-emerald-500 sm:hidden"
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
        <>
          {/* Мобилен изглед: същият модел като фактурите — компактни редове, не широка таблица */}
          <div className="space-y-2 px-0.5 pb-1 md:hidden sm:px-1">
            {paginatedProducts.map((product) => (
              <button
                key={product.id}
                type="button"
                onClick={() => router.push(`/products/${product.id}`)}
                className={cn(
                  "w-full rounded-xl border border-border/40 bg-muted/20 px-3 py-2.5 text-left transition-colors",
                  "hover:bg-muted/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 flex-1 items-start gap-2.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10">
                      <Package className="h-4 w-4 text-emerald-600 dark:text-emerald-400" aria-hidden />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{product.name}</p>
                      <p className="line-clamp-2 text-xs text-muted-foreground">
                        {product.description?.trim() || "—"}
                      </p>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-bold tabular-nums">{formatPrice(product.price)} €</p>
                    <p className="text-xs text-muted-foreground">{product.unit}</p>
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-between pl-11">
                  {product.taxRate > 0 ? (
                    <span className="inline-flex items-center rounded-full border border-emerald-500/35 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-200">
                      ДДС {product.taxRate}%
                    </span>
                  ) : (
                    <span className="text-[11px] text-muted-foreground">Без ДДС</span>
                  )}
                  {product.isActive === false && (
                    <span className="text-[11px] font-medium text-amber-700 dark:text-amber-400">Архив</span>
                  )}
                </div>
              </button>
            ))}
          </div>

          <div className="hidden min-w-0 md:block">
            <div className="overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-b from-muted/25 to-card/40 shadow-sm">
              <div className="min-w-0 overflow-x-auto">
            <Table
              variant="secondary"
              stickyHeader
              contentAriaLabel="Списък с продукти"
              contentClassName="min-w-[680px] w-full table-fixed"
              scrollContainerClassName="overflow-x-auto overscroll-x-contain"
              className="invoices-table-flat data-table-polished min-w-0 rounded-none border-0 bg-transparent shadow-none"
              onRowAction={(key) => router.push(`/products/${String(key)}`)}
            >
              <TableHeader className="bg-muted/35">
                <TableHead
                  isRowHeader
                  className="w-[26%] px-4 py-2 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground"
                >
                  Продукт
                </TableHead>
                <TableHead className="w-[28%] px-4 py-2 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Описание
                </TableHead>
                <TableHead className="w-[14%] px-4 py-2 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Цена
                </TableHead>
                <TableHead className="w-[12%] px-4 py-2 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Мярка
                </TableHead>
                <TableHead className="w-[14%] px-4 py-2 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  ДДС
                </TableHead>
              </TableHeader>
              <TableBody items={paginatedProducts}>
                {(item) => {
                  const product = item as Product;
                  return (
                  <TableRow
                    key={product.id}
                    id={product.id}
                    className="group cursor-pointer transition-colors hover:bg-muted/40 dark:hover:bg-muted/20"
                  >
                    <TableCell className="px-4 py-3 align-middle">
                      <div className="flex min-w-0 items-center justify-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 shadow-inner">
                          <Package className="h-4 w-4 text-emerald-600 dark:text-emerald-400" aria-hidden />
                        </div>
                        <div className="min-w-0 max-w-[12rem] text-center sm:max-w-[14rem]">
                          <p className="truncate text-sm font-semibold leading-tight">{product.name}</p>
                          <p className="text-[11px] leading-tight text-muted-foreground">
                            {product.isActive === false ? "Архив" : "Артикул"}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="min-w-0 px-4 py-2.5 align-middle text-center">
                      <p className="line-clamp-2 text-sm text-muted-foreground">
                        {product.description?.trim() || "—"}
                      </p>
                    </TableCell>
                    <TableCell className="px-4 py-2.5 text-right align-middle">
                      <p className="text-sm font-bold tabular-nums leading-tight">
                        {formatPrice(product.price)} €
                      </p>
                    </TableCell>
                    <TableCell className="px-4 py-2.5 text-center align-middle">
                      <p className="text-sm text-muted-foreground">{product.unit}</p>
                    </TableCell>
                    <TableCell className="px-4 py-2.5 text-center align-middle">
                      {product.taxRate > 0 ? (
                        <span className="inline-flex items-center justify-center rounded-full border border-emerald-500/35 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-medium text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-200">
                          ДДС {product.taxRate}%
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                  );
                }}
              </TableBody>
            </Table>
              </div>
            </div>
          </div>
        </>
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

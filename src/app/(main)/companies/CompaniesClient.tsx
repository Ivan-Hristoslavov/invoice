"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Building, Plus, Search, FileText, CheckCircle2, LayoutGrid, List, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { AppSectionKicker } from "@/components/app/AppSectionKicker";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CardStatsMetric } from "@/components/ui/CardStatsMetric";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useSubscriptionLimit } from "@/hooks/useSubscriptionLimit";
import { UsageCounter, LockedButton, LimitBanner } from "@/components/ui/pro-feature-lock";
import { EmptyState } from "@/components/ui/empty-state";
import { useState, useMemo, useEffect } from "react";
import { Pagination } from "@/components/ui/pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Company {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  city?: string | null;
  country?: string | null;
  bulstatNumber?: string | null;
  vatRegistered?: boolean;
}

interface CompaniesClientProps {
  companies: Company[];
  invoiceCounts: Record<string, number>;
}

export default function CompaniesClient({ companies, invoiceCounts }: CompaniesClientProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 12;

  useEffect(() => { setCurrentPage(1); }, [searchQuery]);
  
  // Subscription limit hook
  const { 
    plan, 
    isFree, 
    isPro,
    getCompanyUsage, 
    canCreateCompany,
    isLoadingUsage,
  } = useSubscriptionLimit();

  const companyUsage = getCompanyUsage();

  // Filter companies based on search
  const filteredCompanies = useMemo(() => {
    if (!searchQuery.trim()) return companies;
    
    const query = searchQuery.toLowerCase();
    return companies.filter(company => 
      company.name.toLowerCase().includes(query) ||
      (company.bulstatNumber && company.bulstatNumber.toLowerCase().includes(query)) ||
      (company.email && company.email.toLowerCase().includes(query))
    );
  }, [companies, searchQuery]);

  const totalPages = Math.ceil(filteredCompanies.length / ITEMS_PER_PAGE);
  const paginatedCompanies = filteredCompanies.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Stats
  const totalCompanies = companies.length;
  const vatRegistered = companies.filter(c => c.vatRegistered).length;
  const totalInvoices = Object.values(invoiceCounts).reduce((a, b) => a + b, 0);

  return (
    <div className="app-page-shell min-w-0">
      {/* Subscription Warning Banner */}
      {!canCreateCompany && (
        <LimitBanner
          variant="error"
          message={isFree
            ? <><strong>Лимит: 1 фирма</strong> за безплатния план. С Про — до 3 фирми от един акаунт.</>
            : <><strong>Лимит: 3 фирми</strong> за Про план. С Бизнес — до 10 фирми.</>
          }
        />
      )}

      {/* Header */}
      <div className="page-header">
        <div className="min-w-0 flex-1 space-y-2">
          <AppSectionKicker icon={Building}>Фирмени профили</AppSectionKicker>
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
            <h1 className="page-title">Компании</h1>
            {!isLoadingUsage && companyUsage.limit !== Infinity && (
              <UsageCounter
                used={companyUsage.used}
                limit={companyUsage.limit}
                label=""
              />
            )}
          </div>
          <p className="card-description">
            Добавете фирмите веднъж — данните се ползват при всяка фактура
          </p>
        </div>
        <div className="page-header-actions w-full sm:w-auto">
          {!isLoadingUsage && canCreateCompany && (
            <Button
              asChild
              size="3"
              variant="solid"
              color="green"
              className="w-full shadow-lg sm:w-auto"
            >
              <Link href="/companies/new" className="flex items-center whitespace-nowrap">
                <Plus className="mr-2 h-5 w-5" />
                Нова компания
              </Link>
            </Button>
          )}
          {!isLoadingUsage && !canCreateCompany && (
            <LockedButton requiredPlan={isFree ? "PRO" : "BUSINESS"}>
              Нова компания
            </LockedButton>
          )}
        </div>
      </div>

      {/* Stats — като фактурите */}
      <div className="mx-auto grid max-w-3xl grid-cols-2 gap-2 sm:max-w-4xl sm:gap-2.5 lg:max-w-none lg:grid-cols-3">
        <CardStatsMetric
          title="Общо компании"
          value={totalCompanies}
          icon={Building}
          gradient="from-slate-500 to-slate-600"
        />
        <CardStatsMetric
          title="Регистрирани по ДДС"
          value={vatRegistered}
          valueClassName="text-emerald-600"
          icon={CheckCircle2}
          gradient="from-emerald-500 to-teal-600"
        />
        <CardStatsMetric
          title="Издадени фактури"
          value={totalInvoices}
          valueClassName="text-blue-600"
          icon={FileText}
          gradient="from-blue-500 to-indigo-600"
        />
      </div>

      {/* Search & View Toggle */}
      <Card className="rounded-xl border border-border/40 shadow-sm">
        <CardContent className="p-3 sm:p-4">
          <div className="flex flex-col gap-3 min-[420px]:flex-row min-[420px]:items-center min-[420px]:gap-3">
            <div className="relative min-w-0 w-full flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Търсене по име, ЕИК или ДДС номер..."
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

      {/* Companies Grid */}
      {filteredCompanies.length === 0 ? (
        <Card className="border border-border/40 shadow-sm">
          <CardContent className="p-0">
            <EmptyState
              icon={Building}
              heading={searchQuery ? "Няма намерени компании" : "Все още нямате компании"}
              description={searchQuery ? "Опитайте да промените критериите за търсене" : "Добавете първата си компания, за да започнете да създавате фактури"}
              action={!searchQuery ? (
                canCreateCompany ? (
                  <Button asChild>
                    <Link href="/companies/new" className="flex items-center whitespace-nowrap">
                      <Plus className="mr-2 h-4 w-4" />
                      Добави първата компания
                    </Link>
                  </Button>
                ) : (
                  <LockedButton requiredPlan={isFree ? "PRO" : "BUSINESS"}>
                    Добави компания
                  </LockedButton>
                )
              ) : undefined}
            />
          </CardContent>
        </Card>
      ) : viewMode === "cards" ? (
        <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {paginatedCompanies.map((company) => (
            <div key={company.id} className="group relative min-w-0">
              <Card
                className="h-full min-h-[150px] border-0 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl cursor-pointer"
                onClick={() => router.push("/settings/company")}
              >
                <div
                  className="absolute right-3 top-3 z-10 opacity-100 transition-opacity duration-200 sm:opacity-0 sm:group-hover:opacity-100"
                  onClick={(event) => event.stopPropagation()}
                >
                  <Button
                    asChild
                    size="sm"
                    variant="outline"
                    className="h-8 rounded-full border-border/60 bg-background/95 px-3 shadow-sm backdrop-blur"
                  >
                    <Link href="/settings/company" className="flex items-center gap-1.5 whitespace-nowrap">
                      <Pencil className="h-3.5 w-3.5" />
                      Редакция
                    </Link>
                  </Button>
                </div>
                <CardContent className="flex h-full flex-col items-center p-4 text-center sm:p-5">
                  {/* Name */}
                  <h3 className="font-semibold text-lg group-hover:text-primary transition-colors truncate w-full">
                    {company.name}
                  </h3>
                  
                  {/* Badges */}
                  <div className="flex items-center justify-center gap-2 mt-2 flex-wrap">
                    {company.bulstatNumber && (
                      <Badge variant="outline" className="text-xs">
                        ЕИК: {company.bulstatNumber}
                      </Badge>
                    )}
                    {company.vatRegistered && (
                      <Badge variant="secondary" className="text-xs bg-emerald-500/10 text-emerald-600">
                        ДДС
                      </Badge>
                    )}
                  </div>
                  
                  {/* Contact Info */}
                  <div className="mt-2 space-y-1 text-sm text-muted-foreground w-full">
                    {company.email && <p className="truncate">{company.email}</p>}
                    {company.phone && <p>{company.phone}</p>}
                    {(company.city || company.country) && (
                      <p>{[company.city, company.country].filter(Boolean).join(", ")}</p>
                    )}
                  </div>
                  
                  {/* Invoice Count */}
                  <div className="mt-auto pt-3 w-full border-t">
                    <span className="text-xs font-medium text-muted-foreground">
                      {invoiceCounts[company.id] || 0} {(invoiceCounts[company.id] || 0) === 1 ? 'фактура' : 'фактури'}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      ) : (
        <Card className="border border-border/40 shadow-sm">
          <CardHeader className="space-y-1 pb-3 sm:pb-4">
            <Badge variant="info" className="mb-2">
              Профили
            </Badge>
            <CardTitle>Списък с компании</CardTitle>
            <CardDescription>
              {filteredCompanies.length} от {companies.length} компании
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="space-y-2 px-2 pb-4 md:hidden sm:px-3">
              {paginatedCompanies.map((company) => (
                <button
                  key={company.id}
                  type="button"
                  onClick={() => router.push("/settings/company")}
                  className={cn(
                    "w-full rounded-xl border border-border/40 bg-muted/20 px-3 py-2.5 text-left transition-colors",
                    "hover:bg-muted/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 flex-1 items-start gap-2.5">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10">
                        <Building className="h-4 w-4 text-emerald-600 dark:text-emerald-400" aria-hidden />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{company.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {company.bulstatNumber ? `ЕИК ${company.bulstatNumber}` : "—"}
                        </p>
                      </div>
                    </div>
                    <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                      {invoiceCounts[company.id] || 0} фактури
                    </span>
                  </div>
                </button>
              ))}
            </div>

            <div className="hidden min-w-0 pb-4 md:block">
              <div className="overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-b from-muted/25 to-card/40 shadow-sm">
                <div className="min-w-0 overflow-x-auto">
              <Table
                variant="secondary"
                stickyHeader
                contentAriaLabel="Списък с компании"
                contentClassName="min-w-[900px] w-full table-fixed"
                scrollContainerClassName="overflow-x-auto overscroll-x-contain"
                className="invoices-table-flat data-table-polished min-w-0 rounded-none border-0 bg-transparent shadow-none"
                onRowAction={() => router.push("/settings/company")}
              >
                <TableHeader className="bg-muted/35">
                  <TableHead
                    isRowHeader
                    className="w-[22%] px-4 py-2 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground"
                  >
                    Компания
                  </TableHead>
                  <TableHead className="w-[12%] px-4 py-2 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    ЕИК
                  </TableHead>
                  <TableHead className="w-[22%] px-4 py-2 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Имейл
                  </TableHead>
                  <TableHead className="w-[14%] px-4 py-2 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Телефон
                  </TableHead>
                  <TableHead className="w-[10%] px-4 py-2 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    ДДС
                  </TableHead>
                  <TableHead className="w-[10%] px-4 py-2 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Фактури
                  </TableHead>
                  <TableHead className="w-[10%] px-4 py-2 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Действия
                  </TableHead>
                </TableHeader>
                <TableBody items={paginatedCompanies}>
                  {(item) => {
                    const company = item as Company;
                    return (
                    <TableRow
                      key={company.id}
                      id={company.id}
                      className="group cursor-pointer transition-colors hover:bg-muted/40 dark:hover:bg-muted/20"
                    >
                      <TableCell className="px-4 py-3 align-middle">
                        <div className="flex min-w-0 items-center justify-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 shadow-inner">
                            <Building className="h-4 w-4 text-emerald-600 dark:text-emerald-400" aria-hidden />
                          </div>
                          <div className="min-w-0 max-w-[11rem] text-center sm:max-w-[13rem]">
                            <p className="truncate text-sm font-semibold leading-tight">{company.name}</p>
                            {(company.city || company.country) && (
                              <p className="text-[11px] leading-tight text-muted-foreground">
                                {[company.city, company.country].filter(Boolean).join(", ")}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-2.5 text-center text-sm text-muted-foreground">
                        {company.bulstatNumber || "—"}
                      </TableCell>
                      <TableCell className="min-w-0 px-4 py-2.5 text-center">
                        <span className="line-clamp-2 text-sm text-muted-foreground">{company.email || "—"}</span>
                      </TableCell>
                      <TableCell className="px-4 py-2.5 text-center text-sm text-muted-foreground">
                        {company.phone || "—"}
                      </TableCell>
                      <TableCell className="px-4 py-2.5 text-center align-middle">
                        {company.vatRegistered ? (
                          <Badge variant="secondary" className="text-[11px] bg-emerald-500/10 text-emerald-600">
                            ДДС
                          </Badge>
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="px-4 py-2.5 text-center align-middle">
                        <span className="inline-flex min-w-8 items-center justify-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                          {invoiceCounts[company.id] || 0}
                        </span>
                      </TableCell>
                      <TableCell className="px-4 py-2.5 text-center align-middle">
                        <div
                          className="flex justify-center opacity-100 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100"
                          onClick={(event) => event.stopPropagation()}
                          onKeyDown={(event) => event.stopPropagation()}
                        >
                          <Button asChild size="sm" variant="ghost" className="h-8 rounded-full px-3">
                            <Link href="/settings/company" className="flex items-center gap-1.5 whitespace-nowrap">
                              <Pencil className="h-3.5 w-3.5" />
                              Редакция
                            </Link>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    );
                  }}
                </TableBody>
              </Table>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col items-center gap-3 pt-3 sm:flex-row sm:items-center sm:justify-between sm:pt-2">
          <p className="order-2 text-center text-xs text-muted-foreground sm:order-1 sm:text-left sm:text-sm">
            {(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filteredCompanies.length)} от {filteredCompanies.length} компании
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

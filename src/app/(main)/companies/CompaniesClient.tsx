"use client";

import Link from "next/link";
import { Building, Plus, Search, FileText, CheckCircle2, Crown, XCircle, LayoutGrid, List, Pencil } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { CardStatsMetric } from "@/components/ui/CardStatsMetric";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useSubscriptionLimit } from "@/hooks/useSubscriptionLimit";
import { UsageCounter, LockedButton } from "@/components/ui/pro-feature-lock";
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
    isLoadingUsage 
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
    <div className="space-y-4 sm:space-y-6">
      {/* Subscription Warning Banner */}
      {!canCreateCompany && (
        <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/30">
          <XCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-red-800 dark:text-red-200">
              {isFree && (
                <>Достигнахте лимита от <strong>1 компания</strong> за FREE плана. Надградете до PRO за до 3 компании.</>
              )}
              {isPro && (
                <>Достигнахте лимита от <strong>3 компании</strong> за PRO плана. Надградете до BUSINESS за до 10 компании.</>
              )}
            </span>
            <Link href="/settings/subscription" className="flex items-center whitespace-nowrap">
              <Button size="sm" className="bg-linear-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 sm:ml-4">
                <Crown className="h-4 w-4 mr-2" />
                Надградете
              </Button>
            </Link>
          </AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Компании</h1>
            {!isLoadingUsage && companyUsage.limit !== Infinity && (
              <UsageCounter 
                used={companyUsage.used} 
                limit={companyUsage.limit}
                label=""
              />
            )}
          </div>
          <p className="text-muted-foreground mt-1">
            Управлявайте вашите фирми и компании
          </p>
        </div>
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

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
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
      <Card className="border-0 shadow-lg">
        <CardContent className="p-3 sm:p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input 
                placeholder="Търсене по име, ЕИК или ДДС номер..." 
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

      {/* Companies Grid */}
      {filteredCompanies.length === 0 ? (
        <Card className="border-0 shadow-lg">
          <CardContent className="py-16">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Building className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-1">
                {searchQuery ? "Няма намерени компании" : "Все още нямате компании"}
              </h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-sm">
                {searchQuery 
                  ? "Опитайте да промените критериите за търсене"
                  : "Добавете първата си компания, за да започнете да създавате фактури"
                }
              </p>
              {!searchQuery && canCreateCompany && (
                <Button asChild>
                  <Link href="/companies/new" className="flex items-center whitespace-nowrap">
                    <Plus className="mr-2 h-4 w-4" />
                    Добави първата компания
                  </Link>
                </Button>
              )}
              {!searchQuery && !canCreateCompany && (
                <LockedButton requiredPlan={isFree ? "PRO" : "BUSINESS"}>
                  Добави компания
                </LockedButton>
              )}
            </div>
          </CardContent>
        </Card>
      ) : viewMode === "cards" ? (
        /* Cards View */
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {paginatedCompanies.map((company) => (
            <div key={company.id} className="group relative">
              <Card
                className="h-full min-h-[150px] border-0 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl cursor-pointer"
                onClick={() => window.location.href = "/settings/company"}
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
        /* Table View */
        <Card className="border-0 shadow-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-border/50">
                <TableHead className="font-medium text-muted-foreground">Компания</TableHead>
                <TableHead className="font-medium text-muted-foreground">ЕИК</TableHead>
                <TableHead className="font-medium text-muted-foreground">Имейл</TableHead>
                <TableHead className="font-medium text-muted-foreground">Телефон</TableHead>
                <TableHead className="font-medium text-muted-foreground text-center">ДДС</TableHead>
                <TableHead className="font-medium text-muted-foreground text-center">Фактури</TableHead>
                <TableHead className="w-[120px] text-right font-medium text-muted-foreground">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedCompanies.map((company) => (
                <TableRow 
                  key={company.id} 
                  className="group cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => window.location.href = `/settings/company`}
                >
                  <TableCell>
                    <div>
                      <p className="font-medium">{company.name}</p>
                      {(company.city || company.country) && (
                        <p className="text-xs text-muted-foreground">
                          {[company.city, company.country].filter(Boolean).join(", ")}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {company.bulstatNumber || "-"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {company.email || "-"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {company.phone || "-"}
                  </TableCell>
                  <TableCell className="text-center">
                    {company.vatRegistered ? (
                      <Badge variant="secondary" className="text-xs bg-emerald-500/10 text-emerald-600">
                        ДДС
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="inline-flex items-center justify-center min-w-8 px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                      {invoiceCounts[company.id] || 0}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div
                      className="flex justify-end opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                      onClick={(event) => event.stopPropagation()}
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
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-sm text-muted-foreground">
            {(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filteredCompanies.length)} от {filteredCompanies.length} компании
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

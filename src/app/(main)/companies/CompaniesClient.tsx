"use client";

import Link from "next/link";
import { Building, Plus, Search, Mail, Phone, MapPin, FileText, CheckCircle2, Crown, XCircle, LayoutGrid, List } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { CardStatsMetric } from "@/components/ui/CardStatsMetric";
import { Button } from "@/components/ui/button";
import { Button as RadixButton } from "@radix-ui/themes";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useSubscriptionLimit } from "@/hooks/useSubscriptionLimit";
import { UsageCounter, LockedButton } from "@/components/ui/pro-feature-lock";
import { useState, useMemo } from "react";
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

  // Stats
  const totalCompanies = companies.length;
  const vatRegistered = companies.filter(c => c.vatRegistered).length;
  const totalInvoices = Object.values(invoiceCounts).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6">
      {/* Subscription Warning Banner */}
      {!canCreateCompany && (
        <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/30">
          <XCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="flex items-center justify-between">
            <span className="text-red-800 dark:text-red-200">
              {isFree && (
                <>Достигнахте лимита от <strong>1 компания</strong> за FREE плана. Надградете до PRO за до 3 компании.</>
              )}
              {isPro && (
                <>Достигнахте лимита от <strong>3 компании</strong> за PRO плана. Надградете до BUSINESS за до 10 компании.</>
              )}
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
            <h1 className="text-3xl font-bold tracking-tight">Компании</h1>
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
        {canCreateCompany ? (
          <RadixButton 
            asChild 
            size="3" 
            variant="solid" 
            color="green"
            className="shadow-lg"
          >
            <Link href="/companies/new">
              <Plus className="mr-2 h-5 w-5" />
              Нова компания
            </Link>
          </RadixButton>
        ) : (
          <LockedButton requiredPlan={isFree ? "PRO" : "BUSINESS"}>
            Нова компания
          </LockedButton>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
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
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input 
                placeholder="Търсене по име, ЕИК или ДДС номер..." 
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
                  <Link href="/companies/new">
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
          {filteredCompanies.map((company) => (
            <Link key={company.id} href={`/settings/company`}>
              <Card className="h-full min-h-[140px] border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group cursor-pointer">
                <CardContent className="p-5 h-full flex flex-col items-center text-center">
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
            </Link>
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
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCompanies.map((company) => (
                <TableRow 
                  key={company.id} 
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
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
                    <span className="inline-flex items-center justify-center min-w-[2rem] px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                      {invoiceCounts[company.id] || 0}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}

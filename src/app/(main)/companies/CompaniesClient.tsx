"use client";

import Link from "next/link";
import { Building, Plus, Search, Mail, Phone, MapPin, ArrowUpRight, FileText, CheckCircle2, Crown, XCircle, Lock } from "lucide-react";
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

  // Generate gradient based on company name
  const getGradient = (name: string) => {
    const gradients = [
      "from-slate-500 to-slate-600",
      "from-blue-500 to-indigo-600",
      "from-emerald-500 to-teal-600",
      "from-amber-500 to-orange-600",
      "from-cyan-500 to-teal-600",
      "from-cyan-500 to-blue-600",
    ];
    const index = name.charCodeAt(0) % gradients.length;
    return gradients[index];
  };

  return (
    <div className="space-y-6">
      {/* Subscription Warning Banner for FREE plan */}
      {isFree && !canCreateCompany && (
        <Alert className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30">
          <Lock className="h-4 w-4 text-amber-600" />
          <AlertDescription className="flex items-center justify-between">
            <span className="text-amber-800 dark:text-amber-200">
              Вашият FREE план позволява само <strong>1 компания</strong>. 
              Надградете до PRO за до 10 компании.
            </span>
            <Link href="/settings/subscription">
              <Button size="sm" className="ml-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white">
                <Crown className="h-4 w-4 mr-2" />
                Надградете до PRO
              </Button>
            </Link>
          </AlertDescription>
        </Alert>
      )}

      {isPro && !canCreateCompany && (
        <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30">
          <Lock className="h-4 w-4 text-blue-600" />
          <AlertDescription className="flex items-center justify-between">
            <span className="text-blue-800 dark:text-blue-200">
              Вашият PRO план позволява до <strong>10 компании</strong>. 
              Надградете до BUSINESS за неограничени компании.
            </span>
            <Link href="/settings/subscription">
              <Button size="sm" className="ml-4 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white">
                <Crown className="h-4 w-4 mr-2" />
                Надградете до BUSINESS
              </Button>
            </Link>
          </AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">Компании</h1>
            {(isFree || isPro) && !isLoadingUsage && companyUsage.limit !== Infinity && (
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

      {/* Search */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input 
              placeholder="Търсене по име, ЕИК или ДДС номер..." 
              className="pl-10 h-11 border-border"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
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
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredCompanies.map((company) => (
            <Link key={company.id} href={`/settings/company`}>
              <Card className="h-full border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${getGradient(company.name)} flex items-center justify-center text-white font-bold text-lg shadow-lg`}>
                      {company.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold truncate group-hover:text-primary transition-colors">
                            {company.name}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
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
                        </div>
                        <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      
                      <div className="mt-3 space-y-1.5">
                        {company.email && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Mail className="h-3.5 w-3.5" />
                            <span className="truncate">{company.email}</span>
                          </div>
                        )}
                        {company.phone && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Phone className="h-3.5 w-3.5" />
                            <span>{company.phone}</span>
                          </div>
                        )}
                        {(company.city || company.country) && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MapPin className="h-3.5 w-3.5" />
                            <span>{[company.city, company.country].filter(Boolean).join(", ")}</span>
                          </div>
                        )}
                      </div>
                      
                      {invoiceCounts[company.id] > 0 && (
                        <div className="mt-4 pt-3 border-t">
                          <span className="text-xs font-medium text-muted-foreground">
                            {invoiceCounts[company.id]} {invoiceCounts[company.id] === 1 ? 'фактура' : 'фактури'}
                          </span>
                        </div>
                      )}
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

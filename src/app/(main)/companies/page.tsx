import Link from "next/link";
import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Building, Plus, Search, Mail, Phone, MapPin, ArrowUpRight, FileText, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Button as RadixButton } from "@radix-ui/themes";
import { Badge } from "@/components/ui/badge";
import { APP_NAME } from "@/config/constants";
import { createAdminClient } from "@/lib/supabase/server";
import { Input } from "@/components/ui/input";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: `Компании | ${APP_NAME}`,
  description: "Управлявайте вашите компании",
};

export default async function CompaniesPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect("/signin");
  }

  const supabase = createAdminClient();
  
  // Fetch companies
  const { data: companies, error } = await supabase
    .from("Company")
    .select("*")
    .eq("userId", session.user.id)
    .order("name", { ascending: true });
  
  if (error) {
    console.error("Error fetching companies:", error);
  }
  
  const companiesList = companies || [];

  // Get invoice counts per company
  const { data: invoiceCounts } = await supabase
    .from("Invoice")
    .select("companyId")
    .eq("userId", session.user.id);
  
  const companyInvoiceCounts = (invoiceCounts || []).reduce((acc: Record<string, number>, inv: any) => {
    acc[inv.companyId] = (acc[inv.companyId] || 0) + 1;
    return acc;
  }, {});

  // Stats
  const totalCompanies = companiesList.length;
  const vatRegistered = companiesList.filter((c: any) => c.vatRegistered).length;

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
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Компании</h1>
          <p className="text-muted-foreground mt-1">
            Управлявайте вашите фирми и компании
          </p>
        </div>
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
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-slate-500/5 to-slate-600/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Общо компании</p>
                <p className="text-2xl font-bold">{totalCompanies}</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-slate-500 to-slate-600 flex items-center justify-center">
                <Building className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-500/5 to-teal-600/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Регистрирани по ДДС</p>
                <p className="text-2xl font-bold text-emerald-600">{vatRegistered}</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500/5 to-indigo-600/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Издадени фактури</p>
                <p className="text-2xl font-bold text-blue-600">
                  {Object.values(companyInvoiceCounts).reduce((a: any, b: any) => a + b, 0)}
                </p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                <FileText className="h-5 w-5 text-white" />
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
              placeholder="Търсене по име, ЕИК или ДДС номер..." 
              className="pl-10 h-11 border-border"
            />
          </div>
        </CardContent>
      </Card>

      {/* Companies Grid */}
      {companiesList.length === 0 ? (
        <Card className="border-0 shadow-lg">
          <CardContent className="py-16">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Building className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-1">Все още нямате компании</h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-sm">
                Добавете първата си компания, за да започнете да създавате фактури
              </p>
              <Button asChild>
                <Link href="/companies/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Добави първата компания
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {companiesList.map((company: any) => (
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
                      
                      {companyInvoiceCounts[company.id] > 0 && (
                        <div className="mt-4 pt-3 border-t">
                          <span className="text-xs font-medium text-muted-foreground">
                            {companyInvoiceCounts[company.id]} {companyInvoiceCounts[company.id] === 1 ? 'фактура' : 'фактури'}
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

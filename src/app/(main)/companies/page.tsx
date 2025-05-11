import Link from "next/link";
import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Building, Plus, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { APP_NAME } from "@/config/constants";
import { prisma } from "@/lib/db";
import { Input } from "@/components/ui/input";

export const metadata: Metadata = {
  title: `Companies | ${APP_NAME}`,
  description: "Manage your companies",
};

export default async function CompaniesPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
          <p className="text-muted-foreground mb-6">Please sign in to access companies</p>
          <Button asChild>
            <Link href="/signin">Sign In</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Fetch companies from database
  const companies = await prisma.company.findMany({
    where: { userId: session.user.id },
    orderBy: { name: 'asc' },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Companies</h1>
        <Button asChild>
          <Link href="/companies/new">
            <Plus className="mr-2 h-4 w-4" /> Add Company
          </Link>
        </Button>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input 
            placeholder="Search companies..." 
            className="pl-10"
          />
        </div>
      </div>

      {companies.length === 0 ? (
        <div className="text-center py-12">
          <Building className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
          <h3 className="mt-4 text-lg font-semibold">No companies yet</h3>
          <p className="mt-2 text-muted-foreground">
            Add your first company to start creating invoices
          </p>
          <Button className="mt-4" asChild>
            <Link href="/companies/new">
              <Plus className="mr-2 h-4 w-4" /> Add Company
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {companies.map((company) => (
            <Link key={company.id} href={`/companies/${company.id}`}>
              <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                        {company.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-medium">{company.name}</h3>
                      {company.email && (
                        <p className="text-sm text-muted-foreground">{company.email}</p>
                      )}
                      {company.phone && (
                        <p className="text-sm text-muted-foreground">{company.phone}</p>
                      )}
                      {company.vatNumber && (
                        <p className="text-sm text-muted-foreground">VAT: {company.vatNumber}</p>
                      )}
                      {(company.city || company.country) && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Building className="h-3 w-3" />
                          {[company.city, company.country].filter(Boolean).join(", ")}
                        </p>
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
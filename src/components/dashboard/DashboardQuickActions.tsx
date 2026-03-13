"use client";

import Link from "next/link";
import {
  FileText,
  Users,
  Building,
  Plus,
  MinusCircle,
  PlusCircle,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useSubscriptionLimit } from "@/hooks/useSubscriptionLimit";
import { Skeleton } from "@/components/ui/skeleton";

const linkClass =
  "flex items-center w-full p-2.5 sm:p-3 rounded-lg sm:rounded-xl hover:bg-muted/50 transition-colors group";

export function DashboardQuickActions() {
  const {
    isLoadingUsage,
    canCreateInvoice,
    canCreateCompany,
    canCreateClient,
    canCreateProduct,
    canUseFeature,
  } = useSubscriptionLimit();

  const canCreditNotes = canUseFeature("creditNotes");

  if (isLoadingUsage) {
    return (
      <Card className="lg:col-span-1 border border-border/50 shadow-md">
        <CardHeader className="pb-3 px-3 sm:px-6 pt-3 sm:pt-6">
          <CardTitle className="card-title">Бързи действия</CardTitle>
          <CardDescription className="card-description">
            Често използвани операции
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-1.5 px-3 sm:px-6 pb-3 sm:pb-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-14 w-full rounded-xl" />
          ))}
        </CardContent>
      </Card>
    );
  }

  const actions: { href: string; icon: React.ElementType; title: string; desc: string; gradient: string; show: boolean }[] = [
    { href: "/invoices/new", icon: Plus, title: "Нова фактура", desc: "Създайте фактура", gradient: "from-blue-500 to-indigo-600", show: canCreateInvoice },
    { href: "/credit-notes/new", icon: MinusCircle, title: "Ново кредитно известие", desc: "Създайте кредитно известие", gradient: "from-red-500 to-rose-600", show: canCreditNotes },
    { href: "/debit-notes/new", icon: PlusCircle, title: "Ново дебитно известие", desc: "Създайте дебитно известие", gradient: "from-cyan-500 to-blue-600", show: canCreditNotes },
    { href: "/clients/new", icon: Users, title: "Нов клиент", desc: "Добавете клиент", gradient: "from-amber-500 to-orange-600", show: canCreateClient },
    { href: "/companies/new", icon: Building, title: "Нова компания", desc: "Добавете фирма", gradient: "from-emerald-500 to-teal-600", show: canCreateCompany },
    { href: "/products/new", icon: FileText, title: "Нов продукт", desc: "Добавете услуга", gradient: "from-slate-500 to-slate-600", show: canCreateProduct },
  ].filter((a) => a.show);

  if (actions.length === 0) {
    return null;
  }

  return (
    <Card className="lg:col-span-1 border border-border/50 shadow-md">
      <CardHeader className="pb-3 px-3 sm:px-6 pt-3 sm:pt-6">
        <CardTitle className="card-title">Бързи действия</CardTitle>
        <CardDescription className="card-description">
          Често използвани операции
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-1.5 px-3 sm:px-6 pb-3 sm:pb-6">
        {actions.map(({ href, icon: Icon, title, desc, gradient }) => (
          <Link key={href} href={href} className={linkClass}>
            <div
              className={`h-9 w-9 sm:h-10 sm:w-10 rounded-lg bg-linear-to-br ${gradient} flex items-center justify-center mr-2.5 sm:mr-3 shadow-xs`}
            >
              <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
            <div className="flex-1 text-left min-w-0">
              <p className="small-text font-medium truncate">{title}</p>
              <p className="tiny-text text-muted-foreground hidden sm:block">{desc}</p>
            </div>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}

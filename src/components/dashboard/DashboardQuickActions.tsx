"use client";

import Link from "next/link";
import {
  FileText,
  Users,
  Building,
  Plus,
  MinusCircle,
  PlusCircle,
  Zap,
  Settings,
  ClipboardList,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useSubscriptionLimit } from "@/hooks/useSubscriptionLimit";
import { Skeleton } from "@/components/ui/skeleton";
import { AppSectionKicker } from "@/components/app/AppSectionKicker";

const linkClass =
  "flex items-center w-full rounded-xl border border-transparent p-2 sm:p-2.5 transition-colors hover:border-border/60 hover:bg-muted/50";

export function DashboardQuickActions({
  hasInvoiceWorkspaceSetup = true,
}: {
  hasInvoiceWorkspaceSetup?: boolean;
}) {
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
      <Card className="relative overflow-hidden lg:col-span-1 border border-border/50 shadow-md">
        <div
          className="absolute left-0 right-0 top-0 h-[3px] bg-linear-to-r from-emerald-500 via-teal-500 to-cyan-500"
          aria-hidden
        />
        <CardHeader className="space-y-2 pb-3 px-3 pt-4 sm:px-6 sm:pt-6">
          <Skeleton className="h-6 w-32 rounded-full" />
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
    {
      href: hasInvoiceWorkspaceSetup ? "/invoices/new" : "/invoices",
      icon: Plus,
      title: hasInvoiceWorkspaceSetup ? "Нова фактура" : "Настрой фактуриране",
      desc: hasInvoiceWorkspaceSetup ? "Създайте фактура" : "Добавете фирма и клиент",
      gradient: "from-blue-500 to-indigo-600",
      show: canCreateInvoice,
    },
    { href: "/credit-notes/new", icon: MinusCircle, title: "Ново кредитно известие", desc: "Създайте кредитно известие", gradient: "from-red-500 to-rose-600", show: canCreditNotes },
    { href: "/debit-notes/new", icon: PlusCircle, title: "Ново дебитно известие", desc: "Създайте дебитно известие", gradient: "from-cyan-500 to-blue-600", show: canCreditNotes },
    { href: "/vat-protocols-117/new", icon: ClipboardList, title: "Протокол чл. 117", desc: "Самоначисляване на ДДС", gradient: "from-teal-500 to-cyan-600", show: canCreditNotes },
    { href: "/clients/new", icon: Users, title: "Нов клиент", desc: "Добавете клиент", gradient: "from-amber-500 to-orange-600", show: canCreateClient },
    { href: "/companies/new", icon: Building, title: "Нова компания", desc: "Добавете фирма", gradient: "from-emerald-500 to-teal-600", show: canCreateCompany },
    { href: "/products/new", icon: FileText, title: "Нов продукт", desc: "Добавете услуга", gradient: "from-slate-500 to-slate-600", show: canCreateProduct },
  ].filter((a) => a.show);

  if (actions.length === 0) {
    return null;
  }

  return (
    <Card className="relative overflow-hidden lg:col-span-1 border border-border/50 shadow-md">
      <div
        className="absolute left-0 right-0 top-0 h-[3px] bg-linear-to-r from-emerald-500 via-teal-500 to-cyan-500"
        aria-hidden
      />
      <CardHeader className="space-y-2 pb-3 px-3 pt-4 sm:px-6 sm:pt-6">
        <AppSectionKicker icon={Zap}>Бърз достъп</AppSectionKicker>
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
        <div className="mt-3 rounded-xl border border-border/50 bg-muted/30 px-3 py-2.5">
          <Link
            href="/settings/invoice-preferences"
            className="flex items-start gap-2 text-left text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <Settings className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
            <span>
              <span className="font-medium text-foreground">Префикс и номерация</span> — по желание напр.{" "}
              <span className="font-mono">Ф-</span> преди цифрите, нулиране всяка година и начален номер.{" "}
              <span className="text-primary underline-offset-2 hover:underline">Настройки → Фактури</span>
            </span>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

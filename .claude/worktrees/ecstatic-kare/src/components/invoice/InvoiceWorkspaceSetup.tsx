import Link from "next/link";
import { ArrowRight, Building2, CheckCircle2, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface InvoiceWorkspaceSetupProps {
  hasCompanies: boolean;
  hasClients: boolean;
  title?: string;
  description?: string;
}

function SetupRequirementCard({
  title,
  description,
  href,
  cta,
  icon: Icon,
  isComplete,
  gradient,
}: {
  title: string;
  description: string;
  href: string;
  cta: string;
  icon: typeof Building2;
  isComplete: boolean;
  gradient: string;
}) {
  return (
    <Card
      className={cn(
        "relative overflow-hidden border-border/70 bg-card/95 shadow-sm transition-all",
        isComplete && "border-emerald-500/30 bg-emerald-500/5"
      )}
    >
      <div className={cn("h-1 w-full bg-linear-to-r", isComplete ? "from-emerald-500 to-teal-500" : gradient)} />
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className={cn(
            "flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-sm",
            isComplete ? "bg-linear-to-br from-emerald-500 to-teal-500" : `bg-linear-to-br ${gradient}`
          )}>
            <Icon className="h-5 w-5" />
          </div>
          <span
            className={cn(
              "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium",
              isComplete
                ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400"
            )}
          >
            {isComplete ? "Готово" : "Нужно"}
          </span>
        </div>
        <CardTitle className="pt-3 text-lg">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {isComplete ? (
          <div className="flex items-center gap-2 text-sm font-medium text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-4 w-4" />
            Добавено е успешно
          </div>
        ) : (
          <Button asChild className="w-full justify-center gap-2 sm:w-auto">
            <Link href={href}>
              {cta}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export function InvoiceWorkspaceSetup({
  hasCompanies,
  hasClients,
  title = "Стъпки за първа фактура",
  description = "Добавете фирма и клиент веднъж — след това всяка нова фактура е с няколко клика.",
}: InvoiceWorkspaceSetupProps) {
  const isReady = hasCompanies && hasClients;

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-border/70 bg-linear-to-br from-card via-card to-primary/5 shadow-sm">
        <CardContent className="space-y-5 p-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
            <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
              {description}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-border/60 bg-background/80 p-4">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                Компании
              </p>
              <p className="mt-2 text-lg font-semibold">{hasCompanies ? "Готово" : "Липсва"}</p>
            </div>
            <div className="rounded-2xl border border-border/60 bg-background/80 p-4">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                Клиенти
              </p>
              <p className="mt-2 text-lg font-semibold">{hasClients ? "Готово" : "Липсва"}</p>
            </div>
            <div className="rounded-2xl border border-primary/15 bg-primary/5 p-4">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                Статус
              </p>
              <p className="mt-2 text-lg font-semibold text-primary">
                {isReady ? "Може да фактурирате" : "Нужни са 2 стъпки"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <SetupRequirementCard
          title="Добавете компания"
          description="Това е фирмата издател, която ще се показва във фактурите и ще определя номерацията."
          href="/companies/new"
          cta="Създай компания"
          icon={Building2}
          isComplete={hasCompanies}
          gradient="from-slate-500 to-slate-700"
        />
        <SetupRequirementCard
          title="Добавете клиент"
          description="Фактурите се издават към съществуващи клиенти, затова добавете поне един запис в базата."
          href="/clients/new"
          cta="Създай клиент"
          icon={Users}
          isComplete={hasClients}
          gradient="from-amber-500 to-orange-600"
        />
      </div>
    </div>
  );
}

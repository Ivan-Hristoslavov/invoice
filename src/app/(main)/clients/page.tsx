import Link from "next/link";
import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Building, Plus, Search, Users, Mail, Phone, MapPin, ArrowUpRight, Lock, AlertTriangle, XCircle, Crown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CardStatsMetric } from "@/components/ui/CardStatsMetric";
import { Button } from "@/components/ui/button";
import { Button as RadixButton } from "@radix-ui/themes";
import { APP_NAME } from "@/config/constants";
import { createAdminClient } from "@/lib/supabase/server";
import { Input } from "@/components/ui/input";
import { redirect } from "next/navigation";
import { PLAN_LIMITS } from "@/middleware/subscription";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { UsageCounter } from "@/components/ui/pro-feature-lock";

export const metadata: Metadata = {
  title: `Клиенти | ${APP_NAME}`,
  description: "Управлявайте вашите клиенти",
};

export default async function ClientsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/signin");
  }

  const supabase = createAdminClient();
  
  // Fetch clients
  const { data: clients, error } = await supabase
    .from("Client")
    .select("*")
    .eq("userId", session.user.id)
    .order("name", { ascending: true });
  
  if (error) {
    console.error("Error fetching clients:", error);
  }
  
  const clientsList = clients || [];

  // Get invoice counts per client
  const { data: invoiceCounts } = await supabase
    .from("Invoice")
    .select("clientId")
    .eq("userId", session.user.id);
  
  const clientInvoiceCounts = (invoiceCounts || []).reduce((acc: Record<string, number>, inv: any) => {
    acc[inv.clientId] = (acc[inv.clientId] || 0) + 1;
    return acc;
  }, {});

  // Get user's subscription plan
  const { data: subscriptions } = await supabase
    .from("Subscription")
    .select("*")
    .eq("userId", session.user.id)
    .in("status", ["ACTIVE", "TRIALING", "PAST_DUE"])
    .limit(1);
  
  const subscription = subscriptions && subscriptions.length > 0 ? subscriptions[0] : null;
  const plan = (subscription?.plan || "FREE") as keyof typeof PLAN_LIMITS;
  const limits = PLAN_LIMITS[plan];
  const clientLimit = limits.maxClients === Infinity ? -1 : limits.maxClients;
  const canCreateClient = clientLimit === -1 || clientsList.length < clientLimit;
  const clientsRemaining = clientLimit === -1 ? Infinity : clientLimit - clientsList.length;
  const isApproachingLimit = clientLimit !== -1 && clientsRemaining > 0 && clientsRemaining <= 2;
  const isAtLimit = clientLimit !== -1 && clientsRemaining <= 0;

  // Generate avatar colors based on client name
  const getAvatarGradient = (name: string) => {
    const gradients = [
      "from-blue-500 to-indigo-600",
      "from-emerald-500 to-teal-600",
      "from-amber-500 to-orange-600",
      "from-slate-500 to-slate-600",
      "from-cyan-500 to-teal-600",
      "from-cyan-500 to-blue-600",
    ];
    const index = name.charCodeAt(0) % gradients.length;
    return gradients[index];
  };

  return (
    <div className="space-y-6">
      {/* Soft Upgrade Prompts */}
      {isApproachingLimit && (
        <Alert className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="flex items-center justify-between">
            <span className="text-amber-800 dark:text-amber-200">
              {clientsRemaining === 1 ? (
                <>Остава ви само <strong>1 клиент</strong> в {plan} плана.</>
              ) : (
                <>Остават ви само <strong>{clientsRemaining} клиента</strong> в {plan} плана.</>
              )}
              {' '}Надградете за повече клиенти.
            </span>
            <Link href="/settings/subscription">
              <Button size="sm" variant="outline" className="ml-4 border-amber-300 text-amber-700 hover:bg-amber-100">
                <Crown className="h-4 w-4 mr-2" />
                Надградете
              </Button>
            </Link>
          </AlertDescription>
        </Alert>
      )}
      
      {isAtLimit && (
        <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/30">
          <XCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="flex items-center justify-between">
            <span className="text-red-800 dark:text-red-200">
              Достигнахте лимита от <strong>{clientLimit} клиента</strong> за {plan} плана.
              {plan === 'FREE' && ' Надградете до STARTER за до 25 клиента или до PRO за до 100.'}
              {plan === 'STARTER' && ' Надградете до PRO за до 100 клиента или до BUSINESS за неограничени.'}
              {plan === 'PRO' && ' Надградете до BUSINESS за неограничени клиенти.'}
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
            <h1 className="text-3xl font-bold tracking-tight">Клиенти</h1>
            {clientLimit !== -1 && (
              <UsageCounter 
                used={clientsList.length} 
                limit={clientLimit}
                label=""
              />
            )}
          </div>
          <p className="text-muted-foreground mt-1">
            Управлявайте вашите клиенти и контакти
          </p>
        </div>
        {canCreateClient ? (
          <RadixButton 
            asChild 
            size="3" 
            variant="solid" 
            color="green"
            className="shadow-lg"
          >
            <Link href="/clients/new">
              <Plus className="mr-2 h-5 w-5" />
              Нов клиент
            </Link>
          </RadixButton>
        ) : (
          <RadixButton 
            asChild 
            size="3" 
            variant="soft" 
            color="gray"
            className="shadow-lg"
          >
            <Link href="/settings/subscription">
              <Lock className="mr-2 h-4 w-4" />
              Надграждане за повече клиенти
            </Link>
          </RadixButton>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <CardStatsMetric
          title="Общо клиенти"
          value={clientsList.length}
          icon={Users}
          gradient="from-amber-500 to-orange-600"
        />
        <CardStatsMetric
          title="С фактури"
          value={Object.keys(clientInvoiceCounts).length}
          valueClassName="text-blue-600"
          icon={Building}
          gradient="from-blue-500 to-indigo-600"
        />
      </div>

      {/* Search */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input 
              placeholder="Търсене по име, имейл или телефон..." 
              className="pl-10 h-11 border-border"
            />
          </div>
        </CardContent>
      </Card>

      {/* Clients Grid */}
      {clientsList.length === 0 ? (
        <Card className="border-0 shadow-lg">
          <CardContent className="py-16">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-1">Все още нямате клиенти</h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-sm">
                Добавете първия си клиент, за да започнете да създавате фактури
              </p>
              <Button asChild>
                <Link href="/clients/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Добави първия клиент
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {clientsList.map((client: any) => (
            <Link key={client.id} href={`/clients/${client.id}`}>
              <Card className="h-full border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${getAvatarGradient(client.name)} flex items-center justify-center text-white font-bold text-lg shadow-lg`}>
                      {client.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold truncate group-hover:text-primary transition-colors">
                            {client.name}
                          </h3>
                          {client.bulstatNumber && (
                            <p className="text-xs text-muted-foreground">
                              ЕИК: {client.bulstatNumber}
                            </p>
                          )}
                        </div>
                        <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      
                      <div className="mt-3 space-y-1.5">
                        {client.email && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Mail className="h-3.5 w-3.5" />
                            <span className="truncate">{client.email}</span>
                          </div>
                        )}
                        {client.phone && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Phone className="h-3.5 w-3.5" />
                            <span>{client.phone}</span>
                          </div>
                        )}
                        {(client.city || client.country) && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MapPin className="h-3.5 w-3.5" />
                            <span>{[client.city, client.country].filter(Boolean).join(", ")}</span>
                          </div>
                        )}
                      </div>
                      
                      {clientInvoiceCounts[client.id] > 0 && (
                        <div className="mt-4 pt-3 border-t">
                          <span className="text-xs font-medium text-muted-foreground">
                            {clientInvoiceCounts[client.id]} {clientInvoiceCounts[client.id] === 1 ? 'фактура' : 'фактури'}
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

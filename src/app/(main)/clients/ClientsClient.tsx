"use client";

import { useState } from "react";
import Link from "next/link";
import { Building, Plus, Search, Users, Lock, AlertTriangle, XCircle, Crown, LayoutGrid, List } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { CardStatsMetric } from "@/components/ui/CardStatsMetric";
import { Button } from "@/components/ui/button";
import { Button as RadixButton } from "@radix-ui/themes";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { UsageCounter } from "@/components/ui/pro-feature-lock";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Client {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  city?: string;
  country?: string;
  bulstatNumber?: string;
}

interface ClientsClientProps {
  clients: Client[];
  invoiceCounts: Record<string, number>;
  plan: string;
  clientLimit: number;
  canCreateClient: boolean;
  clientsRemaining: number;
  isApproachingLimit: boolean;
  isAtLimit: boolean;
}

export default function ClientsClient({
  clients,
  invoiceCounts,
  plan,
  clientLimit,
  canCreateClient,
  clientsRemaining,
  isApproachingLimit,
  isAtLimit,
}: ClientsClientProps) {
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredClients = clients.filter((client) => {
    const query = searchQuery.toLowerCase();
    return (
      client.name.toLowerCase().includes(query) ||
      client.email?.toLowerCase().includes(query) ||
      client.phone?.includes(query)
    );
  });

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
                used={clients.length} 
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
          value={clients.length}
          icon={Users}
          gradient="from-amber-500 to-orange-600"
        />
        <CardStatsMetric
          title="С фактури"
          value={Object.keys(invoiceCounts).length}
          valueClassName="text-blue-600"
          icon={Building}
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
                placeholder="Търсене по име, имейл или телефон..." 
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

      {/* Empty State */}
      {filteredClients.length === 0 ? (
        <Card className="border-0 shadow-lg">
          <CardContent className="py-16">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-1">
                {searchQuery ? "Няма намерени клиенти" : "Все още нямате клиенти"}
              </h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-sm">
                {searchQuery 
                  ? "Опитайте с друга ключова дума" 
                  : "Добавете първия си клиент, за да започнете да създавате фактури"}
              </p>
              {!searchQuery && (
                <Button asChild>
                  <Link href="/clients/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Добави първия клиент
                  </Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : viewMode === "cards" ? (
        /* Cards View */
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredClients.map((client) => (
            <Link key={client.id} href={`/clients/${client.id}`}>
              <Card className="h-full min-h-[140px] border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group cursor-pointer">
                <CardContent className="p-5 h-full flex flex-col items-center text-center">
                  {/* Name */}
                  <h3 className="font-semibold text-lg group-hover:text-primary transition-colors truncate w-full">
                    {client.name}
                  </h3>
                  
                  {/* Contact Info */}
                  <div className="mt-2 space-y-1 text-sm text-muted-foreground w-full">
                    {client.email && (
                      <p className="truncate">{client.email}</p>
                    )}
                    {client.phone && (
                      <p>{client.phone}</p>
                    )}
                    {(client.city || client.country) && (
                      <p>{[client.city, client.country].filter(Boolean).join(", ")}</p>
                    )}
                  </div>
                  
                  {/* Invoice Count */}
                  <div className="mt-auto pt-3 w-full border-t">
                    <span className="text-xs font-medium text-muted-foreground">
                      {invoiceCounts[client.id] || 0} {(invoiceCounts[client.id] || 0) === 1 ? 'фактура' : 'фактури'}
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
                <TableHead className="font-medium text-muted-foreground">Име</TableHead>
                <TableHead className="font-medium text-muted-foreground">Имейл</TableHead>
                <TableHead className="font-medium text-muted-foreground">Телефон</TableHead>
                <TableHead className="font-medium text-muted-foreground">Локация</TableHead>
                <TableHead className="font-medium text-muted-foreground text-center">Фактури</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClients.map((client) => (
                <TableRow 
                  key={client.id} 
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => window.location.href = `/clients/${client.id}`}
                >
                  <TableCell>
                    <div>
                      <p className="font-medium">{client.name}</p>
                      {client.bulstatNumber && (
                        <p className="text-xs text-muted-foreground">ЕИК: {client.bulstatNumber}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {client.email || "-"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {client.phone || "-"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {[client.city, client.country].filter(Boolean).join(", ") || "-"}
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="inline-flex items-center justify-center min-w-[2rem] px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                      {invoiceCounts[client.id] || 0}
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

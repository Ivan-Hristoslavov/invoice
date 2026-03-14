"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Building, Plus, Search, Users, Lock, AlertTriangle, XCircle, Crown, LayoutGrid, List, Pencil } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { CardStatsMetric } from "@/components/ui/CardStatsMetric";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { UsageCounter } from "@/components/ui/pro-feature-lock";
import { Pagination } from "@/components/ui/pagination";
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

const ITEMS_PER_PAGE = 12;

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
  const [currentPage, setCurrentPage] = useState(1);

  // Reset to first page when search changes
  useEffect(() => { setCurrentPage(1); }, [searchQuery]);

  const filteredClients = clients.filter((client) => {
    const query = searchQuery.toLowerCase();
    return (
      client.name.toLowerCase().includes(query) ||
      client.email?.toLowerCase().includes(query) ||
      client.phone?.includes(query)
    );
  });

  const totalPages = Math.ceil(filteredClients.length / ITEMS_PER_PAGE);
  const paginatedClients = filteredClients.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

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
              <Button size="sm" className="ml-4 bg-linear-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white">
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
          <Link href="/clients/new">
            <Button
              size="3"
              variant="solid"
              color="green"
              className="shadow-lg gap-2 whitespace-nowrap"
            >
              <Plus className="h-5 w-5" />
              Нов клиент
            </Button>
          </Link>
        ) : (
          <Link href="/settings/subscription">
            <Button
              size="3"
              variant="soft"
              color="gray"
              className="shadow-lg gap-2 whitespace-nowrap"
            >
              <Lock className="h-4 w-4" />
              Надграждане за повече клиенти
            </Button>
          </Link>
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
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input 
                placeholder="Търсене по име, имейл или телефон..." 
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
                <Link href="/clients/new">
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Добави първия клиент
                  </Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      ) : viewMode === "cards" ? (
        /* Cards View */
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {paginatedClients.map((client) => (
            <div key={client.id} className="group relative">
              <Card
                className="h-full min-h-[150px] border-0 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl cursor-pointer"
                onClick={() => window.location.href = `/clients/${client.id}`}
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
                    <Link href={`/clients/${client.id}/edit`} className="flex items-center gap-1.5 whitespace-nowrap">
                      <Pencil className="h-3.5 w-3.5" />
                      Редакция
                    </Link>
                  </Button>
                </div>
                <CardContent className="flex h-full flex-col items-center p-4 text-center sm:p-5">
                  {/* Name */}
                  <h3 className="w-full truncate text-base font-semibold transition-colors group-hover:text-primary sm:text-lg">
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
            </div>
          ))}
        </div>
      ) : (
        /* Table View */
        <Card className="hidden overflow-hidden border-0 shadow-lg sm:block">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-border/50">
                <TableHead className="font-medium text-muted-foreground">Име</TableHead>
                <TableHead className="font-medium text-muted-foreground">Имейл</TableHead>
                <TableHead className="font-medium text-muted-foreground">Телефон</TableHead>
                <TableHead className="font-medium text-muted-foreground">Локация</TableHead>
                <TableHead className="font-medium text-muted-foreground text-center">Фактури</TableHead>
                <TableHead className="w-[120px] text-right font-medium text-muted-foreground">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedClients.map((client) => (
                <TableRow
                  key={client.id}
                  className="group cursor-pointer transition-colors hover:bg-muted/50"
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
                    <span className="inline-flex items-center justify-center min-w-8 px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                      {invoiceCounts[client.id] || 0}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div
                      className="flex justify-end opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <Button asChild size="sm" variant="ghost" className="h-8 rounded-full px-3">
                        <Link href={`/clients/${client.id}/edit`} className="flex items-center gap-1.5 whitespace-nowrap">
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
            {(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filteredClients.length)} от {filteredClients.length} клиента
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

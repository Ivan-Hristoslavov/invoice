"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Building, Plus, Search, Users, Lock, LayoutGrid, List, Pencil, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { AppSectionKicker } from "@/components/app/AppSectionKicker";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { CardStatsMetric } from "@/components/ui/CardStatsMetric";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UsageCounter, LimitBanner } from "@/components/ui/pro-feature-lock";
import { EmptyState } from "@/components/ui/empty-state";
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
  createdById?: string | null;
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
  createdByMap?: Record<string, { name: string | null; email?: string | null }>;
}

const ITEMS_PER_PAGE = 12;

function clientInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2)
    return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
  return name.slice(0, 2).toUpperCase() || "—";
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
  createdByMap = {},
}: ClientsClientProps) {
  const router = useRouter();
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
    <div className="app-page-shell min-w-0">
      {/* Soft Upgrade Prompts */}
      {isApproachingLimit && (
        <LimitBanner
          variant="warning"
          message={clientsRemaining === 1
            ? <><strong>Остава 1 клиент</strong> в плана. Надградете за повече и търсене по ЕИК.</>
            : <><strong>Остават {clientsRemaining} клиента</strong> в плана. Надградете за повече и търсене по ЕИК.</>
          }
        />
      )}

      {isAtLimit && (
        <LimitBanner
          variant="error"
          message={<>Лимитът за клиенти е достигнат. С по-висок план добавяте повече и ползвате ЕИК.</>}
          linkText="Отключете повече клиенти →"
        />
      )}

      {/* Header */}
      <div className="page-header">
        <div className="min-w-0 flex-1 space-y-2">
          <AppSectionKicker icon={Users}>Контакти</AppSectionKicker>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="page-title">Клиенти</h1>
            {clientLimit !== -1 && (
              <UsageCounter
                used={clients.length}
                limit={clientLimit}
                label=""
              />
            )}
          </div>
          <p className="card-description">
            Управлявайте клиентите и контактите си на едно място
          </p>
        </div>
        <div className="page-header-actions w-full sm:w-auto">
          {canCreateClient ? (
            <Link href="/clients/new" className="block w-full sm:inline-block sm:w-auto">
              <Button
                size="3"
                variant="solid"
                color="green"
                className="w-full gap-2 whitespace-nowrap shadow-lg sm:w-auto"
              >
                <Plus className="h-5 w-5" />
                Нов клиент
              </Button>
            </Link>
          ) : (
            <Link href="/settings/subscription" className="block w-full sm:inline-block sm:w-auto">
              <Button
                size="3"
                variant="soft"
                color="gray"
                className="w-full gap-2 whitespace-nowrap shadow-lg sm:w-auto"
              >
                <Lock className="h-4 w-4" />
                Надграждане за повече клиенти
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid w-full min-w-0 grid-cols-2 gap-1 sm:gap-3 lg:grid-cols-4 lg:max-w-2xl">
        <CardStatsMetric compact title="Общо клиенти" value={clients.length} icon={Users} />
        <CardStatsMetric
          compact
          title="С фактури"
          value={Object.keys(invoiceCounts).length}
          icon={Building}
        />
      </div>

      {/* Search & View Toggle */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-3 sm:p-4">
          <div className="flex flex-col gap-3 min-[420px]:flex-row min-[420px]:items-center min-[420px]:gap-3">
            <div className="relative min-w-0 w-full flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Търсене по име, имейл или телефон..."
                className="h-10 min-h-11 border-border pl-10 text-base sm:h-11 sm:text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex shrink-0 items-center justify-stretch gap-1 rounded-lg bg-muted/50 p-1 min-[420px]:justify-center">
              <Button
                variant={viewMode === "cards" ? "default" : "ghost"}
                size="sm"
                type="button"
                onClick={() => setViewMode("cards")}
                className="h-9 min-h-9 flex-1 px-2 min-[420px]:flex-none min-[420px]:px-3"
                aria-pressed={viewMode === "cards"}
                aria-label="Картичен изглед"
              >
                <LayoutGrid className="mx-auto h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "table" ? "default" : "ghost"}
                size="sm"
                type="button"
                onClick={() => setViewMode("table")}
                className="h-9 min-h-9 flex-1 px-2 min-[420px]:flex-none min-[420px]:px-3"
                aria-pressed={viewMode === "table"}
                aria-label="Табличен изглед"
              >
                <List className="mx-auto h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Empty State */}
      {filteredClients.length === 0 ? (
        <Card className="border-0 shadow-lg">
          <CardContent className="p-0">
            <EmptyState
              icon={Users}
              heading={searchQuery ? "Няма намерени клиенти" : "Все още нямате клиенти"}
              description={searchQuery ? "Опитайте с друга ключова дума" : "Добавете първия си клиент, за да започнете да създавате фактури"}
              action={!searchQuery ? (
                <Button asChild>
                  <Link href="/clients/new" className="gap-2">
                    <Plus className="h-4 w-4" />
                    Добави първия клиент
                  </Link>
                </Button>
              ) : undefined}
            />
          </CardContent>
        </Card>
      ) : viewMode === "cards" ? (
        /* Cards View */
        <div className="grid min-w-0 grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
          {paginatedClients.map((client) => (
            <div key={client.id} className="group relative min-w-0">
              <Card
                variant="secondary"
                className="h-full cursor-pointer rounded-xl border border-border/50 bg-card/90 shadow-none transition-[border-color,background-color,box-shadow] hover:border-primary/35 hover:bg-muted/25 hover:shadow-sm"
                onClick={() => router.push(`/clients/${client.id}`)}
              >
                <div
                  className="absolute right-2 top-2 z-10 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100"
                  onClick={(event) => event.stopPropagation()}
                >
                  <Button
                    asChild
                    size="sm"
                    variant="outline"
                    className="h-7 rounded-lg border-border/60 bg-background/95 px-2 text-xs shadow-sm backdrop-blur-sm"
                  >
                    <Link href={`/clients/${client.id}/edit`} className="flex items-center gap-1 whitespace-nowrap">
                      <Pencil className="h-3 w-3" />
                      Редакция
                    </Link>
                  </Button>
                </div>
                <CardContent className="!p-0">
                  <div className="flex flex-col gap-2.5 p-3 sm:flex-row sm:items-stretch sm:gap-3 sm:p-3.5">
                    <div className="flex min-w-0 items-start gap-3 sm:min-w-0 sm:flex-1">
                      <div
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 text-sm font-bold text-primary sm:h-[52px] sm:w-[52px] sm:text-base"
                        aria-hidden
                      >
                        {clientInitials(client.name)}
                      </div>
                      <div className="min-w-0 flex-1 pr-10 sm:pr-12">
                        <CardTitle className="line-clamp-2 text-sm font-semibold leading-snug text-foreground group-hover:text-primary sm:text-base">
                          {client.name}
                        </CardTitle>
                        <CardDescription className="mt-1 space-y-0.5 text-xs leading-relaxed sm:mt-1.5 sm:text-sm">
                          {client.email && <p className="truncate text-muted-foreground">{client.email}</p>}
                          {client.phone && <p className="text-muted-foreground">{client.phone}</p>}
                          {(client.city || client.country) && (
                            <p className="line-clamp-1 text-muted-foreground">
                              {[client.city, client.country].filter(Boolean).join(", ")}
                            </p>
                          )}
                          {!client.email && !client.phone && !(client.city || client.country) && (
                            <p className="text-muted-foreground/80">Няма контактни данни</p>
                          )}
                        </CardDescription>
                        {client.createdById && createdByMap[client.createdById] && (
                          <p className="mt-1 text-[11px] text-muted-foreground">
                            От {createdByMap[client.createdById].name ?? "—"}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-3 border-t border-border/40 pt-2.5 sm:w-[5.5rem] sm:min-w-[5.5rem] sm:flex-col sm:items-end sm:justify-center sm:border-l sm:border-t-0 sm:pt-0 sm:pl-3 sm:shrink-0">
                      <div className="text-left sm:w-full sm:text-right">
                        <span className="text-lg font-bold tabular-nums text-foreground">
                          {invoiceCounts[client.id] || 0}
                        </span>
                        <p className="max-w-[5rem] text-[10px] font-medium leading-tight text-muted-foreground sm:mx-0 sm:ml-auto sm:text-[11px]">
                          {(invoiceCounts[client.id] || 0) === 1 ? "фактура" : "фактури"}
                        </p>
                      </div>
                      <ChevronRight
                        className="h-4 w-4 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5 group-hover:text-primary sm:hidden"
                        aria-hidden
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      ) : (
        <Table
          variant="secondary"
          stickyHeader
          className="min-w-0 rounded-2xl border border-border/50 bg-card shadow-sm"
          contentAriaLabel="Списък с клиенти"
          contentClassName="min-w-[920px]"
          scrollContainerClassName="overflow-x-auto overscroll-x-contain"
        >
          <TableHeader
            sticky
            className="border-b border-border/50 bg-muted/40 backdrop-blur-sm dark:bg-muted/25"
          >
            <TableRow className="border-0 hover:bg-transparent">
              <TableHead className="w-[22%] text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Име
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Имейл</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Телефон</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Локация</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Създадена от</TableHead>
              <TableHead className="text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Фактури
              </TableHead>
              <TableHead className="w-[120px] text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Действия
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedClients.map((client, index) => (
              <TableRow
                key={client.id}
                className={cn(
                  "group cursor-pointer border-b border-border/30 transition-colors last:border-0",
                  "hover:bg-primary/[0.04] dark:hover:bg-primary/[0.07]",
                  index % 2 === 1 && "bg-muted/20 dark:bg-muted/10"
                )}
                onClick={() => router.push(`/clients/${client.id}`)}
              >
                <TableCell className="py-2 sm:py-3.5">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">{client.name}</p>
                    {client.bulstatNumber && (
                      <p className="text-xs text-muted-foreground">ЕИК: {client.bulstatNumber}</p>
                    )}
                  </div>
                </TableCell>
                <TableCell className="max-w-[200px] py-2 text-sm text-muted-foreground sm:py-3.5">
                  <span className="line-clamp-2">{client.email || "—"}</span>
                </TableCell>
                <TableCell className="py-2 text-sm text-muted-foreground sm:py-3.5">{client.phone || "—"}</TableCell>
                <TableCell className="max-w-[180px] py-2 text-sm text-muted-foreground sm:py-3.5">
                  <span className="line-clamp-2">
                    {[client.city, client.country].filter(Boolean).join(", ") || "—"}
                  </span>
                </TableCell>
                <TableCell className="py-2 text-sm text-muted-foreground sm:py-3.5">
                  {client.createdById && createdByMap[client.createdById]
                    ? createdByMap[client.createdById].name ?? "—"
                    : "—"}
                </TableCell>
                <TableCell className="py-2 text-center sm:py-3.5">
                  <span className="inline-flex min-w-8 items-center justify-center rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                    {invoiceCounts[client.id] || 0}
                  </span>
                </TableCell>
                <TableCell className="py-2 text-right sm:py-3.5">
                  <div
                    className="flex justify-end opacity-100 transition-opacity duration-200 sm:opacity-0 sm:group-hover:opacity-100"
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
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col items-center gap-3 pt-3 sm:flex-row sm:items-center sm:justify-between sm:pt-2">
          <p className="order-2 text-center text-xs text-muted-foreground sm:order-1 sm:text-left sm:text-sm">
            {(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filteredClients.length)} от {filteredClients.length} клиента
          </p>
          <div className="order-1 flex w-full justify-center overflow-x-auto pb-1 sm:order-2 sm:w-auto sm:justify-end sm:pb-0">
            <Pagination
              className="shrink-0"
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              size="sm"
            />
          </div>
        </div>
      )}
    </div>
  );
}

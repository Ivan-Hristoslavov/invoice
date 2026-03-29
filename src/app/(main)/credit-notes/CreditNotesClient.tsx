"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { bg } from "date-fns/locale";
import { ArrowUpRight, Receipt, FileText, Calendar, Plus } from "lucide-react";
import { cn, formatPrice } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CardStatsMetric } from "@/components/ui/CardStatsMetric";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export interface CreditNoteListItem {
  id: string;
  creditNoteNumber: string;
  issueDate: string;
  reason: string | null;
  subtotal: number;
  taxAmount: number;
  total: number;
  currency: string;
  invoiceId: string;
  invoice?: { invoiceNumber: string };
  client?: { id: string; name: string };
  company?: { id: string; name: string };
}

interface CreditNotesClientProps {
  creditNotes: CreditNoteListItem[];
}

export default function CreditNotesClient({ creditNotes }: CreditNotesClientProps) {
  const router = useRouter();

  const totalCreditNotes = creditNotes.length;
  const totalAmount = creditNotes.reduce((sum, cn) => sum + Number(cn.total), 0);
  const thisMonthStart = new Date();
  thisMonthStart.setDate(1);
  thisMonthStart.setHours(0, 0, 0, 0);
  const thisMonthCreditNotes = creditNotes.filter((cn) => new Date(cn.issueDate) >= thisMonthStart);
  const thisMonthAmount = thisMonthCreditNotes.reduce((sum, cn) => sum + Number(cn.total), 0);

  return (
    <>
      <div className="mx-auto grid max-w-3xl grid-cols-2 gap-2 sm:max-w-4xl sm:gap-2.5 lg:max-w-none lg:grid-cols-4">
        <CardStatsMetric
          title="Общо известия"
          value={totalCreditNotes}
          icon={Receipt}
          gradient="from-blue-500 to-indigo-600"
        />
        <CardStatsMetric
          title="Обща стойност"
          value={totalAmount}
          valueSuffix="€"
          icon={FileText}
          gradient="from-red-500 to-rose-600"
        />
        <CardStatsMetric
          title="Този месец"
          value={thisMonthCreditNotes.length}
          icon={Calendar}
          gradient="from-amber-500 to-orange-600"
        />
        <CardStatsMetric
          title="Стойност този месец"
          value={thisMonthAmount}
          valueSuffix="€"
          icon={Receipt}
          gradient="from-violet-500 to-purple-600"
        />
      </div>

      {creditNotes.length === 0 ? (
        <Card className="border border-border/40 shadow-sm">
          <CardContent className="py-16">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <Receipt className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="mb-1 text-lg font-semibold">Няма кредитни известия</h3>
              <p className="mb-6 max-w-sm text-sm text-muted-foreground">
                Кредитните известия се използват за възстановяване на пари при връщане на продукт
              </p>
              <Button asChild>
                <Link href="/credit-notes/new" className="flex items-center whitespace-nowrap">
                  <Plus className="mr-2 h-4 w-4" />
                  Създай кредитно известие
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border border-border/40 shadow-sm">
          <CardHeader className="space-y-1 pb-3 sm:pb-4">
            <Badge variant="info" className="mb-2">
              Документи
            </Badge>
            <CardTitle>Списък със сторно документи</CardTitle>
            <CardDescription>
              Общо {totalCreditNotes} {totalCreditNotes === 1 ? "документ" : "документа"}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="space-y-2 px-2 pb-4 md:hidden sm:px-3">
              {creditNotes.map((creditNote) => (
                <button
                  key={creditNote.id}
                  type="button"
                  onClick={() => router.push(`/credit-notes/${creditNote.id}`)}
                  className={cn(
                    "w-full rounded-xl border border-border/40 bg-muted/20 px-3 py-2.5 text-left transition-colors",
                    "hover:bg-muted/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 flex-1 items-start gap-2.5">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-500/10">
                        <Receipt className="h-4 w-4 text-red-600 dark:text-red-400" aria-hidden />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{creditNote.creditNoteNumber}</p>
                        <p className="line-clamp-1 text-xs text-muted-foreground">
                          {creditNote.client?.name ?? "—"} · {creditNote.company?.name ?? "—"}
                        </p>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-bold tabular-nums text-red-600">
                        -{formatPrice(Number(creditNote.total))} {creditNote.currency}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(creditNote.issueDate), "d MMM yyyy", { locale: bg })}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div className="hidden min-w-0 pb-4 md:block">
              <div className="overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-b from-muted/25 to-card/40 shadow-sm">
                <div className="min-w-0 overflow-x-auto">
              <Table
                variant="secondary"
                stickyHeader
                contentAriaLabel="Списък с кредитни известия"
                contentClassName="min-w-[900px] w-full table-fixed"
                scrollContainerClassName="overflow-x-auto overscroll-x-contain"
                className="invoices-table-flat data-table-polished min-w-0 rounded-none border-0 bg-transparent shadow-none"
                onRowAction={(key) => router.push(`/credit-notes/${String(key)}`)}
              >
                <TableHeader className="bg-muted/35">
                  <TableHead
                    isRowHeader
                    className="w-[16%] px-4 py-2 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground"
                  >
                    Номер
                  </TableHead>
                  <TableHead className="w-[14%] px-4 py-2 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Фактура
                  </TableHead>
                  <TableHead className="w-[18%] px-4 py-2 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Клиент
                  </TableHead>
                  <TableHead className="w-[18%] px-4 py-2 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Компания
                  </TableHead>
                  <TableHead className="w-[14%] px-4 py-2 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Сума
                  </TableHead>
                  <TableHead className="w-[12%] px-4 py-2 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Дата
                  </TableHead>
                  <TableHead className="w-[8%] px-4 py-2 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    <span className="sr-only">Преглед</span>
                  </TableHead>
                </TableHeader>
                <TableBody items={creditNotes}>
                  {(item) => {
                    const creditNote = item as CreditNoteListItem;
                    return (
                    <TableRow
                      key={creditNote.id}
                      id={creditNote.id}
                      className="group cursor-pointer transition-colors hover:bg-muted/40 dark:hover:bg-muted/20"
                    >
                      <TableCell className="px-4 py-3 align-middle">
                        <div className="flex min-w-0 items-center justify-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-500/10 shadow-inner">
                            <Receipt className="h-4 w-4 text-red-600 dark:text-red-400" aria-hidden />
                          </div>
                          <p className="truncate text-center text-sm font-semibold">{creditNote.creditNoteNumber}</p>
                        </div>
                      </TableCell>
                      <TableCell className="min-w-0 px-4 py-2.5 text-center">
                        {creditNote.invoiceId && creditNote.invoice ? (
                          <span className="text-sm text-muted-foreground">{creditNote.invoice.invoiceNumber}</span>
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="min-w-0 px-4 py-2.5 text-center">
                        <span className="line-clamp-2 text-sm text-muted-foreground">
                          {creditNote.client?.name ?? "—"}
                        </span>
                      </TableCell>
                      <TableCell className="min-w-0 px-4 py-2.5 text-center">
                        <span className="line-clamp-2 text-sm text-muted-foreground">
                          {creditNote.company?.name ?? "—"}
                        </span>
                      </TableCell>
                      <TableCell className="px-4 py-2.5 text-right align-middle">
                        <p className="text-sm font-bold tabular-nums text-red-600">
                          -{formatPrice(Number(creditNote.total))} {creditNote.currency}
                        </p>
                      </TableCell>
                      <TableCell className="px-4 py-2.5 text-center align-middle">
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(creditNote.issueDate), "d MMM yyyy", { locale: bg })}
                        </p>
                      </TableCell>
                      <TableCell className="px-4 py-2.5 text-center align-middle">
                        <div className="flex justify-center">
                          <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-60 transition-opacity group-hover:opacity-100" />
                        </div>
                      </TableCell>
                    </TableRow>
                    );
                  }}
                </TableBody>
              </Table>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}

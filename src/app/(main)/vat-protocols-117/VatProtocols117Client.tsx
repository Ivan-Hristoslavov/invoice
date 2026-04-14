"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { bg } from "date-fns/locale";
import {
  ClipboardList,
  Plus,
  MoreHorizontal,
  Eye,
  Download,
  Printer,
  Mail,
} from "lucide-react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuItemIcon,
  DropdownMenuItemText,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getVatProtocol117ScenarioLabel } from "@/lib/vat-protocol-117-scenarios";
import { printVatProtocol117Pdf } from "@/lib/vat-protocol-117-print-client";
import { toast } from "@/lib/toast";
import { useAsyncLock } from "@/hooks/use-async-lock";

export interface VatProtocol117ListItem {
  id: string;
  protocolNumber: string;
  issueDate: string;
  taxEventDate: string;
  scenario: string;
  subtotal: number;
  taxAmount: number;
  total: number;
  currency: string;
  clientId: string;
  companyId: string;
  client?: { id: string; name: string; email?: string | null };
  company?: { id: string; name: string };
}

interface Props {
  protocols: VatProtocol117ListItem[];
  canSendEmail: boolean;
}

function RowActions({
  protocolId,
  clientEmail,
  canSendEmail,
}: {
  protocolId: string;
  clientEmail?: string | null;
  canSendEmail: boolean;
}) {
  const sendLock = useAsyncLock();
  const pdfDownloadHref = `/api/vat-protocols-117/${protocolId}/export-pdf?disposition=attachment`;

  async function handleSendEmail() {
    void sendLock.run(async () => {
      try {
        const res = await fetch(`/api/vat-protocols-117/${protocolId}/send`, { method: "POST" });
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        if (!res.ok) {
          toast.error(data.error || "Неуспешно изпращане по имейл");
          return;
        }
        toast.success("Протоколът е изпратен на имейла на доставчика");
      } catch {
        toast.error("Неуспешно изпращане по имейл");
      }
    });
  }

  const canMail = Boolean(canSendEmail && clientEmail?.trim());

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Действия с протокол"
        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
        onClick={(e) => e.stopPropagation()}
      >
        <MoreHorizontal className="h-4 w-4" aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem asChild>
          <Link href={`/vat-protocols-117/${protocolId}`} onClick={(e) => e.stopPropagation()}>
            <DropdownMenuItemIcon>
              <Eye className="h-4 w-4" />
            </DropdownMenuItemIcon>
            <DropdownMenuItemText>Преглед</DropdownMenuItemText>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a
            href={pdfDownloadHref}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
          >
            <DropdownMenuItemIcon>
              <Download className="h-4 w-4" />
            </DropdownMenuItemIcon>
            <DropdownMenuItemText>Изтегли PDF</DropdownMenuItemText>
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={(e) => {
            e.stopPropagation();
            if (!printVatProtocol117Pdf(protocolId)) {
              toast.error(
                "Позволете изскачащи прозорци за този сайт или изтеглете PDF и печат оттам."
              );
            }
          }}
        >
          <DropdownMenuItemIcon>
            <Printer className="h-4 w-4" />
          </DropdownMenuItemIcon>
          <DropdownMenuItemText>Печат</DropdownMenuItemText>
        </DropdownMenuItem>
        {canSendEmail ? (
          <DropdownMenuItem
            isDisabled={!canMail || sendLock.isPending}
            onClick={(e) => {
              e.stopPropagation();
              void handleSendEmail();
            }}
          >
            <DropdownMenuItemIcon>
              <Mail className="h-4 w-4" />
            </DropdownMenuItemIcon>
            <DropdownMenuItemText>
              {sendLock.isPending ? "Изпращане…" : "Изпрати по имейл"}
            </DropdownMenuItemText>
          </DropdownMenuItem>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function VatProtocols117Client({ protocols, canSendEmail }: Props) {
  const router = useRouter();
  const n = protocols.length;
  const totalAmount = protocols.reduce((s, p) => s + Number(p.total), 0);
  const thisMonthStart = new Date();
  thisMonthStart.setDate(1);
  thisMonthStart.setHours(0, 0, 0, 0);
  const thisMonth = protocols.filter((p) => new Date(p.issueDate) >= thisMonthStart);

  if (protocols.length === 0) {
    return (
      <Card className="border border-border/40 shadow-sm">
        <CardContent className="py-16">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <ClipboardList className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mb-1 text-lg font-semibold">Няма протоколи</h3>
            <p className="mb-6 max-w-md text-sm text-muted-foreground">
              Създайте протокол по чл. 117 за ВОП, услуги от ЕС или други случаи с изискуем от вас
              ДДС.
            </p>
            <Button asChild>
              <Link href="/vat-protocols-117/new" className="flex items-center whitespace-nowrap">
                <Plus className="mr-2 h-4 w-4" />
                Нов протокол
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="mx-auto grid max-w-3xl grid-cols-2 gap-2 sm:max-w-4xl sm:gap-2.5 lg:max-w-none lg:grid-cols-4">
        <CardStatsMetric
          title="Протоколи"
          value={n}
          icon={ClipboardList}
          gradient="from-teal-500 to-cyan-600"
        />
        <CardStatsMetric
          title="Обща сума"
          value={totalAmount}
          valueSuffix="€"
          icon={ClipboardList}
          gradient="from-emerald-500 to-teal-600"
        />
        <CardStatsMetric
          title="Този месец"
          value={thisMonth.length}
          icon={ClipboardList}
          gradient="from-amber-500 to-orange-600"
        />
        <CardStatsMetric
          title="Сума този месец"
          value={thisMonth.reduce((s, p) => s + Number(p.total), 0)}
          valueSuffix="€"
          icon={ClipboardList}
          gradient="from-violet-500 to-purple-600"
        />
      </div>

      <Card className="border border-border/40 shadow-sm">
        <CardHeader className="space-y-1 pb-3 sm:pb-4">
          <Badge variant="info" className="mb-2">
            Документи
          </Badge>
          <CardTitle>Списък</CardTitle>
          <CardDescription>
            {n} {n === 1 ? "протокол" : "протокола"}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead isRowHeader>Номер</TableHead>
                  <TableHead>Дата</TableHead>
                  <TableHead>Сценарий</TableHead>
                  <TableHead>Доставчик</TableHead>
                  <TableHead className="text-right">Сума</TableHead>
                  <TableHead className="w-[52px] text-right"> </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {protocols.map((p) => (
                  <TableRow
                    key={p.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/vat-protocols-117/${p.id}`)}
                  >
                    <TableCell className="font-medium">{p.protocolNumber}</TableCell>
                    <TableCell>
                      {format(new Date(p.issueDate), "d MMM yyyy", { locale: bg })}
                    </TableCell>
                    <TableCell className="max-w-[220px] truncate text-sm text-muted-foreground">
                      {getVatProtocol117ScenarioLabel(p.scenario)}
                    </TableCell>
                    <TableCell>{p.client?.name ?? "—"}</TableCell>
                    <TableCell className="text-right">
                      {Number(p.total).toFixed(2)} {p.currency}
                    </TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <RowActions
                        protocolId={p.id}
                        clientEmail={p.client?.email}
                        canSendEmail={canSendEmail}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="space-y-2 px-2 pb-4 md:hidden sm:px-3">
            {protocols.map((p) => (
              <div
                key={p.id}
                className="flex gap-2 rounded-lg border border-border/60 p-3 text-sm hover:bg-muted/40"
              >
                <button
                  type="button"
                  className="min-w-0 flex-1 text-left"
                  onClick={() => router.push(`/vat-protocols-117/${p.id}`)}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">{p.protocolNumber}</span>
                    <span className="shrink-0 text-muted-foreground">
                      {format(new Date(p.issueDate), "d.MM.yyyy", { locale: bg })}
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                    {getVatProtocol117ScenarioLabel(p.scenario)}
                  </p>
                  <p className="mt-1 text-right font-medium">
                    {Number(p.total).toFixed(2)} {p.currency}
                  </p>
                </button>
                <div className="flex shrink-0 items-start pt-0.5">
                  <RowActions
                    protocolId={p.id}
                    clientEmail={p.client?.email}
                    canSendEmail={canSendEmail}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </>
  );
}

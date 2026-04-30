"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/lib/toast";
import { FileBadge2, Mail, Plus, Printer } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type Row = {
  id: string;
  proformaNumber: string;
  issueDate: string;
  status: string;
  total: number | string;
  paymentMethod?: string | null;
  accountType?: string | null;
  client?: { name?: string | null } | null;
};

export default function ProformaInvoicesClient({ initialRows }: { initialRows: Row[] }) {
  const router = useRouter();
  const [rows] = useState(initialRows);
  const [sendingId, setSendingId] = useState<string | null>(null);

  async function handleSend(id: string) {
    try {
      setSendingId(id);
      const response = await fetch(`/api/proforma-invoices/${id}/send`, { method: "POST" });
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) throw new Error(payload?.error || "Неуспешно изпращане");
      toast.success("Проформата е изпратена по имейл");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Неуспешно изпращане");
    } finally {
      setSendingId(null);
    }
  }

  function handlePrint(id: string) {
    const url = `/api/proforma-invoices/export-pdf?proformaId=${id}&disposition=inline`;
    window.open(url, "_blank");
  }

  return (
    <div className="space-y-4">
      <div className="page-header">
        <div className="space-y-1 min-w-0 flex-1">
          <h1 className="page-title">Проформа фактури</h1>
          <p className="card-description">
            Отделен регистър с независима номерация `PF-YYYY-000001`.
          </p>
        </div>
        <div className="page-header-actions w-full sm:w-auto">
          <Button asChild color="green" className="w-full sm:w-auto">
            <Link href="/proforma-invoices/new">
              <Plus className="h-4 w-4 mr-2" />
              Нова проформа
            </Link>
          </Button>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Списък</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 md:hidden">
            {rows.map((row) => (
              <div key={row.id} className="rounded-xl border border-border/40 bg-muted/20 px-3 py-2.5">
                <button
                  type="button"
                  onClick={() => router.push(`/proforma-invoices/${row.id}`)}
                  className="w-full text-left"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{row.proformaNumber}</p>
                      <p className="line-clamp-1 text-xs text-muted-foreground">
                        {row.client?.name || "-"} · {new Date(row.issueDate).toLocaleDateString("bg-BG")}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <Badge variant="outline">{row.status}</Badge>
                      <p className="mt-1 text-sm font-bold">{Number(row.total).toFixed(2)} €</p>
                    </div>
                  </div>
                </button>
                <div className="mt-2 flex items-center gap-2 border-t border-border/30 pt-2">
                  <Button size="sm" variant="outline" className="h-7" onClick={() => handlePrint(row.id)}>
                    <Printer className="h-3.5 w-3.5 mr-1" />
                    Печат
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7"
                    onClick={() => void handleSend(row.id)}
                    disabled={sendingId === row.id}
                  >
                    <Mail className="h-3.5 w-3.5 mr-1" />
                    Изпрати
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Проформа №</TableHead>
                  <TableHead>Клиент</TableHead>
                  <TableHead>Дата</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Плащане</TableHead>
                  <TableHead>Тип сметка</TableHead>
                  <TableHead className="text-right">Сума</TableHead>
                  <TableHead className="text-right">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <Link className="font-medium hover:underline" href={`/proforma-invoices/${row.id}`}>
                        {row.proformaNumber}
                      </Link>
                    </TableCell>
                    <TableCell>{row.client?.name || "-"}</TableCell>
                    <TableCell>{new Date(row.issueDate).toLocaleDateString("bg-BG")}</TableCell>
                    <TableCell>{row.status}</TableCell>
                    <TableCell>{row.paymentMethod || "-"}</TableCell>
                    <TableCell>{row.accountType || "-"}</TableCell>
                    <TableCell className="text-right">{Number(row.total).toFixed(2)} €</TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => handlePrint(row.id)}>
                          <Printer className="h-3.5 w-3.5 mr-1" />
                          Печат
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => void handleSend(row.id)}
                          disabled={sendingId === row.id}
                        >
                          <Mail className="h-3.5 w-3.5 mr-1" />
                          Изпрати
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {rows.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <FileBadge2 className="h-10 w-10 mx-auto mb-2 opacity-60" />
              Няма проформа фактури.
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

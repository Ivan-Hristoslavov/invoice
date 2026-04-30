"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  formatAccountTypeLabel,
  formatInvoiceStatusLabel,
  formatPaymentMethodLabel,
} from "@/lib/invoice-report-presenter";
import { toast } from "@/lib/toast";

type ReportRow = {
  id: string;
  invoiceNumber: string;
  issueDate: string;
  status: string;
  paymentMethod?: string | null;
  accountType?: string | null;
  total: number | string;
  client?: { name?: string | null } | null;
};

export default function InvoicesReportsClient({
  clients,
}: {
  clients: Array<{ id: string; name: string }>;
}) {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [clientId, setClientId] = useState("all");
  const [status, setStatus] = useState("PAID");
  const [paymentMethod, setPaymentMethod] = useState("BANK_TRANSFER");
  const [accountType, setAccountType] = useState("all");
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [sendTo, setSendTo] = useState("");
  const [loading, setLoading] = useState(false);

  const query = useMemo(() => {
    const params = new URLSearchParams();
    if (fromDate) params.set("fromDate", fromDate);
    if (toDate) params.set("toDate", toDate);
    if (clientId !== "all") params.set("clientId", clientId);
    if (status !== "all") params.set("status", status);
    if (paymentMethod !== "all") params.set("paymentMethod", paymentMethod);
    if (accountType !== "all") params.set("accountType", accountType);
    return params.toString();
  }, [fromDate, toDate, clientId, status, paymentMethod, accountType]);

  const loadReport = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/reports/invoices?${query}`);
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Грешка при справката");
      setRows(payload.rows || []);
    } catch (error: any) {
      toast.error(error.message || "Грешка при справката");
    } finally {
      setLoading(false);
    }
  };

  const openPdf = () => {
    const url = `/api/reports/invoices/export-pdf?${query}`;
    window.open(url, "_blank");
  };

  const sendReport = async () => {
    if (!sendTo.trim()) {
      toast.error("Въведете email адрес");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch("/api/reports/invoices/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: sendTo,
          fromDate,
          toDate,
          clientId: clientId === "all" ? undefined : clientId,
          status: status === "all" ? undefined : status,
          paymentMethod: paymentMethod === "all" ? undefined : paymentMethod,
          accountType: accountType === "all" ? undefined : accountType,
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Грешка при изпращане");
      toast.success("Справката е изпратена по email");
    } catch (error: any) {
      toast.error(error.message || "Грешка при изпращане");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="page-header">
        <div className="space-y-1">
          <h1 className="page-title">Справки за фактури</h1>
          <p className="card-description">Филтрирай по период, клиент и начин на плащане, после принтирай или изпрати.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Филтри</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
          <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
          <Select value={clientId} onValueChange={setClientId}>
            <SelectTrigger><SelectValue placeholder="Клиент" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Всички клиенти</SelectItem>
              {clients.map((client) => <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger><SelectValue placeholder="Статус" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Всички статуси</SelectItem>
              <SelectItem value="PAID">Платени</SelectItem>
              <SelectItem value="ISSUED">Издадени</SelectItem>
              <SelectItem value="DRAFT">Чернови</SelectItem>
            </SelectContent>
          </Select>
          <Select value={paymentMethod} onValueChange={setPaymentMethod}>
            <SelectTrigger><SelectValue placeholder="Плащане" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Всички методи</SelectItem>
              <SelectItem value="BANK_TRANSFER">По банка</SelectItem>
              <SelectItem value="CASH">В брой</SelectItem>
              <SelectItem value="CREDIT_CARD">Карта</SelectItem>
            </SelectContent>
          </Select>
          <Select value={accountType} onValueChange={setAccountType}>
            <SelectTrigger><SelectValue placeholder="Тип сметка" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Всички типове</SelectItem>
              <SelectItem value="BUSINESS">Business</SelectItem>
              <SelectItem value="PERSONAL">Personal</SelectItem>
            </SelectContent>
          </Select>
          <div className="md:col-span-3 flex flex-wrap gap-2">
            <Button onClick={loadReport} disabled={loading}>Покажи справка</Button>
            <Button variant="outline" onClick={openPdf} disabled={loading}>Принт / PDF</Button>
          </div>
          <div className="md:col-span-3 flex gap-2">
            <Input
              type="email"
              placeholder="email@domain.com"
              value={sendTo}
              onChange={(e) => setSendTo(e.target.value)}
            />
            <Button onClick={sendReport} disabled={loading}>Изпрати по email</Button>
          </div>
        </CardContent>
      </Card>

      <Card className="print:shadow-none print:border-black">
        <CardHeader>
          <CardTitle>Резултат</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 md:hidden">
            {rows.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">Няма резултати за избраните филтри.</div>
            ) : (
              rows.map((row) => (
                <div key={row.id} className="rounded-xl border border-border/40 bg-muted/20 px-3 py-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium truncate">{row.invoiceNumber}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(row.issueDate).toLocaleDateString("bg-BG")} · {row.client?.name || "-"}
                      </p>
                    </div>
                    <p className="font-semibold">{Number(row.total).toFixed(2)} €</p>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
                    <Badge variant={(row.status || "default") as any}>{formatInvoiceStatusLabel(row.status)}</Badge>
                    <span>{formatPaymentMethodLabel(row.paymentMethod)}</span>
                    <span>·</span>
                    <span>{formatAccountTypeLabel(row.accountType)}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="hidden md:block">
            <Table className="print:text-black rounded-2xl overflow-hidden">
              <TableHeader sticky>
                <TableRow>
                  <TableHead isRowHeader>Номер</TableHead>
                  <TableHead>Дата</TableHead>
                  <TableHead>Клиент</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Плащане</TableHead>
                  <TableHead>Тип сметка</TableHead>
                  <TableHead className="text-right">Сума</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell className="py-8 text-center text-muted-foreground" colSpan={7}>
                      Няма резултати за избраните филтри.
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((row, index) => (
                    <TableRow key={row.id} className={index % 2 === 0 ? "bg-muted/20" : undefined}>
                      <TableCell className="font-medium">{row.invoiceNumber}</TableCell>
                      <TableCell>{new Date(row.issueDate).toLocaleDateString("bg-BG")}</TableCell>
                      <TableCell>{row.client?.name || "-"}</TableCell>
                      <TableCell>
                        <Badge variant={(row.status || "default") as any}>
                          {formatInvoiceStatusLabel(row.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatPaymentMethodLabel(row.paymentMethod)}</TableCell>
                      <TableCell>{formatAccountTypeLabel(row.accountType)}</TableCell>
                      <TableCell className="text-right font-semibold">{Number(row.total).toFixed(2)} €</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label, Radio, RadioGroup, Description } from "@heroui/react";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/lib/toast";
import {
  detectMicroinvestTxtKind,
  parseMicroinvestTxtFormScriptStatusImport,
  parseMicroinvestTxtKeyValueStatusImport,
  parseMicroinvestXmlStatusImport,
  parseStatusImportCsv,
  parseStatusImportJson,
  type StatusImportParseWarning,
} from "@/lib/invoice-status-import-parsers";
import type { InvoiceStatusImportRow } from "@/lib/services/invoice-status-import";

interface Company {
  id: string;
  name: string;
}

type ImportFormat = "csv_status" | "json_status" | "microinvest_xml" | "microinvest_txt" | "manual";

type ImportApiResult = {
  success?: boolean;
  source?: string;
  appliedCount?: number;
  failedCount?: number;
  applied?: Array<{ invoiceNumber: string; companyId: string; status: string }>;
  failed?: Array<{ invoiceNumber: string; companyId: string; error: string }>;
  error?: string;
  parseWarnings?: StatusImportParseWarning[];
};

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

function newManualRowKey() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

const radioCardClass =
  "flex w-full max-w-full flex-row items-start gap-3 rounded-xl border border-border/70 bg-card/40 p-3 shadow-xs transition-colors data-[selected=true]:border-primary/55 data-[selected=true]:bg-primary/10";

const STATUS_OPTIONS = [
  { value: "PAID", label: "Платена" },
  { value: "UNPAID", label: "Неплатена" },
  { value: "OVERDUE", label: "Просрочена" },
  { value: "ISSUED", label: "Издадена → Неплатена" },
] as const;

interface ImportDialogProps {
  companies: Company[];
  children?: ReactNode;
  onApplied?: () => void;
}

export default function ImportDialog({ companies, children, onApplied }: ImportDialogProps) {
  const [open, setOpen] = useState(false);
  const [importFormat, setImportFormat] = useState<ImportFormat>("csv_status");
  const [defaultCompanyId, setDefaultCompanyId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [jsonText, setJsonText] = useState("");
  const [manualRows, setManualRows] = useState<
    Array<{ key: string; invoiceNumber: string; companyId: string; status: string; paidAt: string }>
  >([{ key: newManualRowKey(), invoiceNumber: "", companyId: "", status: "UNPAID", paidAt: "" }]);
  const [preview, setPreview] = useState<{
    rowCount: number;
    warnings: StatusImportParseWarning[];
    sample: string[];
  } | null>(null);
  const [lastResult, setLastResult] = useState<ImportApiResult | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!defaultCompanyId && companies[0]?.id) setDefaultCompanyId(companies[0].id);
  }, [companies, defaultCompanyId]);

  const needsDefaultCompany =
    importFormat === "microinvest_xml" || importFormat === "microinvest_txt";

  const runPreview = useCallback(async () => {
    setLastResult(null);
    if (importFormat === "manual") {
      const built = manualRows
        .map((r) => ({
          invoiceNumber: r.invoiceNumber.trim(),
          companyId: r.companyId.trim(),
          status: r.status.trim(),
        }))
        .filter((r) => r.invoiceNumber && r.companyId && r.status);
      setPreview({
        rowCount: built.length,
        warnings: [],
        sample: built.slice(0, 5).map((r) => r.invoiceNumber),
      });
      return;
    }

    if (importFormat === "json_status") {
      if (!jsonText.trim()) {
        setPreview(null);
        return;
      }
      const p = parseStatusImportJson(jsonText);
      setPreview({
        rowCount: p.rows.length,
        warnings: p.warnings,
        sample: p.rows.slice(0, 5).map((r) => r.invoiceNumber),
      });
      return;
    }

    if (!file) {
      setPreview(null);
      return;
    }

    try {
      const text = await readFileAsText(file);
      if (importFormat === "csv_status") {
        const p = parseStatusImportCsv(text);
        setPreview({
          rowCount: p.rows.length,
          warnings: p.warnings,
          sample: p.rows.slice(0, 5).map((r) => r.invoiceNumber),
        });
        return;
      }
      if (importFormat === "microinvest_xml") {
        const p = parseMicroinvestXmlStatusImport(text, defaultCompanyId);
        setPreview({
          rowCount: p.rows.length,
          warnings: p.warnings,
          sample: p.rows.slice(0, 5).map((r) => r.invoiceNumber),
        });
        return;
      }
      if (importFormat === "microinvest_txt") {
        const kind = detectMicroinvestTxtKind(text);
        if (kind === "unknown") {
          setPreview({
            rowCount: 0,
            warnings: [
              {
                message:
                  "Не разпознат TXT (очаква се MICROINVEST_WAREHOUSE_EXPORT_V1 / InvoiceNo= или FormScript с F3).",
              },
            ],
            sample: [],
          });
          return;
        }
        const p =
          kind === "kv"
            ? parseMicroinvestTxtKeyValueStatusImport(text, defaultCompanyId)
            : parseMicroinvestTxtFormScriptStatusImport(text, defaultCompanyId);
        setPreview({
          rowCount: p.rows.length,
          warnings: p.warnings,
          sample: p.rows.slice(0, 5).map((r) => r.invoiceNumber),
        });
      }
    } catch {
      setPreview({ rowCount: 0, warnings: [{ message: "Грешка при четене на файла" }], sample: [] });
    }
  }, [defaultCompanyId, file, importFormat, jsonText, manualRows]);

  useEffect(() => {
    void runPreview();
  }, [runPreview]);

  const canSubmit = useMemo(() => {
    if (companies.length === 0) return false;
    if (needsDefaultCompany && !defaultCompanyId.trim()) return false;
    if (importFormat === "manual") {
      return manualRows.some((r) => r.invoiceNumber.trim() && r.companyId.trim() && r.status.trim());
    }
    if (importFormat === "json_status") return jsonText.trim().length > 0;
    return Boolean(file);
  }, [
    companies.length,
    defaultCompanyId,
    file,
    importFormat,
    jsonText,
    manualRows,
    needsDefaultCompany,
  ]);

  const buildManualRowsPayload = (): InvoiceStatusImportRow[] => {
    return manualRows
      .map((r) => {
        const paidAt = r.paidAt.trim();
        return {
          invoiceNumber: r.invoiceNumber.trim(),
          companyId: r.companyId.trim(),
          status: r.status.trim() as InvoiceStatusImportRow["status"],
          ...(paidAt ? { paidAt } : {}),
        };
      })
      .filter((r) => r.invoiceNumber && r.companyId && r.status);
  };

  const handleSubmit = async () => {
    if (!canSubmit) {
      toast.error("Попълнете данните за импорт");
      return;
    }
    setSubmitting(true);
    setLastResult(null);
    try {
      if (importFormat === "csv_status" || importFormat === "microinvest_xml" || importFormat === "microinvest_txt") {
        if (!file) {
          toast.error("Изберете файл");
          return;
        }
        const fd = new FormData();
        fd.set("format", importFormat);
        fd.set("file", file);
        if (needsDefaultCompany) fd.set("defaultCompanyId", defaultCompanyId.trim());
        const res = await fetch("/api/invoices/import-status-upload", { method: "POST", body: fd });
        const body = (await res.json()) as ImportApiResult;
        if (!res.ok) {
          toast.error(body.error || "Импортът не беше успешен");
          setLastResult(body);
          return;
        }
        setLastResult(body);
        toast.success(
          `Импортирани: ${body.appliedCount ?? 0}, пропуснати: ${body.failedCount ?? 0}`
        );
        onApplied?.();
        return;
      }

      if (importFormat === "json_status") {
        const parsed = parseStatusImportJson(jsonText);
        if (parsed.rows.length === 0) {
          toast.error("Няма валидни редове в JSON");
          setLastResult({ error: "Няма валидни редове", parseWarnings: parsed.warnings });
          return;
        }
        const res = await fetch("/api/invoices/import-status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rows: parsed.rows, source: "import-dialog:json" }),
        });
        const body = (await res.json()) as ImportApiResult;
        if (!res.ok) {
          toast.error(body.error || "Импортът не беше успешен");
          setLastResult(body);
          return;
        }
        setLastResult(body);
        toast.success(
          `Импортирани: ${body.appliedCount ?? 0}, пропуснати: ${body.failedCount ?? 0}`
        );
        onApplied?.();
        return;
      }

      const rows = buildManualRowsPayload();
      if (rows.length === 0) {
        toast.error("Добавете поне един валиден ред в таблицата");
        return;
      }
      const res = await fetch("/api/invoices/import-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows, source: "import-dialog:manual" }),
      });
      const body = (await res.json()) as ImportApiResult;
      if (!res.ok) {
        toast.error(body.error || "Импортът не беше успешен");
        setLastResult(body);
        return;
      }
      setLastResult(body);
      toast.success(`Импортирани: ${body.appliedCount ?? 0}, пропуснати: ${body.failedCount ?? 0}`);
      onApplied?.();
    } catch (e) {
      console.error(e);
      toast.error("Неочаквана грешка при импорт");
    } finally {
      setSubmitting(false);
    }
  };

  const addManualRow = () => {
    setManualRows((prev) => [...prev, { key: newManualRowKey(), invoiceNumber: "", companyId: "", status: "UNPAID", paidAt: "" }]);
  };

  const removeManualRow = (key: string) => {
    setManualRows((prev) => (prev.length <= 1 ? prev : prev.filter((r) => r.key !== key)));
  };

  const updateManualRow = (key: string, patch: Partial<(typeof manualRows)[0]>) => {
    setManualRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="flex max-h-[90vh] flex-col overflow-visible gap-0 p-0 sm:max-w-[min(92vw,640px)]">
        <div className="shrink-0 border-b border-border/60 px-6 pb-4 pt-6">
          <DialogHeader className="p-0">
            <DialogTitle>Импорт на статуси</DialogTitle>
            <Description className="text-left text-sm text-muted-foreground">
              Обновява само статус и дата на плащане за вече съществуващи фактури. Не променя суми, номерация или
              неизменими полета.
            </Description>
          </DialogHeader>
        </div>

        <div className="flex min-h-0 max-h-[min(72vh,640px)] flex-1 flex-col gap-4 overflow-y-auto px-6 py-4">
          {companies.length === 0 ? (
            <p className="text-sm text-destructive">Няма регистрирани фирми — добавете фирма в настройки.</p>
          ) : (
            <>
              <div className="flex flex-col gap-3">
                <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Източник
                </Label>
                <RadioGroup
                  name="import-format"
                  value={importFormat}
                  onChange={(v) => {
                    setImportFormat(v as ImportFormat);
                    setFile(null);
                    setLastResult(null);
                  }}
                  className="flex flex-col gap-3"
                >
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Обикновено
                  </p>
                  <div className="flex flex-col gap-2">
                    <Radio value="csv_status" className={radioCardClass}>
                      <Radio.Control className="mt-0.5 shrink-0">
                        <Radio.Indicator />
                      </Radio.Control>
                      <Radio.Content className="min-w-0 space-y-0.5">
                        <Label className="cursor-pointer text-sm font-medium">Таблица (CSV файл)</Label>
                        <Description className="text-xs leading-snug text-muted-foreground">
                          Очаквани колони: invoiceNumber, companyId, status; по желание paidAt (дата на плащане).
                        </Description>
                      </Radio.Content>
                    </Radio>
                    <Radio value="manual" className={radioCardClass}>
                      <Radio.Control className="mt-0.5 shrink-0">
                        <Radio.Indicator />
                      </Radio.Control>
                      <Radio.Content className="min-w-0 space-y-0.5">
                        <Label className="cursor-pointer text-sm font-medium">Ръчно в таблица</Label>
                        <Description className="text-xs leading-snug text-muted-foreground">
                          Въведете номер на фактура, фирма и статус директно по редове — без файл.
                        </Description>
                      </Radio.Content>
                    </Radio>
                  </div>
                  <p className="pt-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Разширено и връзка със софтуер
                  </p>
                  <div className="flex flex-col gap-2">
                    <Radio value="json_status" className={radioCardClass}>
                      <Radio.Control className="mt-0.5 shrink-0">
                        <Radio.Indicator />
                      </Radio.Control>
                      <Radio.Content className="min-w-0 space-y-0.5">
                        <Label className="cursor-pointer text-sm font-medium">JSON</Label>
                        <Description className="text-xs leading-snug text-muted-foreground">
                          Масив от обекти или обект с поле <code className="rounded bg-muted px-1">rows</code>. Същите
                          полета като при CSV.
                        </Description>
                      </Radio.Content>
                    </Radio>
                    <Radio value="microinvest_xml" className={radioCardClass}>
                      <Radio.Control className="mt-0.5 shrink-0">
                        <Radio.Indicator />
                      </Radio.Control>
                      <Radio.Content className="min-w-0 space-y-0.5">
                        <Label className="cursor-pointer text-sm font-medium">Microinvest XML</Label>
                        <Description className="text-xs leading-snug text-muted-foreground">
                          Номера от ExportData. Ако във файла няма companyId, ползва се избраната фирма по подразбиране.
                        </Description>
                      </Radio.Content>
                    </Radio>
                    <Radio value="microinvest_txt" className={radioCardClass}>
                      <Radio.Control className="mt-0.5 shrink-0">
                        <Radio.Indicator />
                      </Radio.Control>
                      <Radio.Content className="min-w-0 space-y-0.5">
                        <Label className="cursor-pointer text-sm font-medium">Microinvest TXT</Label>
                        <Description className="text-xs leading-snug text-muted-foreground">
                          Формат key=value или FormScript (MICROINVEST_WAREHOUSE_EXPORT_V1 / InvoiceNo= / F3).
                        </Description>
                      </Radio.Content>
                    </Radio>
                  </div>
                </RadioGroup>
              </div>

              {needsDefaultCompany && (
                <div className="space-y-2">
                  <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Фирма по подразбиране (за XML/TXT без companyId във файла)
                  </Label>
                  <Select value={defaultCompanyId} onValueChange={setDefaultCompanyId}>
                    <SelectTrigger className="h-11 w-full rounded-2xl">
                      <SelectValue placeholder="Изберете фирма" />
                    </SelectTrigger>
                    <SelectContent>
                      {companies.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {importFormat === "json_status" && (
                <div className="space-y-2">
                  <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">JSON</Label>
                  <Textarea
                    value={jsonText}
                    onChange={(e) => setJsonText(e.target.value)}
                    placeholder='[{"invoiceNumber":"...","companyId":"...","status":"PAID"}]'
                    className="min-h-[140px] font-mono text-xs"
                  />
                  <Description className="text-xs text-muted-foreground">
                    Поле <code className="rounded bg-muted px-1">paidAt</code> — ISO 8601 (напр. 2026-05-13T12:00:00.000Z).
                  </Description>
                </div>
              )}

              {(importFormat === "csv_status" ||
                importFormat === "microinvest_xml" ||
                importFormat === "microinvest_txt") && (
                <div className="space-y-2">
                  <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Файл</Label>
                  <Input
                    type="file"
                    accept={importFormat === "csv_status" ? ".csv,text/csv" : ".xml,.txt,text/plain,application/xml"}
                    onChange={(e) => {
                      const f = e.target.files?.[0] ?? null;
                      setFile(f);
                    }}
                  />
                  <Description className="text-xs text-muted-foreground">
                    За кирилски TXT с кодировка Windows-1251 качете файла — сървърът опитва UTF-8 и при нужда CP1251.
                  </Description>
                </div>
              )}

              {importFormat === "manual" && (
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Редове
                    </Label>
                    <Button type="button" size="sm" variant="secondary" onClick={addManualRow}>
                      + Ред
                    </Button>
                  </div>
                  <Table
                    className="rounded-xl border border-border/60 bg-card/40 shadow-none ring-0"
                    scrollContainerClassName="max-h-[min(40vh,280px)] overflow-x-auto overflow-y-auto"
                    contentClassName="min-w-[520px]"
                    contentAriaLabel="Ръчно въвеждане на статуси по фактури"
                  >
                    <TableHeader>
                      <TableRow>
                        <TableHead className="normal-case tracking-normal py-2">Номер</TableHead>
                        <TableHead className="normal-case tracking-normal py-2">Фирма</TableHead>
                        <TableHead className="normal-case tracking-normal py-2">Статус</TableHead>
                        <TableHead className="normal-case tracking-normal py-2">paidAt (опц.)</TableHead>
                        <TableHead className="w-12 py-2 text-center normal-case tracking-normal">
                          <span className="sr-only">Премахване на ред</span>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {manualRows.map((row) => (
                        <TableRow key={row.key}>
                          <TableCell className="py-2 align-middle">
                            <Input
                              value={row.invoiceNumber}
                              onChange={(e) => updateManualRow(row.key, { invoiceNumber: e.target.value })}
                              placeholder="№ фактура"
                              className="h-9 rounded-lg text-xs"
                            />
                          </TableCell>
                          <TableCell className="py-2 align-middle">
                            <Select
                              value={row.companyId}
                              onValueChange={(v) => updateManualRow(row.key, { companyId: v })}
                            >
                              <SelectTrigger className="h-9 rounded-lg text-xs">
                                <SelectValue placeholder="Фирма" />
                              </SelectTrigger>
                              <SelectContent>
                                {companies.map((c) => (
                                  <SelectItem key={c.id} value={c.id}>
                                    {c.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="py-2 align-middle">
                            <Select
                              value={row.status}
                              onValueChange={(v) => updateManualRow(row.key, { status: v })}
                            >
                              <SelectTrigger className="h-9 rounded-lg text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {STATUS_OPTIONS.map((o) => (
                                  <SelectItem key={o.value} value={o.value}>
                                    {o.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="py-2 align-middle">
                            <Input
                              value={row.paidAt}
                              onChange={(e) => updateManualRow(row.key, { paidAt: e.target.value })}
                              placeholder="ISO datetime"
                              className="h-9 rounded-lg text-xs"
                            />
                          </TableCell>
                          <TableCell className="py-2 text-center align-middle">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2 text-xs text-muted-foreground"
                              onClick={() => removeManualRow(row.key)}
                              aria-label="Премахни ред"
                            >
                              ×
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              <Separator />

              <div className="space-y-2 rounded-xl border border-border/50 bg-muted/15 p-3 text-sm">
                <p className="font-medium text-foreground">Преглед</p>
                {!preview ? (
                  <p className="text-muted-foreground">Попълнете входните данни.</p>
                ) : (
                  <>
                    <p>
                      Очаквани валидни редове: <strong>{preview.rowCount}</strong>
                    </p>
                    {preview.sample.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        Примери: {preview.sample.join(", ")}
                        {preview.rowCount > preview.sample.length ? " …" : ""}
                      </p>
                    )}
                    {preview.warnings.length > 0 && (
                      <ul className="list-inside list-disc text-xs text-amber-700 dark:text-amber-300">
                        {preview.warnings.slice(0, 8).map((w, i) => (
                          <li key={`${w.message}-${i}`}>
                            {w.line != null ? `Ред ${w.line}: ` : ""}
                            {w.message}
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                )}
              </div>

              {lastResult && (lastResult.appliedCount != null || lastResult.failed?.length) && (
                <div className="space-y-2 rounded-xl border border-border/50 bg-card/50 p-3 text-sm">
                  <p className="font-medium">Резултат от последния опит</p>
                  <p>
                    Приложени: {lastResult.appliedCount ?? 0}, неуспешни: {lastResult.failedCount ?? 0}
                  </p>
                  {lastResult.failed && lastResult.failed.length > 0 && (
                    <ul className="max-h-32 overflow-y-auto text-xs text-destructive">
                      {lastResult.failed.slice(0, 12).map((f, i) => (
                        <li key={`${f.invoiceNumber}-${i}`}>
                          {f.invoiceNumber}: {f.error}
                        </li>
                      ))}
                    </ul>
                  )}
                  {lastResult.parseWarnings && lastResult.parseWarnings.length > 0 && (
                    <ul className="text-xs text-muted-foreground">
                      {lastResult.parseWarnings.slice(0, 6).map((w, i) => (
                        <li key={`pw-${i}`}>{w.message}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter className="border-t border-border/60 px-6 py-4">
          <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={submitting}>
            Затвори
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={submitting || !canSubmit}>
            {submitting ? "Импорт…" : "Импортирай"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

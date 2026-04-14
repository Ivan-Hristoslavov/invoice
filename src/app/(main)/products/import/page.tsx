"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Upload,
  Download,
  FileText,
  CheckCircle,
  AlertCircle,
  X,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/lib/toast";
import {
  parseProductsCsv,
  generateProductsCsvTemplate,
  type ParsedProductRow,
} from "@/lib/products-import";
import { downloadCsv } from "@/lib/clients-import";
import { useAsyncLock } from "@/hooks/use-async-lock";

export default function ProductsImportPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedProductRow[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const importLock = useAsyncLock();
  const [importResult, setImportResult] = useState<{
    imported: number;
    failed: number;
    results: { rowIndex: number; name: string; id: string }[];
    errors: { rowIndex: number; error: string }[];
  } | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] || null;
    setImportResult(null);
    setParsedRows([]);

    if (!selected) {
      setFile(null);
      return;
    }
    if (!selected.name.toLowerCase().endsWith(".csv")) {
      toast.error("Моля, изберете CSV файл.");
      setFile(null);
      return;
    }
    setFile(selected);
    setIsParsing(true);
    try {
      const rows = await parseProductsCsv(selected);
      setParsedRows(rows);
    } catch (err) {
      toast.error((err as Error).message || "Грешка при парсване на CSV.");
    } finally {
      setIsParsing(false);
    }
  };

  const handleDrop = useCallback(
    async (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      const dropped = e.dataTransfer.files?.[0];
      if (!dropped?.name.toLowerCase().endsWith(".csv")) {
        toast.error("Моля, пуснете CSV файл.");
        return;
      }
      setFile(dropped);
      setImportResult(null);
      setIsParsing(true);
      try {
        const rows = await parseProductsCsv(dropped);
        setParsedRows(rows);
      } catch (err) {
        toast.error((err as Error).message || "Грешка при парсване на CSV.");
      } finally {
        setIsParsing(false);
      }
    },
    []
  );

  const validRows = parsedRows.filter((r) => r.data !== null);
  const invalidRows = parsedRows.filter((r) => r.errors.length > 0);

  const handleImport = async () => {
    if (validRows.length === 0) {
      toast.error("Няма валидни редове за импортиране.");
      return;
    }
    void importLock.run(async () => {
      try {
        const res = await fetch("/api/products/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rows: validRows.map((r) => r.data) }),
        });
        const result = await res.json();
        if (!res.ok) {
          toast.error(result.error || "Грешка при импорт.");
          return;
        }
        setImportResult(result);
        if (result.imported > 0) {
          toast.success(`Успешно импортирани: ${result.imported} продукта.`);
        }
        if (result.failed > 0) {
          toast.error(`Неуспешни: ${result.failed} реда.`);
        }
      } catch {
        toast.error("Неуспешен импорт. Моля, опитайте отново.");
      }
    });
  };

  const handleDownloadTemplate = () => {
    const csv = generateProductsCsvTemplate();
    downloadCsv(csv, "products_import_template.csv");
    toast.success("Шаблонът е изтеглен.");
  };

  const clearFile = () => {
    setFile(null);
    setParsedRows([]);
    setImportResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/products" className="flex items-center whitespace-nowrap">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Продукти
          </Link>
        </Button>
        <h1 className="page-title">Импорт на продукти</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Качване на CSV</CardTitle>
            <CardDescription>
              Качете CSV файл с данни за продукти. Изтеглете шаблон за правилен формат.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                file ? "border-primary bg-primary/5" : "border-muted-foreground/20"
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onDrop={handleDrop}
            >
              <div className="flex flex-col items-center justify-center gap-4">
                <FileText className="h-12 w-12 text-muted-foreground" />
                {file ? (
                  <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="font-medium">{file.name}</span>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={clearFile}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <p className="text-muted-foreground">
                      Плъзнете CSV файл тук или изберете от компютъра
                    </p>
                    <Input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv"
                      className="max-w-xs"
                      onChange={handleFileChange}
                    />
                  </>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-between mt-6 gap-4">
              <Button variant="outline" onClick={handleDownloadTemplate}>
                <Download className="mr-2 h-4 w-4" />
                Изтегли шаблон
              </Button>
              <Button
                onClick={handleImport}
                disabled={validRows.length === 0 || importLock.isPending || !!importResult}
              >
                {importLock.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Импортиране...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Импортирай {validRows.length} продукта
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Формат на CSV</CardTitle>
            <CardDescription>Задължителни и препоръчителни колони</CardDescription>
          </CardHeader>
          <CardContent className="text-sm space-y-3">
            <div>
              <p className="font-medium mb-1">Задължително:</p>
              <ul className="list-disc pl-5 text-muted-foreground space-y-0.5">
                <li><code>name</code> — име на продукта</li>
                <li><code>price</code> — цена (число)</li>
              </ul>
            </div>
            <div>
              <p className="font-medium mb-1">Препоръчително:</p>
              <ul className="list-disc pl-5 text-muted-foreground space-y-0.5">
                <li><code>description</code> — описание</li>
                <li><code>unit</code> — мерна единица (по подр. бр.)</li>
                <li><code>taxRate</code> — ДДС % (по подр. 20)</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Preview */}
      {isParsing && (
        <Card>
          <CardContent className="py-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
            <p className="mt-2 text-muted-foreground">Парсване на CSV...</p>
          </CardContent>
        </Card>
      )}

      {parsedRows.length > 0 && !importResult && (
        <Card>
          <CardHeader>
            <CardTitle>Преглед ({parsedRows.length} реда)</CardTitle>
            <CardDescription>
              <Badge variant="outline" className="mr-2">
                {validRows.length} валидни
              </Badge>
              {invalidRows.length > 0 && (
                <Badge variant="destructive">{invalidRows.length} с грешки</Badge>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-h-96 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Ред</TableHead>
                    <TableHead>Име</TableHead>
                    <TableHead>Цена</TableHead>
                    <TableHead>Единица</TableHead>
                    <TableHead>ДДС %</TableHead>
                    <TableHead>Статус</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedRows.slice(0, 50).map((row) => (
                    <TableRow key={row.rowIndex}>
                      <TableCell className="font-mono text-xs">{row.rowIndex}</TableCell>
                      <TableCell>{row.data?.name || "—"}</TableCell>
                      <TableCell className="font-mono">
                        {row.data?.price != null ? row.data.price.toFixed(2) : "—"}
                      </TableCell>
                      <TableCell>{row.data?.unit || "—"}</TableCell>
                      <TableCell>{row.data?.taxRate != null ? `${row.data.taxRate}%` : "—"}</TableCell>
                      <TableCell>
                        {row.errors.length > 0 ? (
                          <span className="text-xs text-destructive">{row.errors[0]}</span>
                        ) : (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {parsedRows.length > 50 && (
                <p className="text-center text-sm text-muted-foreground py-2">
                  + {parsedRows.length - 50} допълнителни реда
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {importResult && (
        <Card>
          <CardHeader>
            <CardTitle>Резултат от импорт</CardTitle>
            <CardDescription>
              {importResult.imported} успешни, {importResult.failed} неуспешни
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {importResult.results.length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Импортирани
                </h3>
                <ul className="space-y-1 text-sm">
                  {importResult.results.slice(0, 10).map((r) => (
                    <li key={r.id} className="bg-muted p-2 rounded flex justify-between">
                      <span>{r.name}</span>
                      <span className="text-muted-foreground text-xs">ред {r.rowIndex}</span>
                    </li>
                  ))}
                  {importResult.results.length > 10 && (
                    <li className="text-center text-muted-foreground">
                      + {importResult.results.length - 10} още
                    </li>
                  )}
                </ul>
              </div>
            )}
            {importResult.errors.length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-destructive" />
                  Грешки
                </h3>
                <ul className="space-y-1 text-sm">
                  {importResult.errors.map((e, i) => (
                    <li
                      key={i}
                      className="bg-destructive/10 text-destructive p-2 rounded text-xs"
                    >
                      Ред {e.rowIndex}: {e.error}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button onClick={() => router.push("/products")} className="w-full">
              Към продукти
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}

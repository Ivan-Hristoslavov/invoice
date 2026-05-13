import Papa from "papaparse";
import type { InvoiceStatusImportRow } from "@/lib/services/invoice-status-import";

export type StatusImportParseWarning = { line?: number; message: string };

export type StatusImportParseResult = {
  rows: InvoiceStatusImportRow[];
  warnings: StatusImportParseWarning[];
};

const ALLOWED = new Set(["PAID", "UNPAID", "OVERDUE", "ISSUED"]);

function normalizeStatusCell(raw: string): string {
  const s = raw.trim().toUpperCase();
  const bg: Record<string, string> = {
    ПЛАТЕНА: "PAID",
    ПЛАТЕНО: "PAID",
    НЕПЛАТЕНА: "UNPAID",
    НЕПЛАТЕНО: "UNPAID",
    ПРОСРОЧЕНА: "OVERDUE",
    ПРОСРОЧЕНО: "OVERDUE",
    ИЗДАДЕНА: "ISSUED",
    ИЗДАДЕНО: "ISSUED",
  };
  return bg[raw.trim()] ?? s;
}

/**
 * CSV columns (header row, case-insensitive): invoiceNumber, companyId, status, paidAt?, externalRef?
 */
export function parseStatusImportCsv(text: string): StatusImportParseResult {
  const warnings: StatusImportParseWarning[] = [];
  const rows: InvoiceStatusImportRow[] = [];

  const parsed = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim().toLowerCase(),
  });

  if (parsed.errors.length) {
    warnings.push({ message: parsed.errors.map((e) => e.message).join("; ") });
  }

  const data = parsed.data ?? [];
  data.forEach((rec, idx) => {
    const line = idx + 2;
    const invoiceNumber = (rec.invoicenumber ?? rec["invoice number"] ?? "").trim();
    const companyId = (rec.companyid ?? rec["company id"] ?? "").trim();
    const statusRaw = (rec.status ?? "").trim();
    const status = normalizeStatusCell(statusRaw);
    const paidAt = (rec.paidat ?? rec["paid at"] ?? "").trim() || undefined;
    const externalRef = (rec.externalref ?? rec["external ref"] ?? "").trim() || undefined;

    if (!invoiceNumber || !companyId || !status) {
      warnings.push({ line, message: "Пропуснат ред: липсват invoiceNumber, companyId или status" });
      return;
    }
    if (!ALLOWED.has(status)) {
      warnings.push({ line, message: `Невалиден статус: ${statusRaw}` });
      return;
    }

    rows.push({
      invoiceNumber,
      companyId,
      status: status as InvoiceStatusImportRow["status"],
      paidAt,
      externalRef,
    });
  });

  return { rows, warnings };
}

/**
 * JSON: either `{ rows: [...] }` or a bare array of row objects.
 */
export function parseStatusImportJson(text: string): StatusImportParseResult {
  const warnings: StatusImportParseWarning[] = [];
  let payload: unknown;
  try {
    payload = JSON.parse(text);
  } catch {
    return { rows: [], warnings: [{ message: "Невалиден JSON" }] };
  }

  const arr = Array.isArray(payload) ? payload : (payload as { rows?: unknown })?.rows;
  if (!Array.isArray(arr)) {
    return { rows: [], warnings: [{ message: "Очаква се масив или обект с поле rows" }] };
  }

  const rows: InvoiceStatusImportRow[] = [];
  arr.forEach((item, idx) => {
    const line = idx + 1;
    if (!item || typeof item !== "object") {
      warnings.push({ line, message: "Пропуснат елемент (не е обект)" });
      return;
    }
    const o = item as Record<string, unknown>;
    const invoiceNumber = String(o.invoiceNumber ?? "").trim();
    const companyId = String(o.companyId ?? "").trim();
    const status = normalizeStatusCell(String(o.status ?? ""));
    const paidAt = o.paidAt != null ? String(o.paidAt).trim() : undefined;
    const externalRef = o.externalRef != null ? String(o.externalRef).trim() : undefined;

    if (!invoiceNumber || !companyId || !status) {
      warnings.push({ line, message: "Липсват invoiceNumber, companyId или status" });
      return;
    }
    if (!ALLOWED.has(status)) {
      warnings.push({ line, message: `Невалиден статус: ${String(o.status)}` });
      return;
    }

    rows.push({
      invoiceNumber,
      companyId,
      status: status as InvoiceStatusImportRow["status"],
      paidAt: paidAt || undefined,
      externalRef: externalRef || undefined,
    });
  });

  return { rows, warnings };
}

function extractXmlTag(block: string, tag: string): string {
  const re = new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`, "i");
  const m = block.match(re);
  return m ? m[1].trim() : "";
}

/**
 * Microinvest warehouse XML: multiple `<ExportData>...</ExportData>` blocks.
 * No payment state in export — rows use UNPAID; use CSV/JSON for PAID/OVERDUE.
 */
export function parseMicroinvestXmlStatusImport(
  xml: string,
  defaultCompanyId: string
): StatusImportParseResult {
  const warnings: StatusImportParseWarning[] = [];
  if (!defaultCompanyId.trim()) {
    return { rows: [], warnings: [{ message: "За XML импорт изберете фирма по подразбиране (companyId)" }] };
  }

  const blocks = xml.split(/<\/ExportData>/i);
  const rows: InvoiceStatusImportRow[] = [];
  let idx = 0;
  for (const chunk of blocks) {
    idx += 1;
    if (!chunk.includes("<ExportData")) continue;
    const inner = chunk.slice(chunk.indexOf("<ExportData"));
    const invoiceNo =
      extractXmlTag(inner, "InvoiceNo") || extractXmlTag(inner, "StockReceiptNo");
    if (!invoiceNo) {
      warnings.push({ line: idx, message: "Блок без InvoiceNo/StockReceiptNo" });
      continue;
    }
    rows.push({
      invoiceNumber: invoiceNo,
      companyId: defaultCompanyId,
      status: "UNPAID",
      externalRef: "microinvest-xml",
    });
  }

  if (rows.length === 0 && !warnings.length) {
    warnings.push({ message: "Не са намерени ExportData блокове в XML" });
  }

  return { rows, warnings };
}

function parseKeyValueBlock(text: string): Record<string, string> {
  const map: Record<string, string> = {};
  for (const line of text.split(/\r?\n/)) {
    const eq = line.indexOf("=");
    if (eq <= 0) continue;
    const k = line.slice(0, eq).trim();
    const v = line.slice(eq + 1).trim();
    map[k] = v;
  }
  return map;
}

/**
 * Key=value MICROINVEST_WAREHOUSE_EXPORT_V1 blocks (single or separated by blank lines).
 */
export function parseMicroinvestTxtKeyValueStatusImport(
  raw: string,
  defaultCompanyId: string
): StatusImportParseResult {
  const warnings: StatusImportParseWarning[] = [];
  if (!defaultCompanyId.trim()) {
    return { rows: [], warnings: [{ message: "За TXT импорт изберете фирма по подразбиране" }] };
  }

  const parts = raw.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  const blocks = parts.length ? parts : [raw.trim()].filter(Boolean);
  const rows: InvoiceStatusImportRow[] = [];

  blocks.forEach((block, idx) => {
    const map = parseKeyValueBlock(block);
    if (map.FORMAT && !map.FORMAT.includes("MICROINVEST")) {
      warnings.push({ line: idx + 1, message: "Неизвестен FORMAT в TXT блок" });
    }
    const invNo = (map.InvoiceNo || map.StockReceiptNo || "").trim();
    if (!invNo) {
      warnings.push({ line: idx + 1, message: "TXT блок без InvoiceNo" });
      return;
    }
    rows.push({
      invoiceNumber: invNo,
      companyId: defaultCompanyId,
      status: "UNPAID",
      externalRef: "microinvest-txt-kv",
    });
  });

  return { rows, warnings };
}

/**
 * FormScript batch: sequences starting with F3 ... Наредител - име=Фактура <no>
 */
export function parseMicroinvestTxtFormScriptStatusImport(
  raw: string,
  defaultCompanyId: string
): StatusImportParseResult {
  const warnings: StatusImportParseWarning[] = [];
  if (!defaultCompanyId.trim()) {
    return { rows: [], warnings: [{ message: "За TXT импорт изберете фирма по подразбиране" }] };
  }

  const normalized = raw.replace(/\r\n/g, "\n");
  const chunks = normalized.split(/\n(?=F3\n)/).map((c) => c.trim()).filter((c) => c.startsWith("F3"));
  const rows: InvoiceStatusImportRow[] = [];

  const seqs = chunks.length ? chunks : normalized.includes("F3") ? [normalized] : [];

  seqs.forEach((block, idx) => {
    const m = block.match(/Наредител\s*-\s*име\s*=\s*Фактура\s+(.+)/i);
    const invNo = m ? m[1].trim() : "";
    if (!invNo) {
      warnings.push({ line: idx + 1, message: "FormScript блок без ред „Наредител - име=Фактура …“" });
      return;
    }
    rows.push({
      invoiceNumber: invNo,
      companyId: defaultCompanyId,
      status: "UNPAID",
      externalRef: "microinvest-txt-formscript",
    });
  });

  if (rows.length === 0 && normalized.includes("F3")) {
    warnings.push({ message: "Не успяхме да извлечем номера на фактура от FormScript" });
  }

  return { rows, warnings };
}

export function detectMicroinvestTxtKind(raw: string): "kv" | "formscript" | "unknown" {
  if (raw.includes("MICROINVEST_WAREHOUSE_EXPORT_V1") || /^\s*InvoiceNo\s*=/m.test(raw)) {
    return "kv";
  }
  if (raw.includes("F3") && raw.includes("Наредител")) {
    return "formscript";
  }
  return "unknown";
}

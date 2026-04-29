/**
 * Microinvest Warehouse Pro — XML export shape (service documentation, version 1).
 * @see user-provided Microinvest spec (WarehouseProExport.xml).
 */

export function escapeXmlText(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function microinvestMoney(value: unknown): string {
  const n = Number(value ?? 0);
  if (Number.isNaN(n)) return "0.00";
  return n.toFixed(2);
}

function formatMicroinvestDate(value: unknown): string {
  if (value === null || value === undefined) return "";
  const d = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(d.getTime())) return "";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}.${mm}.${yyyy}`;
}

/** 1 cash, 2 bank, 3 card — Microinvest enum */
export function microinvestPaymentType(paymentMethod?: string | null): "1" | "2" | "3" {
  switch (paymentMethod) {
    case "CASH":
      return "1";
    case "CREDIT_CARD":
      return "3";
    case "BANK_TRANSFER":
    default:
      return "2";
  }
}

function xmlEl(name: string, value: string, usePreserveEmpty: boolean): string {
  if (!value) {
    return usePreserveEmpty
      ? `<${name} xml:space="preserve"></${name}>`
      : `<${name}></${name}>`;
  }
  return `<${name}>${escapeXmlText(value)}</${name}>`;
}

export type InvoiceExportLike = {
  invoiceNumber?: string | null;
  issueDate?: unknown;
  subtotal?: unknown;
  taxAmount?: unknown;
  total?: unknown;
  paymentMethod?: string | null;
  notes?: string | null;
  client?: Record<string, unknown> | null;
};

/** Buyer / partner fields from snapshot client */
export function buildMicroinvestPartnerFields(client: Record<string, unknown> | null | undefined) {
  const c = client || {};
  const name = typeof c.name === "string" ? c.name : "";
  const city = typeof c.city === "string" ? c.city : "";
  const address = typeof c.address === "string" ? c.address : "";
  const mol = typeof c.mol === "string" ? c.mol : "";
  const bulstat = typeof c.bulstatNumber === "string" ? c.bulstatNumber.replace(/\D/g, "") : "";
  const vatReg =
    (typeof c.vatRegistrationNumber === "string" && c.vatRegistrationNumber) ||
    (typeof c.vatNumber === "string" && c.vatNumber) ||
    "";
  return { name, city, address, mol, bulstat, vatReg };
}

/**
 * One `<ExportData>...</ExportData>` block (no XML declaration / root).
 * StockReceiptType 2 = sale; DocumentType 1 = invoice with tax document.
 */
export function buildMicroinvestExportDataBlock(inv: InvoiceExportLike): string {
  const client = inv.client as Record<string, unknown> | null | undefined;
  const p = buildMicroinvestPartnerFields(client);
  const issue = formatMicroinvestDate(inv.issueDate);
  const payType = microinvestPaymentType(inv.paymentMethod ?? undefined);
  const docTotal = microinvestMoney(inv.total);
  const vatTotal = microinvestMoney(inv.taxAmount);
  const netTotal = microinvestMoney(inv.subtotal);
  const invNo = String(inv.invoiceNumber || "").trim();

  const opDesc = typeof inv.notes === "string" && inv.notes.trim() ? inv.notes.trim() : "";

  const lines = [
    "<ExportData>",
    xmlEl("StockReceiptType", "2", false),
    xmlEl("StockReceiptNo", invNo, false),
    xmlEl("StockReceiptDate", issue, false),
    xmlEl("InvoiceNo", invNo, false),
    xmlEl("InvoiceDate", issue, false),
    xmlEl("DocumentType", "1", false),
    xmlEl("DocTotal", docTotal, false),
    xmlEl("VATTotal", vatTotal, false),
    xmlEl("NetAssetTotal", netTotal, false),
    xmlEl("PaymentType", payType, false),
    xmlEl("PaymentAmount", docTotal, false),
    xmlEl("PartnerCode", "", true),
    xmlEl("PartnerName", p.name, true),
    xmlEl("PartnerCity", p.city, true),
    xmlEl("PartnerAddress", p.address, true),
    xmlEl("PartnerContactName", p.mol, true),
    xmlEl("PartnerTaxID", p.bulstat, true),
    xmlEl("PartnerVATID", p.vatReg, true),
    xmlEl("OperationDescription", opDesc, true),
    "</ExportData>",
  ];

  return lines.join("\n");
}

const MICROINVEST_XML_DECL = '<?xml version="1.0" standalone="yes" ?>';

function wrapMicroinvestRoot(exportDataBlocks: string[]): string {
  return [`${MICROINVEST_XML_DECL}\n<Microinvest>`, ...exportDataBlocks, `</Microinvest>\n`].join("\n");
}

/** Single-invoice Microinvest XML document. */
export function buildMicroinvestWarehouseXml(fullInvoice: InvoiceExportLike): string {
  return wrapMicroinvestRoot([buildMicroinvestExportDataBlock(fullInvoice)]);
}

/**
 * Period / batch export: one `<Microinvest>` root, multiple `<ExportData>` siblings.
 * Empty `invoices` yields a valid document with no ExportData blocks (callers should prefer rejecting empty sets).
 */
export function buildMicroinvestWarehouseXmlBatch(invoices: InvoiceExportLike[]): string {
  return wrapMicroinvestRoot(invoices.map(buildMicroinvestExportDataBlock));
}

/** Plain-text line export with same semantic fields (custom interchange; not in vendor PDF). */
export function buildMicroinvestWarehouseTxt(fullInvoice: InvoiceExportLike): string {
  const inv = fullInvoice;
  const client = inv.client as Record<string, unknown> | null | undefined;
  const p = buildMicroinvestPartnerFields(client);
  const issue = formatMicroinvestDate(inv.issueDate);
  const payType = microinvestPaymentType(inv.paymentMethod ?? undefined);
  const invNo = String(inv.invoiceNumber || "").trim();
  const opDesc = typeof inv.notes === "string" && inv.notes.trim() ? inv.notes.trim() : "";

  const rows: Record<string, string> = {
    FORMAT: "MICROINVEST_WAREHOUSE_EXPORT_V1",
    StockReceiptType: "2",
    StockReceiptNo: invNo,
    StockReceiptDate: issue,
    InvoiceNo: invNo,
    InvoiceDate: issue,
    DocumentType: "1",
    DocTotal: microinvestMoney(inv.total),
    VATTotal: microinvestMoney(inv.taxAmount),
    NetAssetTotal: microinvestMoney(inv.subtotal),
    PaymentType: payType,
    PaymentAmount: microinvestMoney(inv.total),
    PartnerCode: "",
    PartnerName: p.name,
    PartnerCity: p.city,
    PartnerAddress: p.address,
    PartnerContactName: p.mol,
    PartnerTaxID: p.bulstat,
    PartnerVATID: p.vatReg,
    OperationDescription: opDesc,
  };

  return Object.entries(rows)
    .map(([k, v]) => `${k}=${v}`)
    .join("\n");
}

function sanitizeFormScriptValue(value: string): string {
  return value.replace(/[\r\n]+/g, " ").trim();
}

function toFormScriptRows(inv: InvoiceExportLike, includePrint: boolean): string[] {
  const client = inv.client as Record<string, unknown> | null | undefined;
  const p = buildMicroinvestPartnerFields(client);
  const issueDate = formatMicroinvestDate(inv.issueDate);
  const amount = microinvestMoney(inv.total);
  const paymentDesc =
    inv.paymentMethod === "CASH"
      ? "В брой"
      : inv.paymentMethod === "CREDIT_CARD"
        ? "Карта"
        : "Банков превод";

  const operationDescription =
    typeof inv.notes === "string" && inv.notes.trim()
      ? inv.notes.trim()
      : `Фактура ${String(inv.invoiceNumber || "").trim()}`;

  const rows = [
    "F3",
    "CLEAR",
    `До=${sanitizeFormScriptValue(p.name)}`,
    `Адрес=${sanitizeFormScriptValue(p.address)}`,
    `Подаване=${sanitizeFormScriptValue(issueDate)}`,
    `Платете на - име на получателя=${sanitizeFormScriptValue(p.name)}`,
    `Вид валута=BGN`,
    `Сума=${sanitizeFormScriptValue(amount)}`,
    `Основание за плащане - информация за получателя=${sanitizeFormScriptValue(operationDescription)}`,
    `Наредител - име=Фактура ${sanitizeFormScriptValue(String(inv.invoiceNumber || ""))}`,
    `Вид плащане=${sanitizeFormScriptValue(paymentDesc)}`,
    "SAVE",
  ];

  if (includePrint) rows.push("PRINT");
  return rows;
}

export function buildMicroinvestWarehouseTxtBatch(
  invoices: InvoiceExportLike[],
  options?: { includePrint?: boolean }
): string {
  const includePrint = options?.includePrint ?? true;
  const lines: string[] = [];

  for (const inv of invoices) {
    lines.push(...toFormScriptRows(inv, includePrint));
  }

  lines.push("END");
  return lines.join("\r\n");
}

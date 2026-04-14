import { readFileSync } from "fs";
import { join } from "path";
import jsPDF from "jspdf";
import { APP_NAME } from "@/config/constants";
import { resolvePdfVisualPrefsForUser } from "@/lib/pdf-visual-preferences.server";
import { embedCompanyLogoInPdf } from "@/lib/pdf-company-logo";
import { getVatProtocol117ScenarioLabel } from "@/lib/vat-protocol-117-scenarios";

/** Same neutral palette as invoice PDF (`pdf-generator.ts`) — print-friendly RGB 0–255 */
const PAL = {
  ink: [15, 23, 42] as [number, number, number],
  text: [51, 65, 85] as [number, number, number],
  muted: [100, 116, 139] as [number, number, number],
  faint: [148, 163, 184] as [number, number, number],
  border: [226, 232, 240] as [number, number, number],
  surface: [248, 250, 252] as [number, number, number],
  surface2: [241, 245, 249] as [number, number, number],
  accent: [79, 70, 229] as [number, number, number],
};

function formatCurrency(amount: number, currency: string): string {
  const formatted = amount.toFixed(2);
  const symbols: Record<string, string> = {
    EUR: "€",
    BGN: "лв.",
    USD: "$",
    GBP: "£",
  };
  return `${formatted} ${symbols[currency] || currency}`;
}

export async function generateVatProtocol117PdfServer(protocol: any): Promise<Buffer> {
  const pdfPrefs = await resolvePdfVisualPrefsForUser(protocol.userId as string | undefined);

  const fontPath = join(process.cwd(), "public", "fonts");
  const regularFont = readFileSync(join(fontPath, "Roboto-Regular.ttf"));
  const boldFont = readFileSync(join(fontPath, "Roboto-Bold.ttf"));

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
    putOnlyUsedFonts: true,
    floatPrecision: 16,
  });

  doc.addFileToVFS("Roboto-Regular.ttf", regularFont.toString("base64"));
  doc.addFileToVFS("Roboto-Bold.ttf", boldFont.toString("base64"));
  doc.addFont("Roboto-Regular.ttf", "Roboto", "normal");
  doc.addFont("Roboto-Bold.ttf", "Roboto", "bold");

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 16;
  const contentWidth = pageWidth - 2 * margin;
  const rightEdge = pageWidth - margin;

  const setText = (c: [number, number, number]) => doc.setTextColor(c[0], c[1], c[2]);
  const setDraw = (c: [number, number, number], w = 0.12) => {
    doc.setDrawColor(c[0], c[1], c[2]);
    doc.setLineWidth(w);
  };
  const setFill = (c: [number, number, number]) => doc.setFillColor(c[0], c[1], c[2]);

  const currency = protocol.currency || "EUR";
  const scenarioLabel = getVatProtocol117ScenarioLabel(String(protocol.scenario || ""));
  const issueDate = protocol.issueDate
    ? new Date(protocol.issueDate).toLocaleDateString("bg-BG")
    : new Date().toLocaleDateString("bg-BG");
  const taxEventDate = protocol.taxEventDate
    ? new Date(protocol.taxEventDate).toLocaleDateString("bg-BG")
    : "—";
  const placeOfIssue = protocol.placeOfIssue?.trim() || "София";

  // ---- Top: logo + app name (invoice layout) ----
  const brandTopY = 6;
  const brandLogoMaxW = 52;
  const brandLogoMaxH = 9;

  let brandLogoDrawH = 0;
  if (pdfPrefs.showCompanyLogo && protocol.company?.logo) {
    brandLogoDrawH = await embedCompanyLogoInPdf(
      doc,
      protocol.company.logo,
      { x: margin, y: brandTopY, maxW: brandLogoMaxW, maxH: brandLogoMaxH },
      `vat-protocol-117:${protocol.id ?? protocol.protocolNumber ?? "unknown"}`
    );
  }

  doc.setFont("Roboto", "normal");
  doc.setFontSize(6.5);
  setText(PAL.muted);
  const appNameBaselineY =
    brandLogoDrawH > 0 ? brandTopY + brandLogoDrawH / 2 + 1.2 : 11;
  doc.text(APP_NAME, rightEdge, appNameBaselineY, { align: "right" });

  doc.setFont("Roboto", "bold");
  doc.setFontSize(8);
  setText(PAL.faint);
  doc.text("ПРОТОКОЛ ПО ЧЛ. 117 ОТ ЗДДС", pageWidth / 2, 17, { align: "center" });

  const headerRowY = 22;
  const leftBlockTop = headerRowY;

  doc.setFont("Roboto", "normal");
  doc.setFontSize(7);
  setText(PAL.muted);
  doc.text("Издал протокола", margin, leftBlockTop);
  doc.setFont("Roboto", "bold");
  doc.setFontSize(12);
  setText(PAL.ink);
  doc.text(protocol.company?.name || "", margin, leftBlockTop + 4);
  doc.setFont("Roboto", "normal");
  doc.setFontSize(8.5);
  setText(PAL.text);
  let ly = leftBlockTop + 9;
  if (protocol.company?.address) {
    doc.text(protocol.company.address, margin, ly);
    ly += 4;
  }
  if (protocol.company?.city) {
    doc.text(protocol.company.city, margin, ly);
    ly += 4;
  }
  if (protocol.company?.phone) {
    doc.text(`Тел. ${protocol.company.phone}`, margin, ly);
    ly += 4;
  }

  doc.setFont("Roboto", "bold");
  doc.setFontSize(26);
  setText(PAL.ink);
  doc.text("ПРОТОКОЛ", rightEdge, headerRowY + 10, { align: "right" });
  doc.setFontSize(11);
  doc.text(`№ ${protocol.protocolNumber || "—"}`, rightEdge, headerRowY + 18, { align: "right" });
  doc.setFont("Roboto", "normal");
  doc.setFontSize(8);
  setText(PAL.muted);
  const scenShort =
    scenarioLabel.length > 72 ? `${scenarioLabel.slice(0, 69)}…` : scenarioLabel;
  doc.text(`Сценарий · ${scenShort}`, rightEdge, headerRowY + 24, { align: "right" });

  let yPos = Math.max(ly + 6, headerRowY + 32) + 4;

  // ---- Date strip (same as invoice) ----
  const dateStripH = 16;
  setFill(PAL.surface);
  doc.roundedRect(margin, yPos, contentWidth, dateStripH, 2, 2, "F");
  setDraw(PAL.border, 0.1);
  doc.roundedRect(margin, yPos, contentWidth, dateStripH, 2, 2, "S");

  const cw = contentWidth / 3;
  const dY = yPos + 5;
  const dVal = yPos + 11;
  doc.setFont("Roboto", "normal");
  doc.setFontSize(7);
  setText(PAL.muted);
  doc.text("Дата на издаване", margin + 4, dY);
  doc.text("Данъчно събитие", margin + cw + 4, dY);
  doc.text("Място", margin + cw * 2 + 4, dY);

  doc.setFont("Roboto", "bold");
  doc.setFontSize(9);
  setText(PAL.ink);
  doc.text(issueDate, margin + 4, dVal);
  doc.text(taxEventDate, margin + cw + 4, dVal);
  doc.text(placeOfIssue, margin + cw * 2 + 4, dVal);

  yPos += dateStripH + 8;

  // ---- Party cards (invoice-style soft cards) ----
  const gap = 5;
  const boxW = (contentWidth - gap) / 2;
  const pad = 5;
  const r = 2.5;

  const issuerLines: string[] = [];
  if (protocol.company?.address) issuerLines.push(protocol.company.address);
  if (protocol.company?.city) issuerLines.push(protocol.company.city);
  if (protocol.company?.phone) issuerLines.push(`Тел. ${protocol.company.phone}`);
  if (protocol.company?.bulstatNumber) issuerLines.push(`ЕИК ${protocol.company.bulstatNumber}`);
  if (protocol.company?.vatRegistrationNumber) {
    issuerLines.push(`ДДС № ${protocol.company.vatRegistrationNumber}`);
  }
  if (protocol.company?.mol) issuerLines.push(`МОЛ ${protocol.company.mol}`);

  const supplierLines: string[] = [];
  if (protocol.client?.address) supplierLines.push(protocol.client.address);
  if (protocol.client?.city) supplierLines.push(protocol.client.city);
  if (protocol.client?.phone) supplierLines.push(`Тел. ${protocol.client.phone}`);
  if (protocol.client?.bulstatNumber) supplierLines.push(`ЕИК ${protocol.client.bulstatNumber}`);
  const clientVat =
    (protocol.client?.vatNumber && String(protocol.client.vatNumber).trim()) ||
    (protocol.client?.vatRegistrationNumber &&
      String(protocol.client.vatRegistrationNumber).trim()) ||
    "";
  if (clientVat) supplierLines.push(`ДДС № ${clientVat}`);
  if (protocol.client?.mol) supplierLines.push(`МОЛ ${protocol.client.mol}`);

  const innerBlock = (lineCount: number) => 4 + 6 + 5 + lineCount * 4 + pad;
  const issuerH = Math.max(40, innerBlock(issuerLines.length));
  const supplierH = Math.max(40, innerBlock(supplierLines.length));
  const cardH = Math.max(issuerH, supplierH);

  const yParties = yPos;
  const clientX = margin + boxW + gap;

  setFill(PAL.surface);
  doc.roundedRect(margin, yParties, boxW, cardH, r, r, "F");
  doc.roundedRect(clientX, yParties, boxW, cardH, r, r, "F");
  setDraw(PAL.border, 0.1);
  doc.roundedRect(margin, yParties, boxW, cardH, r, r, "S");
  doc.roundedRect(clientX, yParties, boxW, cardH, r, r, "S");

  doc.setFont("Roboto", "normal");
  doc.setFontSize(6.5);
  setText(PAL.faint);
  doc.text("ИЗДАЛ ПРОТОКОЛА", margin + pad, yParties + 5);
  doc.text("ДОСТАВЧИК", clientX + pad, yParties + 5);

  doc.setFont("Roboto", "bold");
  doc.setFontSize(10);
  setText(PAL.ink);
  doc.text(protocol.company?.name || "", margin + pad, yParties + 11);
  doc.text(protocol.client?.name || "", clientX + pad, yParties + 11);

  doc.setFont("Roboto", "normal");
  doc.setFontSize(8.5);
  setText(PAL.text);
  let sy = yParties + 17;
  issuerLines.forEach((line) => {
    doc.text(line, margin + pad, sy);
    sy += 4;
  });
  let cy = yParties + 17;
  supplierLines.forEach((line) => {
    doc.text(line, clientX + pad, cy);
    cy += 4;
  });

  yPos = yParties + cardH + 10;

  // ---- Supplier invoice reference (soft panel) ----
  if (protocol.supplierInvoiceNumber || protocol.supplierInvoiceDate) {
    const supRef = protocol.supplierInvoiceNumber || "—";
    const supDt = protocol.supplierInvoiceDate
      ? new Date(protocol.supplierInvoiceDate).toLocaleDateString("bg-BG")
      : "—";
    const refH = 14;
    setFill(PAL.surface);
    doc.roundedRect(margin, yPos, contentWidth, refH, 2, 2, "F");
    setDraw(PAL.border, 0.1);
    doc.roundedRect(margin, yPos, contentWidth, refH, 2, 2, "S");
    doc.setFont("Roboto", "bold");
    doc.setFontSize(7.5);
    setText(PAL.muted);
    doc.text("ФАКТУРА НА ДОСТАВЧИК", margin + 4, yPos + 5);
    doc.setFont("Roboto", "normal");
    doc.setFontSize(8.5);
    setText(PAL.text);
    doc.text(`№ ${supRef} · ${supDt}`, margin + 4, yPos + 10);
    yPos += refH + 8;
  }

  // ---- Legal basis (accent top border like invoice table header cue) ----
  if (protocol.legalBasisNote?.trim()) {
    const basisLines = doc.splitTextToSize(protocol.legalBasisNote.trim(), contentWidth - 16);
    const basisH = 8 + basisLines.length * 4;
    setFill(PAL.surface);
    doc.roundedRect(margin, yPos, contentWidth, basisH, 2, 2, "F");
    setDraw(PAL.border, 0.1);
    doc.roundedRect(margin, yPos, contentWidth, basisH, 2, 2, "S");
    setDraw(PAL.accent, 0.25);
    doc.line(margin, yPos + 0.5, margin + contentWidth, yPos + 0.5);
    doc.setFont("Roboto", "bold");
    doc.setFontSize(7.5);
    setText(PAL.muted);
    doc.text("Правно основание / пояснение", margin + 4, yPos + 6);
    doc.setFont("Roboto", "normal");
    doc.setFontSize(8.5);
    setText(PAL.text);
    doc.text(basisLines, margin + 4, yPos + 10);
    yPos += basisH + 8;
  }

  if (protocol.notes?.trim()) {
    doc.setFont("Roboto", "bold");
    doc.setFontSize(8);
    setText(PAL.muted);
    doc.text("Бележки", margin, yPos);
    doc.setFont("Roboto", "normal");
    setText(PAL.text);
    const noteLines = doc.splitTextToSize(protocol.notes.trim(), contentWidth);
    doc.text(noteLines, margin, yPos + 4);
    yPos += 4 + noteLines.length * 4 + 6;
  }

  // ---- Line items (Stripe / invoice table) ----
  const cNo = 8;
  const cDesc = 78;
  const cUnit = 12;
  const cQty = 14;
  const cPrice = 26;
  const cVat = 14;
  const cTot = 28;
  const x0 = margin;
  const xDesc = x0 + cNo;
  const xUnit = xDesc + cDesc;
  const xQty = xUnit + cUnit;
  const xPrice = xQty + cQty;
  const xVat = xPrice + cPrice;
  const xTot = xVat + cVat;

  const headH = 9;
  setFill(PAL.surface2);
  doc.rect(x0, yPos, contentWidth, headH, "F");
  setDraw(PAL.accent, 0.25);
  doc.line(x0, yPos + headH, x0 + contentWidth, yPos + headH);

  doc.setFont("Roboto", "bold");
  doc.setFontSize(7.5);
  setText(PAL.muted);
  doc.text("№", x0 + 2, yPos + 6);
  doc.text("Описание", xDesc + 2, yPos + 6);
  doc.text("Мярка", xUnit + 1, yPos + 6);
  doc.text("Кол.", xQty + 1, yPos + 6);
  doc.text("Ед. цена", xPrice + 1, yPos + 6);
  doc.text("ДДС", xVat + 1, yPos + 6);
  doc.text("Сума", xTot + cTot - 2, yPos + 6, { align: "right" });

  yPos += headH;
  const rowH = 8.5;
  const items = protocol.items || [];

  if (items.length > 0) {
    items.forEach((item: any, index: number) => {
      setDraw(PAL.border, 0.08);
      doc.line(x0, yPos, x0 + contentWidth, yPos);

      doc.setFont("Roboto", "normal");
      doc.setFontSize(8.5);
      setText(PAL.text);
      doc.text(String(index + 1), x0 + 3, yPos + 5.5);

      const description = item.description || "";
      const descLines = doc.splitTextToSize(
        description.length > 120 ? `${description.slice(0, 117)}…` : description,
        cDesc - 2
      );
      doc.text(descLines, xDesc + 1, yPos + 5.5);

      const descH = Math.max(rowH, 3 + descLines.length * 4);
      const rowY = yPos + 5.5;

      doc.text(item.unit || "бр.", xUnit + 1, rowY);
      doc.text(String(Number(item.quantity || 0)), xQty + 1, rowY);
      doc.text(Number(item.unitPrice || 0).toFixed(2), xPrice + cPrice - 1, rowY, {
        align: "right",
      });
      doc.text(`${Number(item.taxRate || 0).toFixed(0)}%`, xVat + 1, rowY);

      const itemQuantity = Number(item.quantity || 0);
      const itemUnitPrice = Number(item.unitPrice || 0);
      const itemTaxRate = Number(item.taxRate || 0);
      const itemSubtotal = itemQuantity * itemUnitPrice;
      const itemTax = itemSubtotal * (itemTaxRate / 100);
      const itemTotal =
        item.total != null ? Number(item.total) : itemSubtotal + itemTax;

      doc.setFont("Roboto", "bold");
      doc.text(itemTotal.toFixed(2), xTot + cTot - 1, rowY, { align: "right" });

      yPos += descH;
    });
  }

  setDraw(PAL.border, 0.15);
  doc.line(x0, yPos, x0 + contentWidth, yPos);
  yPos += 10;

  // ---- Totals (invoice-style, no colored box) ----
  const totalsW = 78;
  const totalsX = rightEdge - totalsW;
  const totalsTop = yPos;
  const displayTotal = Number(protocol.total || 0);

  doc.setFont("Roboto", "normal");
  doc.setFontSize(9);
  setText(PAL.muted);
  doc.text("Данъчна основа", totalsX, totalsTop + 5);
  setText(PAL.text);
  doc.text(formatCurrency(Number(protocol.subtotal || 0), currency), rightEdge, totalsTop + 5, {
    align: "right",
  });

  doc.setFontSize(9);
  setText(PAL.muted);
  doc.text("Начислен ДДС", totalsX, totalsTop + 11);
  setText(PAL.text);
  doc.text(formatCurrency(Number(protocol.taxAmount || 0), currency), rightEdge, totalsTop + 11, {
    align: "right",
  });

  yPos = totalsTop + 16;
  setDraw(PAL.border, 0.12);
  doc.line(totalsX, yPos, rightEdge, yPos);
  yPos += 8;

  doc.setFont("Roboto", "bold");
  doc.setFontSize(14);
  setText(PAL.ink);
  doc.text("ОБЩО", totalsX, yPos);
  doc.text(formatCurrency(displayTotal, currency), rightEdge, yPos, { align: "right" });

  yPos += 14;

  // ---- Footer ----
  yPos = pageHeight - 42;
  doc.setFont("Roboto", "normal");
  doc.setFontSize(6.5);
  setText(PAL.faint);
  const legalText = [
    "Документ по чл. 117 от ЗДДС — за счетоводно отразяване и определяне на данъчни задължения.",
    "Проверете реквизитите спрямо чл. 117 и ППЗДДС за конкретния случай.",
    "Не замества правен или счетоводен съвет. Валиден без подпис и печат при спазване на ЗСч.",
  ];
  legalText.forEach((text, i) => doc.text(text, margin, yPos + i * 3.5));

  yPos = pageHeight - 22;
  setDraw(PAL.border, 0.12);
  doc.line(margin, yPos, margin + 55, yPos);
  doc.line(rightEdge - 55, yPos, rightEdge, yPos);
  doc.setFontSize(6.5);
  setText(PAL.muted);
  doc.text("Издал протокола", margin + 27.5, yPos + 4, { align: "center" });
  doc.text("Доставчик", rightEdge - 27.5, yPos + 4, { align: "center" });

  doc.setFont("Roboto", "normal");
  doc.setFontSize(5.5);
  setText(PAL.faint);
  doc.text(`Генерирано с ${APP_NAME}`, pageWidth / 2, pageHeight - 4, { align: "center" });

  return Buffer.from(doc.output("arraybuffer"));
}

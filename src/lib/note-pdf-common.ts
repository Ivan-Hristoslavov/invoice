import { readFileSync } from "fs";
import { join } from "path";
import jsPDF from "jspdf";
import { resolvePdfVisualPrefsForUser } from "@/lib/pdf-visual-preferences.server";
import { embedCompanyLogoInPdf } from "@/lib/pdf-company-logo";
import { APP_NAME } from "@/config/constants";

type Rgb = [number, number, number];

const PAL = {
  ink: [15, 23, 42] as Rgb,
  text: [51, 65, 85] as Rgb,
  muted: [100, 116, 139] as Rgb,
  faint: [148, 163, 184] as Rgb,
  border: [226, 232, 240] as Rgb,
  surface: [248, 250, 252] as Rgb,
  surface2: [241, 245, 249] as Rgb,
};

function formatCurrency(amount: number, currency: string): string {
  const formatted = amount.toFixed(2);
  const symbols: Record<string, string> = { EUR: "€", BGN: "лв.", USD: "$", GBP: "£" };
  return `${formatted} ${symbols[currency] || currency}`;
}

export async function generateNotePdfServer(
  note: any,
  options: {
    title: "КРЕДИТНО ИЗВЕСТИЕ" | "ДЕБИТНО ИЗВЕСТИЕ";
    numberKey: "creditNoteNumber" | "debitNoteNumber";
    accent: Rgb;
    totalSign: "-" | "+";
  }
): Promise<Buffer> {
  const pdfPrefs = await resolvePdfVisualPrefsForUser(note.userId as string | undefined);
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
  const noteNumber = note?.[options.numberKey] || "—";
  const noteTypeLower = options.title.toLowerCase();
  const currency = note.currency || "EUR";

  const setText = (c: Rgb) => doc.setTextColor(c[0], c[1], c[2]);
  const setDraw = (c: Rgb, w = 0.12) => {
    doc.setDrawColor(c[0], c[1], c[2]);
    doc.setLineWidth(w);
  };
  const setFill = (c: Rgb) => doc.setFillColor(c[0], c[1], c[2]);

  let brandLogoDrawH = 0;
  if (pdfPrefs.showCompanyLogo && note.company?.logo) {
    brandLogoDrawH = await embedCompanyLogoInPdf(
      doc,
      note.company.logo,
      { x: margin, y: 6, maxW: 52, maxH: 9 },
      `${options.numberKey}:${note.id ?? noteNumber}`
    );
  }

  doc.setFont("Roboto", "normal");
  doc.setFontSize(6.5);
  setText(PAL.muted);
  const appNameBaselineY = brandLogoDrawH > 0 ? 6 + brandLogoDrawH / 2 + 1.2 : 11;
  doc.text(APP_NAME, rightEdge, appNameBaselineY, { align: "right" });

  doc.setFont("Roboto", "bold");
  doc.setFontSize(8);
  setText(PAL.faint);
  doc.text("ОРИГИНАЛ", pageWidth / 2, 17, { align: "center" });

  const headerRowY = 22;
  doc.setFont("Roboto", "bold");
  doc.setFontSize(23);
  setText(options.accent);
  doc.text(options.title, rightEdge, headerRowY + 10, { align: "right" });
  doc.setFontSize(11);
  setText(PAL.ink);
  doc.text(`№ ${noteNumber}`, rightEdge, headerRowY + 18, { align: "right" });

  const issueDate = note.issueDate
    ? new Date(note.issueDate).toLocaleDateString("bg-BG")
    : new Date().toLocaleDateString("bg-BG");
  const invoiceRef = note.invoice?.invoiceNumber || "—";
  const invoiceDate = note.invoice?.issueDate
    ? new Date(note.invoice.issueDate).toLocaleDateString("bg-BG")
    : "—";

  let yPos = headerRowY + 36;
  const dateStripH = 16;
  const cw = contentWidth / 3;
  setFill(PAL.surface);
  doc.roundedRect(margin, yPos, contentWidth, dateStripH, 2, 2, "F");
  setDraw(PAL.border, 0.1);
  doc.roundedRect(margin, yPos, contentWidth, dateStripH, 2, 2, "S");

  doc.setFont("Roboto", "normal");
  doc.setFontSize(7);
  setText(PAL.muted);
  doc.text("Дата на издаване", margin + 4, yPos + 5);
  doc.text("Към фактура №", margin + cw + 4, yPos + 5);
  doc.text("Дата на фактурата", margin + cw * 2 + 4, yPos + 5);
  doc.setFont("Roboto", "bold");
  doc.setFontSize(9);
  setText(PAL.ink);
  doc.text(issueDate, margin + 4, yPos + 11);
  doc.text(invoiceRef, margin + cw + 4, yPos + 11);
  doc.text(invoiceDate, margin + cw * 2 + 4, yPos + 11);

  yPos += dateStripH + 8;
  const gap = 5;
  const boxW = (contentWidth - gap) / 2;
  const clientX = margin + boxW + gap;
  const cardH = 44;

  setFill(PAL.surface);
  doc.roundedRect(margin, yPos, boxW, cardH, 2.5, 2.5, "F");
  doc.roundedRect(clientX, yPos, boxW, cardH, 2.5, 2.5, "F");
  setDraw(PAL.border, 0.1);
  doc.roundedRect(margin, yPos, boxW, cardH, 2.5, 2.5, "S");
  doc.roundedRect(clientX, yPos, boxW, cardH, 2.5, 2.5, "S");

  doc.setFont("Roboto", "normal");
  doc.setFontSize(6.5);
  setText(PAL.faint);
  doc.text("ДОСТАВЧИК", margin + 5, yPos + 5);
  doc.text("ПОЛУЧАТЕЛ", clientX + 5, yPos + 5);

  doc.setFont("Roboto", "bold");
  doc.setFontSize(10);
  setText(PAL.ink);
  doc.text(note.company?.name || "", margin + 5, yPos + 11);
  doc.text(note.client?.name || "", clientX + 5, yPos + 11);

  doc.setFont("Roboto", "normal");
  doc.setFontSize(8.2);
  setText(PAL.text);
  const companyLines = [
    note.company?.address,
    note.company?.city,
    note.company?.bulstatNumber ? `ЕИК ${note.company.bulstatNumber}` : "",
    note.company?.vatRegistrationNumber ? `ДДС № ${note.company.vatRegistrationNumber}` : "",
  ].filter(Boolean);
  const clientLines = [
    note.client?.address,
    note.client?.city,
    note.client?.bulstatNumber ? `ЕИК ${note.client.bulstatNumber}` : "",
    note.client?.vatRegistrationNumber || note.client?.vatNumber
      ? `ДДС № ${note.client?.vatRegistrationNumber || note.client?.vatNumber}`
      : "",
  ].filter(Boolean);
  companyLines.slice(0, 6).forEach((line, i) => doc.text(String(line), margin + 5, yPos + 17 + i * 4));
  clientLines.slice(0, 6).forEach((line, i) => doc.text(String(line), clientX + 5, yPos + 17 + i * 4));

  yPos += cardH + 9;

  if (note.reason) {
    setDraw(options.accent, 0.1);
    doc.roundedRect(margin, yPos, contentWidth, 12, 2, 2, "S");
    doc.setFont("Roboto", "bold");
    doc.setFontSize(8);
    setText(options.accent);
    doc.text("Основание", margin + 4, yPos + 4.5);
    doc.setFont("Roboto", "normal");
    doc.setFontSize(8.5);
    setText(PAL.text);
    const reasonLines = doc.splitTextToSize(String(note.reason), contentWidth - 8);
    doc.text(reasonLines.slice(0, 1), margin + 4, yPos + 9);
    yPos += 16;
  }

  const cNo = 8;
  const cDesc = 88;
  const cQty = 18;
  const cPrice = 28;
  const cVat = 14;
  const cTot = 24;
  const x0 = margin;
  const xDesc = x0 + cNo;
  const xQty = xDesc + cDesc;
  const xPrice = xQty + cQty;
  const xVat = xPrice + cPrice;
  const xTot = xVat + cVat;

  setFill(PAL.surface2);
  doc.rect(x0, yPos, contentWidth, 9, "F");
  setDraw(options.accent, 0.25);
  doc.line(x0, yPos + 9, x0 + contentWidth, yPos + 9);
  doc.setFont("Roboto", "bold");
  doc.setFontSize(7.5);
  setText(PAL.muted);
  doc.text("№", x0 + 2, yPos + 6);
  doc.text("Описание", xDesc + 1, yPos + 6);
  doc.text("Кол.", xQty + 1, yPos + 6);
  doc.text("Ед. цена", xPrice + 1, yPos + 6);
  doc.text("ДДС", xVat + 1, yPos + 6);
  doc.text("Сума", xTot + cTot - 1, yPos + 6, { align: "right" });
  yPos += 9;

  const items = Array.isArray(note.items) ? note.items : [];
  items.forEach((item: { description?: string; quantity?: number; unitPrice?: number; taxRate?: number; total?: number }, index: number) => {
    setDraw(PAL.border, 0.08);
    doc.line(x0, yPos, x0 + contentWidth, yPos);
    doc.setFont("Roboto", "normal");
    doc.setFontSize(8.5);
    setText(PAL.text);
    doc.text(String(index + 1), x0 + 3, yPos + 5.5);
    doc.text(String(item.description || "").slice(0, 64), xDesc + 1, yPos + 5.5);
    doc.text(String(Number(item.quantity || 0)), xQty + 1, yPos + 5.5);
    doc.text(Number(item.unitPrice || 0).toFixed(2), xPrice + cPrice - 1, yPos + 5.5, { align: "right" });
    doc.text(`${Number(item.taxRate || 0).toFixed(0)}%`, xVat + 1, yPos + 5.5);
    doc.setFont("Roboto", "bold");
    doc.text(Number(item.total || 0).toFixed(2), xTot + cTot - 1, yPos + 5.5, { align: "right" });
    yPos += 8.5;
  });

  setDraw(PAL.border, 0.12);
  doc.line(x0, yPos, x0 + contentWidth, yPos);
  yPos += 8;

  const totalsX = rightEdge - 78;
  doc.setFont("Roboto", "normal");
  doc.setFontSize(9);
  setText(PAL.muted);
  doc.text("Сума без ДДС", totalsX, yPos);
  setText(PAL.text);
  doc.text(formatCurrency(Number(note.subtotal || 0), currency), rightEdge, yPos, { align: "right" });
  yPos += 6;
  setText(PAL.muted);
  doc.text("ДДС", totalsX, yPos);
  setText(PAL.text);
  doc.text(formatCurrency(Number(note.taxAmount || 0), currency), rightEdge, yPos, { align: "right" });
  yPos += 5;
  setDraw(PAL.border, 0.12);
  doc.line(totalsX, yPos, rightEdge, yPos);
  yPos += 8;

  doc.setFont("Roboto", "bold");
  doc.setFontSize(14);
  setText(options.accent);
  doc.text("ОБЩО", totalsX, yPos);
  doc.text(
    `${options.totalSign}${formatCurrency(Number(note.total || 0), currency)}`,
    rightEdge,
    yPos,
    { align: "right" }
  );

  const footerY = pageHeight - 10;
  doc.setFont("Roboto", "normal");
  doc.setFontSize(6.5);
  setText(PAL.faint);
  doc.text(
    `${options.title} № ${noteNumber} към фактура № ${invoiceRef}`,
    margin,
    footerY
  );
  doc.text(`Генерирано с ${APP_NAME}`, rightEdge, footerY, { align: "right" });

  const pdfOutput = doc.output("arraybuffer");
  return Buffer.from(pdfOutput);
}

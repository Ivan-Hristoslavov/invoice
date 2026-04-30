import { readFileSync } from "fs";
import { join } from "path";
import jsPDF from "jspdf";
import {
  formatAccountTypeLabel,
  formatInvoiceStatusLabel,
  formatPaymentMethodLabel,
} from "@/lib/invoice-report-presenter";

type ReportRow = {
  invoiceNumber: string;
  issueDate: string;
  status: string;
  paymentMethod?: string | null;
  accountType?: string | null;
  total: number;
  client?: { name?: string | null } | null;
};

export function generateInvoiceReportPdfBuffer(params: {
  title: string;
  periodLabel: string;
  rows: ReportRow[];
}) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4", putOnlyUsedFonts: true });
  const fontPath = join(process.cwd(), "public", "fonts");
  const regularFont = readFileSync(join(fontPath, "Roboto-Regular.ttf"));
  const boldFont = readFileSync(join(fontPath, "Roboto-Bold.ttf"));

  doc.addFileToVFS("Roboto-Regular.ttf", regularFont.toString("base64"));
  doc.addFileToVFS("Roboto-Bold.ttf", boldFont.toString("base64"));
  doc.addFont("Roboto-Regular.ttf", "Roboto", "normal");
  doc.addFont("Roboto-Bold.ttf", "Roboto", "bold");

  const margin = 14;
  const width = doc.internal.pageSize.getWidth() - margin * 2;
  const rightEdge = doc.internal.pageSize.getWidth() - margin;
  const tableTop = 42;

  const headers = ["№", "Дата", "Клиент", "Статус", "Плащане", "Тип сметка", "Сума"];
  const colWidths = [31, 20, 35, 24, 30, 24, 20];
  const drawTableHeader = (y: number) => {
    doc.setFillColor(237, 242, 247);
    doc.roundedRect(margin, y - 4.5, width, 8, 1.2, 1.2, "F");
    doc.setFont("Roboto", "bold");
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    let x = margin + 1.4;
    headers.forEach((header, idx) => {
      const isAmountColumn = idx === headers.length - 1;
      doc.text(header, isAmountColumn ? x + colWidths[idx] - 2 : x, y, isAmountColumn ? { align: "right" } : {});
      x += colWidths[idx];
    });
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.12);
    doc.line(margin, y + 3.2, margin + width, y + 3.2);
  };

  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, 10, width, 24, 2, 2, "F");
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, 10, width, 24, 2, 2, "S");

  doc.setFont("Roboto", "bold");
  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42);
  doc.text(params.title, margin + 3, 18);
  doc.setFont("Roboto", "normal");
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text(params.periodLabel, margin + 3, 24);
  doc.text(`Генерирано: ${new Date().toLocaleDateString("bg-BG")}`, margin + 3, 29);
  doc.setFont("Roboto", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text(`Записи: ${params.rows.length}`, rightEdge - 3, 22, { align: "right" });

  let y = tableTop;
  drawTableHeader(y);
  y += 7.8;
  doc.setFont("Roboto", "normal");
  doc.setFontSize(8.4);
  doc.setTextColor(30, 41, 59);
  params.rows.forEach((row) => {
    if (y > 276) {
      doc.addPage();
      y = 16.5;
      drawTableHeader(y);
      y += 7.8;
    }

    const issueDate = new Date(row.issueDate).toLocaleDateString("bg-BG");
    const cells = [
      row.invoiceNumber,
      issueDate,
      row.client?.name || "-",
      formatInvoiceStatusLabel(row.status),
      formatPaymentMethodLabel(row.paymentMethod),
      formatAccountTypeLabel(row.accountType),
      `${Number(row.total).toFixed(2)} €`,
    ];

    if (Math.floor((y - tableTop) / 6.8) % 2 === 0) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, y - 3.9, width, 6.6, "F");
    }

    let cx = margin + 1.4;
    cells.forEach((cell, idx) => {
      const maxChars = idx === 0 ? 15 : idx === 2 ? 16 : idx === 4 ? 14 : 12;
      const text = cell.length > maxChars ? `${cell.slice(0, maxChars - 1)}…` : cell;
      const isAmountColumn = idx === cells.length - 1;
      doc.text(text, isAmountColumn ? cx + colWidths[idx] - 2 : cx, y, isAmountColumn ? { align: "right" } : {});
      cx += colWidths[idx];
    });
    y += 6.8;
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.1);
    doc.line(margin, y - 3.5, margin + width, y - 3.5);
  });

  const totalAmount = params.rows.reduce((sum, row) => sum + Number(row.total || 0), 0);
  if (y < 270) {
    y += 4;
    doc.setDrawColor(148, 163, 184);
    doc.setLineWidth(0.14);
    doc.line(margin, y, margin + width, y);
    doc.setFont("Roboto", "bold");
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text(`Общо: ${totalAmount.toFixed(2)} €`, rightEdge, y + 6, { align: "right" });
  }

  return Buffer.from(doc.output("arraybuffer"));
}

import { readFileSync } from 'fs';
import { join } from 'path';
import jsPDF from 'jspdf';
import { normalizeInvoiceStatus } from '@/lib/invoice-status';
import { APP_NAME } from '@/config/constants';
import { resolvePdfVisualPrefsForUser } from '@/lib/pdf-visual-preferences.server';

type InvoicePdfVisualPrefs = {
  showCompanyLogo: boolean;
  showAmountInWords: boolean;
};

async function resolveInvoicePdfVisualPrefs(invoice: {
  userId?: string;
  showCompanyLogo?: boolean;
  showAmountInWords?: boolean;
}): Promise<InvoicePdfVisualPrefs> {
  if (
    typeof invoice.showCompanyLogo === 'boolean' &&
    typeof invoice.showAmountInWords === 'boolean'
  ) {
    return {
      showCompanyLogo: invoice.showCompanyLogo,
      showAmountInWords: invoice.showAmountInWords,
    };
  }
  return resolvePdfVisualPrefsForUser(invoice.userId);
}

/** Neutral SaaS palette (print-friendly) — RGB 0–255 */
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

// Helper function to convert number to words in Bulgarian
function numberToWordsBG(num: number, currency: string = 'EUR'): string {
  const units = ['', 'един', 'два', 'три', 'четири', 'пет', 'шест', 'седем', 'осем', 'девет'];
  const unitsF = ['', 'една', 'две', 'три', 'четири', 'пет', 'шест', 'седем', 'осем', 'девет'];
  const teens = ['десет', 'единадесет', 'дванадесет', 'тринадесет', 'четиринадесет', 'петнадесет', 'шестнадесет', 'седемнадесет', 'осемнадесет', 'деветнадесет'];
  const tens = ['', '', 'двадесет', 'тридесет', 'четиридесет', 'петдесет', 'шестдесет', 'седемдесет', 'осемдесет', 'деветдесет'];
  const hundreds = ['', 'сто', 'двеста', 'триста', 'четиристотин', 'петстотин', 'шестстотин', 'седемстотин', 'осемстотин', 'деветстотин'];

  if (num === 0) return 'нула';

  const intPart = Math.floor(num);
  const decimal = Math.round((num - intPart) * 100);
  
  function convertHundreds(n: number, feminine: boolean = false): string {
    if (n === 0) return '';
    
    const u = feminine ? unitsF : units;
    
    if (n < 10) return u[n];
    if (n < 20) return teens[n - 10];
    if (n < 100) {
      const t = Math.floor(n / 10);
      const unit = n % 10;
      return tens[t] + (unit > 0 ? ' и ' + u[unit] : '');
    }
    
    const h = Math.floor(n / 100);
    const remainder = n % 100;
    let result = hundreds[h];
    
    if (remainder > 0) {
      if (remainder < 20) {
        result += ' и ' + convertHundreds(remainder, feminine);
      } else if (remainder < 100) {
        result += ' ' + convertHundreds(remainder, feminine);
      } else {
        result += ' ' + convertHundreds(remainder, feminine);
      }
    }
    
    return result;
  }
  
  function convertThousands(n: number): string {
    if (n < 1000) return convertHundreds(n);
    
    const thousands = Math.floor(n / 1000);
    const remainder = n % 1000;
    
    let result = '';
    if (thousands === 1) {
      result = 'хиляда';
    } else if (thousands === 2) {
      result = 'две хиляди';
    } else if (thousands < 10) {
      result = unitsF[thousands] + ' хиляди';
    } else {
      result = convertHundreds(thousands, true) + ' хиляди';
    }
    
    if (remainder > 0) {
      if (remainder < 100) {
        result += ' и ' + convertHundreds(remainder);
      } else {
        result += ' ' + convertHundreds(remainder);
      }
    }
    
    return result;
  }
  
  let result = '';
  
  if (intPart >= 1000000) {
    result = intPart.toLocaleString('bg-BG');
  } else {
    result = convertThousands(intPart);
  }
  
  // Add currency word for integer part
  const currencyWordMap: Record<string, string> = {
    'EUR': 'евро', 'BGN': 'лева', 'USD': 'щатски долара', 'GBP': 'британски лири',
  };
  const centsWordMap: Record<string, [string, string]> = {
    'EUR': ['евроцент', 'евроцента'],
    'BGN': ['стотинка', 'стотинки'],
    'USD': ['цент', 'цента'],
    'GBP': ['пени', 'пени'],
  };
  const currWord = currencyWordMap[currency] || currency;
  const [centsSing, centsPlur] = centsWordMap[currency] || ['цент', 'цента'];

  if (intPart > 0) {
    result += ' ' + currWord;
  }

  if (decimal > 0) {
    // Convert decimal to words (cents/stotinki)
    if (decimal === 1) {
      result += ' и един ' + centsSing;
    } else if (decimal < 10) {
      result += ' и ' + unitsF[decimal] + ' ' + centsPlur;
    } else if (decimal < 20) {
      result += ' и ' + teens[decimal - 10] + ' ' + centsPlur;
    } else if (decimal < 100) {
      const t = Math.floor(decimal / 10);
      const unit = decimal % 10;
      if (unit === 0) {
        result += ' и ' + tens[t] + ' ' + centsPlur;
      } else {
        result += ' и ' + tens[t] + ' и ' + unitsF[unit] + ' ' + centsPlur;
      }
    }
  }
  
  return result || num.toString();
}

// Format currency
function formatCurrency(amount: number, currency: string): string {
  const formatted = amount.toFixed(2);
  const symbols: Record<string, string> = {
    'EUR': '€',
    'BGN': 'лв.',
    'USD': '$',
    'GBP': '£',
  };
  return `${formatted} ${symbols[currency] || currency}`;
}

// Get currency word (for amount-in-words section)
function getCurrencyWord(currency: string): string {
  const words: Record<string, string> = {
    'EUR': 'евро',
    'BGN': 'лева',
    'USD': 'щатски долара',
    'GBP': 'британски лири',
  };
  return words[currency] || currency;
}

// Get currency cents word
function getCurrencyCentsWord(currency: string, count: number): string {
  const words: Record<string, [string, string]> = { // [singular, plural]
    'EUR': ['евроцент', 'евроцента'],
    'BGN': ['стотинка', 'стотинки'],
    'USD': ['цент', 'цента'],
    'GBP': ['пени', 'пени'],
  };
  const pair = words[currency] || ['цент', 'цента'];
  return count === 1 ? pair[0] : pair[1];
}

// Server-side PDF generation function
export async function generateInvoicePdfServer(invoice: any): Promise<Buffer> {
  const pdfPrefs = await resolveInvoicePdfVisualPrefs(invoice);

  // Load fonts from file system
  const fontPath = join(process.cwd(), 'public', 'fonts');
  const regularFont = readFileSync(join(fontPath, 'Roboto-Regular.ttf'));
  const boldFont = readFileSync(join(fontPath, 'Roboto-Bold.ttf'));

  // Create PDF document
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    putOnlyUsedFonts: true,
    floatPrecision: 16
  });

  // Add fonts to PDF
  doc.addFileToVFS('Roboto-Regular.ttf', regularFont.toString('base64'));
  doc.addFileToVFS('Roboto-Bold.ttf', boldFont.toString('base64'));
  doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
  doc.addFont('Roboto-Bold.ttf', 'Roboto', 'bold');

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

  const isOriginal = invoice.isOriginal !== false;
  const badgeText = isOriginal ? "ОРИГИНАЛ" : "КОПИЕ";

  const status = invoice.status || "DRAFT";
  const normalizedStatus = normalizeInvoiceStatus(status);
  const statusText =
    normalizedStatus === "DRAFT"
      ? "ЧЕРНОВА"
      : normalizedStatus === "ISSUED"
        ? "ИЗДАДЕНА"
        : normalizedStatus === "VOIDED"
          ? "АНУЛИРАНА"
          : normalizedStatus === "CANCELLED"
            ? "СТОРНИРАНА"
            : normalizedStatus;

  const issueDate = invoice.issueDate
    ? new Date(invoice.issueDate).toLocaleDateString("bg-BG")
    : new Date().toLocaleDateString("bg-BG");
  const supplyDate = invoice.supplyDate
    ? new Date(invoice.supplyDate).toLocaleDateString("bg-BG")
    : issueDate;
  const dueDate = invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString("bg-BG") : "";

  const currency = invoice.currency || "EUR";
  const calculatedTotal = Number(invoice.subtotal || 0) + Number(invoice.taxAmount || 0);
  const displayTotal =
    Number(invoice.total || 0) > 0 ? Number(invoice.total || 0) : calculatedTotal;

  // ---- Brand (subtle, top right) ----
  doc.setFont("Roboto", "normal");
  doc.setFontSize(6.5);
  setText(PAL.muted);
  doc.text(APP_NAME, rightEdge, 11, { align: "right" });

  // ---- Original / copy ----
  doc.setFont("Roboto", "bold");
  doc.setFontSize(8);
  setText(PAL.faint);
  doc.text(badgeText, pageWidth / 2, 17, { align: "center" });

  // ---- Logo ----
  let logoH = 0;
  const headerRowY = 22;
  if (pdfPrefs.showCompanyLogo && invoice.company?.logo) {
    try {
      const logoResponse = await fetch(invoice.company.logo);
      if (logoResponse.ok) {
        const logoArrayBuffer = await logoResponse.arrayBuffer();
        const logoBuffer = Buffer.from(logoArrayBuffer);
        const logoBase64 = logoBuffer.toString("base64");
        const contentType = logoResponse.headers.get("content-type") || "image/png";
        const imageFormat = contentType.split("/")[1]?.split(";")[0] || "png";
        const maxLogoW = 32;
        const maxLogoH = 18;
        doc.addImage(logoBase64, imageFormat, margin, headerRowY, maxLogoW, maxLogoH);
        logoH = maxLogoH;
      }
    } catch (e) {
      console.warn("Could not load company logo:", e);
    }
  }

  const splitMid = margin + contentWidth * 0.5;
  const leftBlockTop = logoH > 0 ? headerRowY + logoH + 4 : headerRowY;

  // ---- Left: supplier preview ----
  doc.setFont("Roboto", "normal");
  doc.setFontSize(7);
  setText(PAL.muted);
  doc.text("Доставчик", margin, leftBlockTop);
  doc.setFont("Roboto", "bold");
  doc.setFontSize(12);
  setText(PAL.ink);
  doc.text(invoice.company?.name || "", margin, leftBlockTop + 4);
  doc.setFont("Roboto", "normal");
  doc.setFontSize(8.5);
  setText(PAL.text);
  let ly = leftBlockTop + 9;
  if (invoice.company?.address) {
    doc.text(invoice.company.address, margin, ly);
    ly += 4;
  }
  if (invoice.company?.city) {
    doc.text(invoice.company.city, margin, ly);
    ly += 4;
  }
  if (invoice.company?.phone) {
    doc.text(`Тел. ${invoice.company.phone}`, margin, ly);
    ly += 4;
  }

  // ---- Right: title block ----
  doc.setFont("Roboto", "bold");
  doc.setFontSize(26);
  setText(PAL.ink);
  doc.text("ФАКТУРА", rightEdge, headerRowY + 10, { align: "right" });
  doc.setFontSize(11);
  doc.text(`№ ${invoice.invoiceNumber || "—"}`, rightEdge, headerRowY + 18, { align: "right" });
  doc.setFont("Roboto", "normal");
  doc.setFontSize(8);
  setText(PAL.muted);
  doc.text(`Статус · ${statusText}`, rightEdge, headerRowY + 24, { align: "right" });

  let yPos = Math.max(ly + 6, headerRowY + 32) + 4;

  // ---- Date strip (soft surface, no heavy border) ----
  const dateStripH = 16;
  setFill(PAL.surface);
  doc.roundedRect(margin, yPos, contentWidth, dateStripH, 2, 2, "F");
  setDraw(PAL.border, 0.1);
  doc.roundedRect(margin, yPos, contentWidth, dateStripH, 2, 2, "S");

  const cw = contentWidth / 4;
  const dY = yPos + 5;
  const dVal = yPos + 11;
  doc.setFont("Roboto", "normal");
  doc.setFontSize(7);
  setText(PAL.muted);
  doc.text("Дата на издаване", margin + 4, dY);
  doc.text("Данъчно събитие", margin + cw + 4, dY);
  doc.text("Място", margin + cw * 2 + 4, dY);
  if (dueDate) doc.text("Падеж", margin + cw * 3 + 4, dY);

  doc.setFont("Roboto", "bold");
  doc.setFontSize(9);
  setText(PAL.ink);
  doc.text(issueDate, margin + 4, dVal);
  doc.text(supplyDate, margin + cw + 4, dVal);
  doc.text(invoice.placeOfIssue || "София", margin + cw * 2 + 4, dVal);
  if (dueDate) doc.text(dueDate, margin + cw * 3 + 4, dVal);

  yPos += dateStripH + 8;

  // ---- Parties: soft cards (background first, then text) ----
  const gap = 5;
  const boxW = (contentWidth - gap) / 2;
  const pad = 5;
  const r = 2.5;

  const supplierDetailLines: string[] = [];
  if (invoice.company?.address) supplierDetailLines.push(invoice.company.address);
  if (invoice.company?.city) supplierDetailLines.push(invoice.company.city);
  if (invoice.company?.phone) supplierDetailLines.push(`Тел. ${invoice.company.phone}`);
  if (invoice.company?.bulstatNumber) supplierDetailLines.push(`ЕИК ${invoice.company.bulstatNumber}`);
  if (invoice.company?.vatRegistered && invoice.company?.vatRegistrationNumber) {
    supplierDetailLines.push(`ДДС № ${invoice.company.vatRegistrationNumber}`);
  }
  if (invoice.company?.mol) supplierDetailLines.push(`МОЛ ${invoice.company.mol}`);

  const clientDetailLines: string[] = [];
  if (invoice.client?.address) clientDetailLines.push(invoice.client.address);
  if (invoice.client?.city) clientDetailLines.push(invoice.client.city);
  if (invoice.client?.phone) clientDetailLines.push(`Тел. ${invoice.client.phone}`);
  if (invoice.client?.bulstatNumber) clientDetailLines.push(`ЕИК ${invoice.client.bulstatNumber}`);
  const clientVatDisplay =
    (invoice.client?.vatNumber && String(invoice.client.vatNumber).trim()) ||
    (invoice.client?.vatRegistrationNumber &&
      String(invoice.client.vatRegistrationNumber).trim()) ||
    "";
  if (clientVatDisplay) clientDetailLines.push(`ДДС № ${clientVatDisplay}`);
  if (invoice.client?.mol) clientDetailLines.push(`МОЛ ${invoice.client.mol}`);

  const goodsRecipientLines: string[] = [];
  const gr = invoice.goodsRecipientSnapshot;
  if (gr && typeof gr === "object") {
    const gName = typeof gr.name === "string" ? gr.name.trim() : "";
    const gPhone = typeof gr.phone === "string" ? gr.phone.trim() : "";
    const gMol = typeof gr.mol === "string" ? gr.mol.trim() : "";
    if (gName || gPhone || gMol) {
      goodsRecipientLines.push("Получател на стоката:");
      if (gName) goodsRecipientLines.push(gName);
      if (gPhone) goodsRecipientLines.push(`Тел. ${gPhone}`);
      if (gMol) goodsRecipientLines.push(`МОЛ ${gMol}`);
    }
  }
  const clientPartyLines = [...clientDetailLines, ...goodsRecipientLines];

  const innerBlock = (lineCount: number) => 4 + 6 + 5 + lineCount * 4 + pad;
  const supplierH = Math.max(40, innerBlock(supplierDetailLines.length));
  const clientH = Math.max(40, innerBlock(clientPartyLines.length));
  const cardH = Math.max(supplierH, clientH);

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
  doc.text("ДОСТАВЧИК", margin + pad, yParties + 5);
  doc.text("ПОЛУЧАТЕЛ", clientX + pad, yParties + 5);

  doc.setFont("Roboto", "bold");
  doc.setFontSize(10);
  setText(PAL.ink);
  doc.text(invoice.company?.name || "", margin + pad, yParties + 11);
  doc.text(invoice.client?.name || "", clientX + pad, yParties + 11);

  doc.setFont("Roboto", "normal");
  doc.setFontSize(8.5);
  setText(PAL.text);
  let sy = yParties + 17;
  supplierDetailLines.forEach((line) => {
    doc.text(line, margin + pad, sy);
    sy += 4;
  });
  let cy = yParties + 17;
  clientPartyLines.forEach((line) => {
    doc.text(line, clientX + pad, cy);
    cy += 4;
  });

  yPos = yParties + cardH + 10;

  // ---- Line items table (Stripe-like) ----
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

  if (invoice.items && invoice.items.length > 0) {
    invoice.items.forEach((item: any, index: number) => {
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
      doc.text(Number(item.unitPrice || item.price || 0).toFixed(2), xPrice + cPrice - 1, rowY, {
        align: "right",
      });
      doc.text(`${Number(item.taxRate || 0).toFixed(0)}%`, xVat + 1, rowY);

      const itemQuantity = Number(item.quantity || 0);
      const itemUnitPrice = Number(item.unitPrice || item.price || 0);
      const itemTaxRate = Number(item.taxRate || 0);
      const itemSubtotal = itemQuantity * itemUnitPrice;
      const itemTax = itemSubtotal * (itemTaxRate / 100);
      const itemTotal = itemSubtotal + itemTax;

      doc.setFont("Roboto", "bold");
      doc.text(itemTotal.toFixed(2), xTot + cTot - 1, rowY, { align: "right" });

      yPos += descH;
    });
  }

  setDraw(PAL.border, 0.15);
  doc.line(x0, yPos, x0 + contentWidth, yPos);
  yPos += 10;

  // ---- Totals (spacing, no heavy box) ----
  const totalsW = 78;
  const totalsX = rightEdge - totalsW;
  const totalsTop = yPos;

  doc.setFont("Roboto", "normal");
  doc.setFontSize(9);
  setText(PAL.muted);
  doc.text("Сума без ДДС", totalsX, totalsTop + 5);
  setText(PAL.text);
  doc.text(formatCurrency(Number(invoice.subtotal || 0), currency), rightEdge, totalsTop + 5, {
    align: "right",
  });

  doc.setFontSize(9);
  setText(PAL.muted);
  doc.text("ДДС", totalsX, totalsTop + 11);
  setText(PAL.text);
  doc.text(formatCurrency(Number(invoice.taxAmount || 0), currency), rightEdge, totalsTop + 11, {
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

  if (pdfPrefs.showAmountInWords) {
    const amountInWords = numberToWordsBG(displayTotal, invoice.currency || "EUR");
    const maxWordsW = totalsX - margin - 8;
    doc.setFont("Roboto", "normal");
    doc.setFontSize(8.5);
    setText(PAL.muted);
    doc.text("Словом", margin, totalsTop + 5);
    setText(PAL.text);
    const words = doc.splitTextToSize(amountInWords, maxWordsW);
    doc.text(words, margin, totalsTop + 10);
  }

  yPos += 10;
  doc.setFontSize(8.5);
  setText(PAL.muted);
  doc.text("Начин на плащане", margin, yPos);
  setText(PAL.text);
  const paymentMethodLabels: Record<string, string> = {
    BANK_TRANSFER: "Банков превод",
    CREDIT_CARD: "Кредитна/дебитна карта",
    CARD: "Карта",
    CASH: "В брой",
    OTHER: "Друго",
  };
  doc.text(
    paymentMethodLabels[invoice.paymentMethod] || invoice.paymentMethod || "Банков превод",
    margin + 38,
    yPos
  );

  // ---- Bank ----
  const companyBank = invoice.company?.bankAccount;
  const hasJoinedBank = companyBank && typeof companyBank === "object";
  const hasLegacyAccountNumber =
    typeof companyBank === "string" && companyBank.trim().length > 0;
  if (
    invoice.company?.bankIban ||
    invoice.company?.bankName ||
    invoice.company?.bankSwift ||
    hasJoinedBank ||
    hasLegacyAccountNumber
  ) {
    yPos += 12;
    const bankH = 22;
    setFill(PAL.surface);
    doc.roundedRect(margin, yPos, contentWidth, bankH, 2, 2, "F");
    setDraw(PAL.border, 0.1);
    doc.roundedRect(margin, yPos, contentWidth, bankH, 2, 2, "S");
    doc.setFont("Roboto", "bold");
    doc.setFontSize(7.5);
    setText(PAL.muted);
    doc.text("БАНКОВИ ДАННИ", margin + 4, yPos + 5);
    doc.setFont("Roboto", "normal");
    doc.setFontSize(8.5);
    setText(PAL.text);
    const bankAccount =
      invoice.company.bankAccount && typeof invoice.company.bankAccount === "object"
        ? invoice.company.bankAccount
        : null;
    let bankY = yPos + 11;
    if (bankAccount?.bankName || invoice.company.bankName) {
      doc.text(`Банка · ${bankAccount?.bankName || invoice.company.bankName}`, margin + 4, bankY);
    }
    if (bankAccount?.iban || invoice.company.bankIban) {
      doc.text(`IBAN · ${bankAccount?.iban || invoice.company.bankIban}`, margin + 4 + contentWidth / 3, bankY);
    } else if (typeof companyBank === "string" && companyBank.trim()) {
      doc.text(`Сметка · ${companyBank}`, margin + 4 + contentWidth / 3, bankY);
    }
    if (bankAccount?.swift || invoice.company.bankSwift) {
      doc.text(`SWIFT · ${bankAccount?.swift || invoice.company.bankSwift}`, margin + 4 + (contentWidth * 2) / 3, bankY);
    }
    yPos += bankH;
  }

  if (invoice.notes) {
    yPos += 8;
    doc.setFont("Roboto", "bold");
    doc.setFontSize(8);
    setText(PAL.muted);
    doc.text("Бележки", margin, yPos);
    doc.setFont("Roboto", "normal");
    setText(PAL.text);
    const noteLines = doc.splitTextToSize(invoice.notes, contentWidth);
    doc.text(noteLines, margin, yPos + 4);
    yPos += 4 + noteLines.length * 4;
  }

  // ---- Footer: legal + signatures (minimal) ----
  yPos = pageHeight - 42;
  doc.setFont("Roboto", "normal");
  doc.setFontSize(6.5);
  setText(PAL.faint);
  const legalText = [
    "Основание за издаване: чл. 113, ал. 1 от ЗДДС",
    "Съгласно чл. 6, ал. 1 от Закона за счетоводството и чл. 114 от ЗДДС",
    "Документът е валиден без подпис и печат съгласно чл. 7 от Закона за счетоводството",
  ];
  legalText.forEach((text, i) => doc.text(text, margin, yPos + i * 3.5));

  yPos = pageHeight - 22;
  setDraw(PAL.border, 0.12);
  doc.line(margin, yPos, margin + 55, yPos);
  doc.line(rightEdge - 55, yPos, rightEdge, yPos);
  doc.setFontSize(6.5);
  setText(PAL.muted);
  doc.text("Доставчик", margin + 27.5, yPos + 4, { align: "center" });
  doc.text("Получател", rightEdge - 27.5, yPos + 4, { align: "center" });

  doc.setFont("Roboto", "normal");
  doc.setFontSize(5.5);
  setText(PAL.faint);
  doc.text(`Генерирано с ${APP_NAME}`, pageWidth / 2, pageHeight - 4, { align: "center" });

  // Generate PDF buffer
  const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
  return pdfBuffer;
}

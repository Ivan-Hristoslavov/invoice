import { readFileSync } from 'fs';
import { join } from 'path';
import jsPDF from 'jspdf';

// Colors for professional design - green/emerald for debit notes
const COLORS = {
  primary: { r: 16, g: 185, b: 129 }, // Emerald-500 for debit notes
  primaryDark: { r: 5, g: 150, b: 105 }, // Emerald-600
  dark: { r: 15, g: 23, b: 42 }, // Slate-900
  text: { r: 30, g: 41, b: 59 }, // Slate-800
  muted: { r: 100, g: 116, b: 139 }, // Slate-500
  light: { r: 241, g: 245, b: 249 }, // Slate-100
  border: { r: 226, g: 232, b: 240 }, // Slate-200
  white: { r: 255, g: 255, b: 255 },
};

// Format currency
function formatCurrency(amount: number, currency: string): string {
  const formatted = amount.toFixed(2);
  const symbols: Record<string, string> = {
    'EUR': '€',
    'BGN': 'лв',
    'USD': '$',
  };
  return `${formatted} ${symbols[currency] || '€'}`;
}

// Server-side PDF generation function for Debit Notes
export async function generateDebitNotePdfServer(debitNote: any): Promise<Buffer> {
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
  const margin = 15;
  const contentWidth = pageWidth - (2 * margin);

  // ==================== HEADER SECTION ====================
  
  // Debit Note badge (Top Center)
  doc.setFont('Roboto', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(COLORS.primary.r, COLORS.primary.g, COLORS.primary.b);
  
  const badgeText = 'ДЕБИТНО ИЗВЕСТИЕ';
  const badgeTextWidth = doc.getTextWidth(badgeText);
  const badgeX = (pageWidth - badgeTextWidth) / 2;
  doc.text(badgeText, badgeX, 18);
  
  // Company logo area (left side)
  let yPos = 24;
  let logoHeight = 0;
  
  // Load and add company logo if available
  if (debitNote.company?.logo) {
    try {
      const logoResponse = await fetch(debitNote.company.logo);
      if (logoResponse.ok) {
        const logoArrayBuffer = await logoResponse.arrayBuffer();
        const logoBuffer = Buffer.from(logoArrayBuffer);
        const logoBase64 = logoBuffer.toString('base64');
        const contentType = logoResponse.headers.get('content-type') || 'image/png';
        const imageFormat = contentType.split('/')[1]?.split(';')[0] || 'png';
        
        const maxLogoWidth = 30;
        const maxLogoHeight = 20;
        
        doc.addImage(logoBase64, imageFormat, margin, yPos, maxLogoWidth, maxLogoHeight);
        logoHeight = maxLogoHeight;
      }
    } catch (error) {
      console.warn('Could not load company logo:', error);
    }
  }
  
  // Debit Note title section (right side)
  doc.setFont('Roboto', 'bold');
  doc.setFontSize(24);
  doc.setTextColor(COLORS.primary.r, COLORS.primary.g, COLORS.primary.b);
  doc.text('ДЕБИТНО', pageWidth - margin, yPos, { align: 'right' });
  
  yPos += 8;
  doc.text('ИЗВЕСТИЕ', pageWidth - margin, yPos, { align: 'right' });
  
  // Debit note number
  yPos += 10;
  doc.setFontSize(12);
  doc.setTextColor(COLORS.dark.r, COLORS.dark.g, COLORS.dark.b);
  doc.text(`№ ${debitNote.debitNoteNumber || '---'}`, pageWidth - margin, yPos, { align: 'right' });
  
  // Company info (left side, below logo if present)
  yPos = 24 + logoHeight + (logoHeight > 0 ? 5 : 0);
  if (debitNote.company) {
    doc.setFont('Roboto', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(COLORS.dark.r, COLORS.dark.g, COLORS.dark.b);
    doc.text(debitNote.company.name || '', margin, yPos);
    
    doc.setFont('Roboto', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(COLORS.muted.r, COLORS.muted.g, COLORS.muted.b);
    
    if (debitNote.company.address) {
      yPos += 6;
      doc.text(debitNote.company.address, margin, yPos);
    }
    if (debitNote.company.city) {
      yPos += 5;
      doc.text(debitNote.company.city, margin, yPos);
    }
  }
  
  // ==================== REFERENCE INFO ====================
  
  yPos = 55;
  // Reference box
  doc.setDrawColor(COLORS.primary.r, COLORS.primary.g, COLORS.primary.b);
  doc.setLineWidth(0.5);
  doc.roundedRect(margin, yPos, contentWidth, 18, 3, 3, 'S');
  
  doc.setFont('Roboto', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(COLORS.muted.r, COLORS.muted.g, COLORS.muted.b);
  
  const issueDate = debitNote.issueDate ? new Date(debitNote.issueDate).toLocaleDateString('bg-BG') : new Date().toLocaleDateString('bg-BG');
  const invoiceRef = debitNote.invoice?.invoiceNumber || 'N/A';
  const invoiceDate = debitNote.invoice?.issueDate ? new Date(debitNote.invoice.issueDate).toLocaleDateString('bg-BG') : '';
  
  // Date columns
  const colWidth = contentWidth / 3;
  
  doc.text('Дата на издаване:', margin + 5, yPos + 7);
  doc.setTextColor(COLORS.dark.r, COLORS.dark.g, COLORS.dark.b);
  doc.setFont('Roboto', 'bold');
  doc.text(issueDate, margin + 5, yPos + 13);
  
  doc.setFont('Roboto', 'normal');
  doc.setTextColor(COLORS.muted.r, COLORS.muted.g, COLORS.muted.b);
  doc.text('Към фактура №:', margin + colWidth + 5, yPos + 7);
  doc.setTextColor(COLORS.dark.r, COLORS.dark.g, COLORS.dark.b);
  doc.setFont('Roboto', 'bold');
  doc.text(invoiceRef, margin + colWidth + 5, yPos + 13);
  
  doc.setFont('Roboto', 'normal');
  doc.setTextColor(COLORS.muted.r, COLORS.muted.g, COLORS.muted.b);
  doc.text('Дата на фактурата:', margin + colWidth * 2 + 5, yPos + 7);
  doc.setTextColor(COLORS.dark.r, COLORS.dark.g, COLORS.dark.b);
  doc.setFont('Roboto', 'bold');
  doc.text(invoiceDate, margin + colWidth * 2 + 5, yPos + 13);
  
  // ==================== PARTIES SECTION ====================
  
  yPos = 80;
  const boxWidth = (contentWidth - 10) / 2;
  const boxHeight = 45;
  
  // Supplier box
  doc.setDrawColor(COLORS.border.r, COLORS.border.g, COLORS.border.b);
  doc.setLineWidth(0.5);
  doc.roundedRect(margin, yPos, boxWidth, boxHeight, 3, 3, 'S');
  
  // Supplier header
  doc.setDrawColor(COLORS.dark.r, COLORS.dark.g, COLORS.dark.b);
  doc.setLineWidth(0.5);
  doc.roundedRect(margin, yPos, boxWidth, 8, 3, 3, 'S');
  
  doc.setFont('Roboto', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(COLORS.dark.r, COLORS.dark.g, COLORS.dark.b);
  doc.text('ИЗДАТЕЛ', margin + 5, yPos + 6);
  
  // Supplier content
  let supplierY = yPos + 14;
  doc.setTextColor(COLORS.dark.r, COLORS.dark.g, COLORS.dark.b);
  doc.setFontSize(10);
  
  if (debitNote.company) {
    doc.setFont('Roboto', 'bold');
    doc.text(debitNote.company.name || '', margin + 5, supplierY);
    supplierY += 5;
    
    doc.setFont('Roboto', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(COLORS.muted.r, COLORS.muted.g, COLORS.muted.b);
    
    if (debitNote.company.bulstatNumber) {
      doc.text(`ЕИК: ${debitNote.company.bulstatNumber}`, margin + 5, supplierY);
      supplierY += 4;
    }
    if (debitNote.company.vatRegistrationNumber) {
      doc.text(`ДДС №: ${debitNote.company.vatRegistrationNumber}`, margin + 5, supplierY);
      supplierY += 4;
    }
    if (debitNote.company.mol) {
      doc.text(`МОЛ: ${debitNote.company.mol}`, margin + 5, supplierY);
      supplierY += 4;
    }
    if (debitNote.company.address) {
      doc.text(debitNote.company.address, margin + 5, supplierY);
      supplierY += 4;
    }
    if (debitNote.company.city) {
      doc.text(debitNote.company.city, margin + 5, supplierY);
      supplierY += 4;
    }
    if (debitNote.company.phone) {
      doc.text(`Тел.: ${debitNote.company.phone}`, margin + 5, supplierY);
      supplierY += 4;
    }
  }
  
  // Client box
  const clientBoxX = margin + boxWidth + 10;
  doc.setDrawColor(COLORS.border.r, COLORS.border.g, COLORS.border.b);
  doc.setLineWidth(0.5);
  doc.roundedRect(clientBoxX, yPos, boxWidth, boxHeight, 3, 3, 'S');
  
  // Client header
  doc.setDrawColor(COLORS.dark.r, COLORS.dark.g, COLORS.dark.b);
  doc.setLineWidth(0.5);
  doc.roundedRect(clientBoxX, yPos, boxWidth, 8, 3, 3, 'S');
  
  doc.setFont('Roboto', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(COLORS.dark.r, COLORS.dark.g, COLORS.dark.b);
  doc.text('ПОЛУЧАТЕЛ', clientBoxX + 5, yPos + 6);
  
  // Client content
  let clientY = yPos + 14;
  
  if (debitNote.client) {
    doc.setFont('Roboto', 'bold');
    doc.text(debitNote.client.name || '', clientBoxX + 5, clientY);
    clientY += 5;
    
    doc.setFont('Roboto', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(COLORS.muted.r, COLORS.muted.g, COLORS.muted.b);
    
    if (debitNote.client.bulstatNumber) {
      doc.text(`ЕИК: ${debitNote.client.bulstatNumber}`, clientBoxX + 5, clientY);
      clientY += 4;
    }
    if (debitNote.client.vatRegistrationNumber || debitNote.client.vatNumber) {
      doc.text(`ДДС №: ${debitNote.client.vatRegistrationNumber || debitNote.client.vatNumber}`, clientBoxX + 5, clientY);
      clientY += 4;
    }
    if (debitNote.client.mol) {
      doc.text(`МОЛ: ${debitNote.client.mol}`, clientBoxX + 5, clientY);
      clientY += 4;
    }
    if (debitNote.client.address) {
      doc.text(debitNote.client.address, clientBoxX + 5, clientY);
      clientY += 4;
    }
    if (debitNote.client.city) {
      doc.text(debitNote.client.city, clientBoxX + 5, clientY);
      clientY += 4;
    }
    if (debitNote.client.phone) {
      doc.text(`Тел.: ${debitNote.client.phone}`, clientBoxX + 5, clientY);
      clientY += 4;
    }
  }
  
  // ==================== REASON SECTION ====================
  
  if (debitNote.reason) {
    yPos = 130;
    doc.setDrawColor(COLORS.primary.r, COLORS.primary.g, COLORS.primary.b);
    doc.setLineWidth(0.3);
    doc.roundedRect(margin, yPos, contentWidth, 15, 2, 2, 'S');
    
    doc.setFont('Roboto', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(COLORS.primary.r, COLORS.primary.g, COLORS.primary.b);
    doc.text('Основание за издаване:', margin + 5, yPos + 6);
    
    doc.setFont('Roboto', 'normal');
    doc.setTextColor(COLORS.dark.r, COLORS.dark.g, COLORS.dark.b);
    doc.text(debitNote.reason, margin + 5, yPos + 11);
    
    yPos = 150;
  } else {
    yPos = 130;
  }
  
  // ==================== ITEMS TABLE ====================
  
  const tableY = yPos;
  const colWidths = [85, 20, 25, 20, 30]; // description, qty, price, tax, total
  
  // Table header
  doc.setFillColor(COLORS.light.r, COLORS.light.g, COLORS.light.b);
  doc.setDrawColor(COLORS.border.r, COLORS.border.g, COLORS.border.b);
  doc.roundedRect(margin, tableY, contentWidth, 10, 2, 2, 'FD');
  
  doc.setFont('Roboto', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(COLORS.dark.r, COLORS.dark.g, COLORS.dark.b);
  
  let xPos = margin + 3;
  doc.text('Описание', xPos, tableY + 7);
  xPos += colWidths[0];
  doc.text('К-во', xPos, tableY + 7, { align: 'right' });
  xPos += colWidths[1];
  doc.text('Ед. цена', xPos, tableY + 7, { align: 'right' });
  xPos += colWidths[2];
  doc.text('ДДС %', xPos, tableY + 7, { align: 'right' });
  xPos += colWidths[3];
  doc.text('Сума', xPos, tableY + 7, { align: 'right' });
  
  // Table rows
  let itemY = tableY + 10;
  const items = debitNote.items || [];
  const currency = debitNote.currency || 'EUR';
  
  doc.setFont('Roboto', 'normal');
  doc.setFontSize(9);
  
  for (const item of items) {
    const rowHeight = 8;
    
    // Draw row background (alternating)
    if (items.indexOf(item) % 2 === 1) {
      doc.setFillColor(COLORS.light.r, COLORS.light.g, COLORS.light.b);
      doc.rect(margin, itemY, contentWidth, rowHeight, 'F');
    }
    
    doc.setTextColor(COLORS.dark.r, COLORS.dark.g, COLORS.dark.b);
    
    xPos = margin + 3;
    // Truncate description if too long
    let desc = item.description || '';
    if (desc.length > 50) {
      desc = desc.substring(0, 47) + '...';
    }
    doc.text(desc, xPos, itemY + 5);
    
    xPos += colWidths[0];
    doc.text(Number(item.quantity).toString(), xPos, itemY + 5, { align: 'right' });
    
    xPos += colWidths[1];
    doc.text(formatCurrency(Number(item.unitPrice), currency), xPos, itemY + 5, { align: 'right' });
    
    xPos += colWidths[2];
    doc.text(`${Number(item.taxRate)}%`, xPos, itemY + 5, { align: 'right' });
    
    xPos += colWidths[3];
    doc.setFont('Roboto', 'bold');
    doc.text(formatCurrency(Number(item.total), currency), xPos, itemY + 5, { align: 'right' });
    doc.setFont('Roboto', 'normal');
    
    itemY += rowHeight;
  }
  
  // Draw table border
  doc.setDrawColor(COLORS.border.r, COLORS.border.g, COLORS.border.b);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, tableY, contentWidth, itemY - tableY, 2, 2, 'S');
  
  // ==================== TOTALS SECTION ====================
  
  const totalsY = itemY + 10;
  const totalsWidth = 80;
  const totalsX = pageWidth - margin - totalsWidth;
  
  // Totals box with green border for debit notes
  doc.setDrawColor(COLORS.primary.r, COLORS.primary.g, COLORS.primary.b);
  doc.setLineWidth(0.5);
  doc.roundedRect(totalsX, totalsY, totalsWidth, 35, 3, 3, 'S');
  
  doc.setFont('Roboto', 'normal');
  doc.setFontSize(9);
  
  // Subtotal
  doc.setTextColor(COLORS.muted.r, COLORS.muted.g, COLORS.muted.b);
  doc.text('Сума без ДДС:', totalsX + 5, totalsY + 8);
  doc.setTextColor(COLORS.dark.r, COLORS.dark.g, COLORS.dark.b);
  doc.text(formatCurrency(Number(debitNote.subtotal), currency), totalsX + totalsWidth - 5, totalsY + 8, { align: 'right' });
  
  // Tax
  doc.setTextColor(COLORS.muted.r, COLORS.muted.g, COLORS.muted.b);
  doc.text('ДДС:', totalsX + 5, totalsY + 16);
  doc.setTextColor(COLORS.dark.r, COLORS.dark.g, COLORS.dark.b);
  doc.text(formatCurrency(Number(debitNote.taxAmount), currency), totalsX + totalsWidth - 5, totalsY + 16, { align: 'right' });
  
  // Total line
  doc.setDrawColor(COLORS.primary.r, COLORS.primary.g, COLORS.primary.b);
  doc.setLineWidth(0.3);
  doc.line(totalsX + 5, totalsY + 22, totalsX + totalsWidth - 5, totalsY + 22);
  
  // Total
  doc.setFont('Roboto', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(COLORS.primary.r, COLORS.primary.g, COLORS.primary.b);
  doc.text('ОБЩО:', totalsX + 5, totalsY + 30);
  doc.text(`+${formatCurrency(Number(debitNote.total), currency)}`, totalsX + totalsWidth - 5, totalsY + 30, { align: 'right' });
  
  // ==================== FOOTER ====================
  
  const footerY = pageHeight - 20;
  
  doc.setDrawColor(COLORS.border.r, COLORS.border.g, COLORS.border.b);
  doc.setLineWidth(0.3);
  doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);
  
  doc.setFont('Roboto', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(COLORS.muted.r, COLORS.muted.g, COLORS.muted.b);
  const invoiceRefText = debitNote.invoice 
    ? `Дебитно известие ${debitNote.debitNoteNumber} към фактура ${debitNote.invoice.invoiceNumber}`
    : `Дебитно известие ${debitNote.debitNoteNumber}`;
  doc.text(invoiceRefText, margin, footerY);
  doc.text(`Страница 1 от 1`, pageWidth - margin, footerY, { align: 'right' });
  
  // Generate PDF buffer
  const pdfOutput = doc.output('arraybuffer');
  return Buffer.from(pdfOutput);
}

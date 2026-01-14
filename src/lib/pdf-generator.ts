import { readFileSync } from 'fs';
import { join } from 'path';
import jsPDF from 'jspdf';

// Helper function to convert number to words in Bulgarian
function numberToWords(num: number): string {
  const units = ['', 'един', 'два', 'три', 'четири', 'пет', 'шест', 'седем', 'осем', 'девет'];
  const teens = ['десет', 'единадесет', 'дванадесет', 'тринадесет', 'четиринадесет', 'петнадесет', 'шестнадесет', 'седемнадесет', 'осемнадесет', 'деветнадесет'];
  const tens = ['', '', 'двадесет', 'тридесет', 'четиридесет', 'петдесет', 'шестдесет', 'седемдесет', 'осемдесет', 'деветдесет'];

  if (num === 0) return 'нула';

  const numStr = Math.floor(num).toString();
  const decimal = Math.round((num - Math.floor(num)) * 100);
  
  let result = '';
  
  if (Math.floor(num) > 0) {
    const num = parseInt(numStr);
    if (num < 10) {
      result = units[num];
    } else if (num < 20) {
      result = teens[num - 10];
    } else if (num < 100) {
      const unit = num % 10;
      const ten = Math.floor(num / 10);
      result = tens[ten] + (unit > 0 ? ' и ' + units[unit] : '');
    } else if (num < 1000) {
      const hundred = Math.floor(num / 100);
      const remainder = num % 100;
      result = (hundred === 1 ? 'сто' : units[hundred] + 'стотин') + 
               (remainder > 0 ? ' ' + numberToWords(remainder) : '');
    } else {
      // Simplified for larger numbers
      result = num.toString();
    }
  }
  
  if (decimal > 0) {
    result += ` и ${decimal} стотинки`;
  }
  
  return result || num.toString();
}

// Server-side PDF generation function
export async function generateInvoicePdfServer(invoice: any): Promise<Buffer> {
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
  const margin = 20;
  const contentWidth = pageWidth - (2 * margin);

  // Header section
  doc.setFillColor(240, 240, 240);
  doc.rect(margin, margin, contentWidth, 15, 'F');
  doc.setFont('Roboto', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text('ФАКТУРА', pageWidth / 2, margin + 10, { align: 'center' });
  doc.setFontSize(12);
  doc.text(`№ ${invoice.invoiceNumber}`, margin + 2, margin + 10);
  
  // "ОРИГИНАЛ" text in header (smaller, not watermark)
  doc.setTextColor(0, 100, 200);
  doc.setFontSize(10);
  doc.text('ОРИГИНАЛ', pageWidth - margin - 20, margin + 8);
  doc.setTextColor(0, 0, 0);

  let yPos = margin + 25;
  doc.setFontSize(10);
  doc.setFont('Roboto', 'normal');
  
  const issueDate = invoice.issueDate ? new Date(invoice.issueDate).toLocaleDateString('bg-BG') : new Date().toLocaleDateString('bg-BG');
  doc.text(`Дата на издаване: ${issueDate}`, margin, yPos);
  doc.text(`Място на издаване: ${invoice.placeOfIssue || 'София'}`, pageWidth - margin - 60, yPos);
  yPos += 7;
  const supplyDate = invoice.supplyDate || invoice.issueDate || new Date();
  doc.text(`Дата на дан. събитие: ${new Date(supplyDate).toLocaleDateString('bg-BG')}`, margin, yPos);

  // Company information (Left side)
  yPos += 15;
  doc.setDrawColor(200, 200, 200);
  doc.rect(margin, yPos, contentWidth / 2 - 5, 50);
  doc.setFont('Roboto', 'bold');
  doc.setFontSize(11);
  doc.text('ДОСТАВЧИК:', margin + 2, yPos + 6);
  doc.setFont('Roboto', 'normal');
  doc.setFontSize(10);
  yPos += 6;
  if (invoice.company) {
    const company = invoice.company;
    yPos += 7;
    doc.text(company.name || '', margin + 2, yPos);
    yPos += 7;
    if (company.address) doc.text(company.address, margin + 2, yPos);
    yPos += 7;
    if (company.bulstatNumber) doc.text(`ЕИК: ${company.bulstatNumber}`, margin + 2, yPos);
    yPos += 7;
    if (company.vatRegistered && company.vatRegistrationNumber) {
      doc.text(`ДДС №: ${company.vatRegistrationNumber}`, margin + 2, yPos);
    }
    yPos += 7;
    if (company.mol) doc.text(`МОЛ: ${company.mol}`, margin + 2, yPos);
  }

  // Client information (Right side)
  const clientStartY = yPos - 41;
  doc.rect(pageWidth / 2 + 5, clientStartY, contentWidth / 2 - 5, 50);
  let clientY = clientStartY;
  doc.setFont('Roboto', 'bold');
  doc.setFontSize(11);
  doc.text('ПОЛУЧАТЕЛ:', pageWidth / 2 + 7, clientY + 6);
  doc.setFont('Roboto', 'normal');
  doc.setFontSize(10);
  if (invoice.client) {
    const client = invoice.client;
    clientY += 13;
    doc.text(client.name || '', pageWidth / 2 + 7, clientY);
    clientY += 7;
    if (client.address) doc.text(client.address, pageWidth / 2 + 7, clientY);
    clientY += 7;
    if (client.bulstatNumber) doc.text(`ЕИК: ${client.bulstatNumber}`, pageWidth / 2 + 7, clientY);
    clientY += 7;
    if (client.vatNumber) doc.text(`ДДС №: ${client.vatNumber}`, pageWidth / 2 + 7, clientY);
    clientY += 7;
    if (client.mol) doc.text(`МОЛ: ${client.mol}`, pageWidth / 2 + 7, clientY);
  }

  // Items table
  yPos += 20;
  doc.setFillColor(240, 240, 240);
  doc.rect(margin, yPos, contentWidth, 10, 'F');
  doc.setFont('Roboto', 'bold');
  doc.setFontSize(9);
  const col1Width = contentWidth * 0.35;
  const col2Width = contentWidth * 0.08;
  const col3Width = contentWidth * 0.08;
  const col4Width = contentWidth * 0.12;
  const col5Width = contentWidth * 0.08;
  const col6Width = contentWidth * 0.12;
  const col7Width = contentWidth * 0.17;
  doc.text('Описание на стоката/услугата', margin + 2, yPos + 7);
  doc.text('Мярка', margin + col1Width + 2, yPos + 7);
  doc.text('Кол.', margin + col1Width + col2Width + 2, yPos + 7);
  doc.text('Ед. цена', margin + col1Width + col2Width + col3Width + 2, yPos + 7);
  doc.text('ДДС %', margin + col1Width + col2Width + col3Width + col4Width + 2, yPos + 7);
  doc.text('ДДС', margin + col1Width + col2Width + col3Width + col4Width + col5Width + 2, yPos + 7);
  doc.text('Сума', margin + col1Width + col2Width + col3Width + col4Width + col5Width + col6Width + 2, yPos + 7);
  doc.rect(margin, yPos, contentWidth, 10);
  doc.setFont('Roboto', 'normal');
  
  if (invoice.items && invoice.items.length > 0) {
    yPos += 10;
    invoice.items.forEach((item: any) => {
      const rowHeight = 8;
      doc.rect(margin, yPos, contentWidth, rowHeight);
      doc.line(margin + col1Width, yPos, margin + col1Width, yPos + rowHeight);
      doc.line(margin + col1Width + col2Width, yPos, margin + col1Width + col2Width, yPos + rowHeight);
      doc.line(margin + col1Width + col2Width + col3Width, yPos, margin + col1Width + col2Width + col3Width, yPos + rowHeight);
      doc.line(margin + col1Width + col2Width + col3Width + col4Width, yPos, margin + col1Width + col2Width + col3Width + col4Width, yPos + rowHeight);
      doc.line(margin + col1Width + col2Width + col3Width + col4Width + col5Width, yPos, margin + col1Width + col2Width + col3Width + col4Width + col5Width, yPos + rowHeight);
      doc.line(margin + col1Width + col2Width + col3Width + col4Width + col5Width + col6Width, yPos, margin + col1Width + col2Width + col3Width + col4Width + col5Width + col6Width, yPos + rowHeight);
      
      const description = item.description || '';
      doc.text(description.substring(0, 35), margin + 2, yPos + 5);
      doc.text(item.unit || 'бр.', margin + col1Width + 2, yPos + 5);
      doc.text(Number(item.quantity || 0).toString(), margin + col1Width + col2Width + 2, yPos + 5);
      doc.text(Number(item.price || item.unitPrice || 0).toFixed(2), margin + col1Width + col2Width + col3Width + 2, yPos + 5);
      doc.text(Number(item.taxRate || 0).toString() + '%', margin + col1Width + col2Width + col3Width + col4Width + 2, yPos + 5);
      doc.text(Number(item.taxAmount || 0).toFixed(2), margin + col1Width + col2Width + col3Width + col4Width + col5Width + 2, yPos + 5);
      doc.text(Number(item.total || 0).toFixed(2), margin + col1Width + col2Width + col3Width + col4Width + col5Width + col6Width + 2, yPos + 5);
      yPos += rowHeight;
    });
  }

  // Summary section
  yPos += 10;
  const summaryStartX = pageWidth - margin - 80;
  doc.setFont('Roboto', 'normal');
  const currency = invoice.currency || 'EUR';
  const currencySymbol = currency === 'EUR' ? '€' : currency === 'BGN' ? 'лв.' : currency === 'USD' ? '$' : currency === 'GBP' ? '£' : currency;
  
  doc.text('Сума без ДДС:', summaryStartX, yPos);
  doc.text(`${Number(invoice.subtotal || 0).toFixed(2)} ${currencySymbol}`, pageWidth - margin - 15, yPos, { align: 'right' });
  yPos += 7;
  doc.text('ДДС:', summaryStartX, yPos);
  doc.text(`${Number(invoice.taxAmount || 0).toFixed(2)} ${currencySymbol}`, pageWidth - margin - 15, yPos, { align: 'right' });
  yPos += 7;
  doc.setFont('Roboto', 'bold');
  doc.text('Обща сума:', summaryStartX, yPos);
  doc.text(`${Number(invoice.total || 0).toFixed(2)} ${currencySymbol}`, pageWidth - margin - 15, yPos, { align: 'right' });
  yPos += 15;
  doc.setFont('Roboto', 'normal');
  doc.setFontSize(9);
  const currencyWord = currency === 'EUR' ? 'евро' : currency === 'BGN' ? 'лева' : currency;
  doc.text('Словом: ' + numberToWords(Number(invoice.total || 0)) + ' ' + currencyWord, margin, yPos);
  yPos += 10;
  doc.text(`Начин на плащане: ${invoice.paymentMethod || 'Банков превод'}`, margin, yPos);

  // Footer section
  yPos = pageHeight - margin - 45;
  doc.setFontSize(8);
  doc.text('Основание за издаване: чл. 113, ал. 1 от ЗДДС', margin, yPos);
  yPos += 5;
  doc.text('Основание за неначисляване на ДДС: чл. 113, ал. 9 от ЗДДС', margin, yPos);
  yPos += 5;
  doc.text('Съгласно чл. 6, ал. 1 от Закона за счетоводството и чл. 114 от ЗДДС', margin, yPos);
  yPos += 5;
  doc.text('Документът е валиден без подпис и печат съгласно чл. 7 от Закона за счетоводството', margin, yPos);
  yPos = pageHeight - margin - 30;
  doc.setFontSize(9);
  doc.text('Доставчик: .............................', margin, yPos);
  doc.setFontSize(8);
  doc.text('(подпис и печат)', margin + 5, yPos + 5);
  doc.setFontSize(9);
  doc.text('Получател: .............................', pageWidth - margin - 70, yPos);
  doc.setFontSize(8);
  doc.text('(подпис)', pageWidth - margin - 50, yPos + 5);

  // Add watermark "ОРИГИНАЛ" - rotated, semi-transparent, centered
  // Add it now so it appears on top of all content
  const centerX = pageWidth / 2;
  const centerY = pageHeight / 2;
  const angle = 45; // degrees
  const fontSize = 80;
  const watermarkText = 'ОРИГИНАЛ';
  
  // Use lighter color to simulate transparency
  doc.setTextColor(220, 200, 200); // Light red
  
  // Use internal PDF commands for rotation
  const internal = doc.internal;
  const angleRad = angle * Math.PI / 180;
  const cos = Math.cos(angleRad);
  const sin = Math.sin(angleRad);
  
  // Save graphics state
  internal.write('q\n');
  
  // Apply transformation: translate to center, rotate, then draw text
  internal.write(`${cos.toFixed(6)} ${sin.toFixed(6)} ${(-sin).toFixed(6)} ${cos.toFixed(6)} ${centerX} ${centerY} cm\n`);
  
  // Draw rotated watermark text
  doc.setFont('Roboto', 'bold');
  doc.setFontSize(fontSize);
  const textWidth = doc.getTextWidth(watermarkText);
  doc.text(watermarkText, -textWidth / 2, 0);
  
  // Restore graphics state
  internal.write('Q\n');
  
  // Reset text color
  doc.setTextColor(0, 0, 0);

  // Generate PDF buffer
  const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
  return pdfBuffer;
}

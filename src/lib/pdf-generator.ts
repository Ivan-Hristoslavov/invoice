import { readFileSync } from 'fs';
import { join } from 'path';
import jsPDF from 'jspdf';

// Colors for professional design
const COLORS = {
  primary: { r: 16, g: 185, b: 129 }, // Emerald-500
  primaryDark: { r: 5, g: 150, b: 105 }, // Emerald-600
  secondary: { r: 59, g: 130, b: 246 }, // Blue-500
  dark: { r: 15, g: 23, b: 42 }, // Slate-900
  text: { r: 30, g: 41, b: 59 }, // Slate-800
  muted: { r: 100, g: 116, b: 139 }, // Slate-500
  light: { r: 241, g: 245, b: 249 }, // Slate-100
  border: { r: 226, g: 232, b: 240 }, // Slate-200
  white: { r: 255, g: 255, b: 255 },
  success: { r: 34, g: 197, b: 94 }, // Green-500
  warning: { r: 245, g: 158, b: 11 }, // Amber-500
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

  // ==================== ORIGINAL/COPY BADGE ====================
  const isOriginal = invoice.isOriginal !== false; // Default to true
  const badgeText = isOriginal ? 'ОРИГИНАЛ' : 'КОПИЕ';
  const badgeColor = isOriginal 
    ? { r: 16, g: 185, b: 129 } // Emerald for original
    : { r: 100, g: 116, b: 139 }; // Gray for copy

  // ==================== HEADER SECTION ====================
  
  // Top accent bar - REMOVED for black & white printing
  
  // ==================== ORIGINAL/COPY BADGE (Top Center) ====================
  doc.setFont('Roboto', 'bold');
  doc.setFontSize(14);
  // Black text only, no border for printing
  doc.setTextColor(COLORS.dark.r, COLORS.dark.g, COLORS.dark.b);
  
  // Draw text centered exactly
  const badgeTextWidth = doc.getTextWidth(badgeText);
  const badgeX = (pageWidth - badgeTextWidth) / 2;
  doc.text(badgeText, badgeX, 18);
  
  // Company logo area (left side)
  let yPos = 24;
  let logoHeight = 0;
  
  // Load and add company logo if available
  if (invoice.company?.logo) {
    try {
      // Fetch logo image using Node.js built-in fetch (Node 18+)
      const logoResponse = await fetch(invoice.company.logo);
      if (logoResponse.ok) {
        const logoArrayBuffer = await logoResponse.arrayBuffer();
        const logoBuffer = Buffer.from(logoArrayBuffer);
        const logoBase64 = logoBuffer.toString('base64');
        const contentType = logoResponse.headers.get('content-type') || 'image/png';
        const imageFormat = contentType.split('/')[1]?.split(';')[0] || 'png';
        
        // Calculate logo dimensions (max 30mm width, maintain aspect ratio)
        const maxLogoWidth = 30;
        const maxLogoHeight = 20;
        
        // Add logo to PDF (positioned at top left)
        doc.addImage(logoBase64, imageFormat, margin, yPos, maxLogoWidth, maxLogoHeight);
        
        logoHeight = maxLogoHeight;
      }
    } catch (error) {
      console.warn('Could not load company logo:', error);
      // Continue without logo if loading fails
    }
  }
  
  // Invoice title section (right side)
  doc.setFont('Roboto', 'bold');
  doc.setFontSize(28);
  doc.setTextColor(COLORS.dark.r, COLORS.dark.g, COLORS.dark.b);
  doc.text('ФАКТУРА', pageWidth - margin, yPos, { align: 'right' });
  
  // Invoice number
  yPos += 10;
  doc.setFontSize(14);
  doc.setTextColor(COLORS.dark.r, COLORS.dark.g, COLORS.dark.b);
  doc.text(`№ ${invoice.invoiceNumber || '---'}`, pageWidth - margin, yPos, { align: 'right' });
  
  // Status badge - text only, no background for black & white printing
  yPos += 8;
  const status = invoice.status || 'DRAFT';
  const statusText =
    status === 'DRAFT'
      ? 'ЧЕРНОВА'
      : status === 'ISSUED'
        ? 'ИЗДАДЕНА'
        : status === 'VOIDED'
          ? 'АНУЛИРАНА'
          : status === 'CANCELLED'
            ? 'СТОРНИРАНА'
            : status === 'PAID'
              ? 'ИЗДАДЕНА'
              : status;
  
  doc.setFontSize(9);
  doc.setTextColor(COLORS.dark.r, COLORS.dark.g, COLORS.dark.b);
  doc.text(`Статус: ${statusText}`, pageWidth - margin, yPos, { align: 'right' });
  
  // Company info (left side, below logo if present)
  yPos = 24 + logoHeight + (logoHeight > 0 ? 5 : 0);
  if (invoice.company) {
    doc.setFont('Roboto', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(COLORS.dark.r, COLORS.dark.g, COLORS.dark.b);
    doc.text(invoice.company.name || '', margin, yPos);
    
    doc.setFont('Roboto', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(COLORS.muted.r, COLORS.muted.g, COLORS.muted.b);
    
    if (invoice.company.address) {
      yPos += 6;
      doc.text(invoice.company.address, margin, yPos);
    }
    if (invoice.company.city) {
      yPos += 5;
      doc.text(invoice.company.city, margin, yPos);
    }
    if (invoice.company.phone) {
      yPos += 5;
      doc.text(`Тел.: ${invoice.company.phone}`, margin, yPos);
    }
  }
  
  // ==================== DATE INFO ====================
  
  yPos = 50;
  // Date info box - black border only for printing
  doc.setDrawColor(COLORS.dark.r, COLORS.dark.g, COLORS.dark.b);
  doc.setLineWidth(0.5);
  doc.roundedRect(margin, yPos, contentWidth, 18, 3, 3, 'S');
  
  doc.setFont('Roboto', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(COLORS.muted.r, COLORS.muted.g, COLORS.muted.b);
  
  const issueDate = invoice.issueDate ? new Date(invoice.issueDate).toLocaleDateString('bg-BG') : new Date().toLocaleDateString('bg-BG');
  const supplyDate = invoice.supplyDate ? new Date(invoice.supplyDate).toLocaleDateString('bg-BG') : issueDate;
  const dueDate = invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('bg-BG') : '';
  
  // Date columns
  const colWidth = contentWidth / 4;
  
  doc.text('Дата на издаване:', margin + 5, yPos + 7);
  doc.setTextColor(COLORS.dark.r, COLORS.dark.g, COLORS.dark.b);
  doc.setFont('Roboto', 'bold');
  doc.text(issueDate, margin + 5, yPos + 13);
  
  doc.setFont('Roboto', 'normal');
  doc.setTextColor(COLORS.muted.r, COLORS.muted.g, COLORS.muted.b);
  doc.text('Дата на дан. събитие:', margin + colWidth + 5, yPos + 7);
  doc.setTextColor(COLORS.dark.r, COLORS.dark.g, COLORS.dark.b);
  doc.setFont('Roboto', 'bold');
  doc.text(supplyDate, margin + colWidth + 5, yPos + 13);
  
  doc.setFont('Roboto', 'normal');
  doc.setTextColor(COLORS.muted.r, COLORS.muted.g, COLORS.muted.b);
  doc.text('Място на издаване:', margin + colWidth * 2 + 5, yPos + 7);
  doc.setTextColor(COLORS.dark.r, COLORS.dark.g, COLORS.dark.b);
  doc.setFont('Roboto', 'bold');
  doc.text(invoice.placeOfIssue || 'София', margin + colWidth * 2 + 5, yPos + 13);
  
  if (dueDate) {
    doc.setFont('Roboto', 'normal');
    doc.setTextColor(COLORS.muted.r, COLORS.muted.g, COLORS.muted.b);
    doc.text('Падеж:', margin + colWidth * 3 + 5, yPos + 7);
    doc.setTextColor(COLORS.dark.r, COLORS.dark.g, COLORS.dark.b);
    doc.setFont('Roboto', 'bold');
    doc.text(dueDate, margin + colWidth * 3 + 5, yPos + 13);
  }
  
  // ==================== PARTIES SECTION ====================
  
  yPos = 75;
  const boxWidth = (contentWidth - 10) / 2;
  const boxHeight = 50;
  
  // Supplier box
  doc.setDrawColor(COLORS.border.r, COLORS.border.g, COLORS.border.b);
  doc.setLineWidth(0.5);
  doc.roundedRect(margin, yPos, boxWidth, boxHeight, 3, 3, 'S');
  
  // Supplier header - black border only for printing
  doc.setDrawColor(COLORS.dark.r, COLORS.dark.g, COLORS.dark.b);
  doc.setLineWidth(0.5);
  doc.roundedRect(margin, yPos, boxWidth, 8, 3, 3, 'S');
  
  doc.setFont('Roboto', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(COLORS.dark.r, COLORS.dark.g, COLORS.dark.b);
  doc.text('ДОСТАВЧИК', margin + 5, yPos + 6);
  
  // Supplier content
  let supplierY = yPos + 14;
  doc.setTextColor(COLORS.dark.r, COLORS.dark.g, COLORS.dark.b);
  doc.setFontSize(10);
  
  if (invoice.company) {
    doc.text(invoice.company.name || '', margin + 5, supplierY);
    supplierY += 6;
    
    doc.setFont('Roboto', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(COLORS.text.r, COLORS.text.g, COLORS.text.b);
    
    if (invoice.company.address) {
      doc.text(invoice.company.address, margin + 5, supplierY);
      supplierY += 5;
    }
    
    if (invoice.company.city) {
      doc.text(invoice.company.city, margin + 5, supplierY);
      supplierY += 5;
    }
    
    if (invoice.company.phone) {
      doc.text(`Тел.: ${invoice.company.phone}`, margin + 5, supplierY);
      supplierY += 5;
    }
    
    if (invoice.company.bulstatNumber) {
      doc.text(`ЕИК: ${invoice.company.bulstatNumber}`, margin + 5, supplierY);
      supplierY += 5;
    }
    
    if (invoice.company.vatRegistered && invoice.company.vatRegistrationNumber) {
      doc.text(`ДДС №: ${invoice.company.vatRegistrationNumber}`, margin + 5, supplierY);
      supplierY += 5;
    }
    
    if (invoice.company.mol) {
      doc.text(`МОЛ: ${invoice.company.mol}`, margin + 5, supplierY);
      supplierY += 5;
    }
  }
  
  // Client box
  const clientBoxX = margin + boxWidth + 10;
  doc.setDrawColor(COLORS.border.r, COLORS.border.g, COLORS.border.b);
  doc.roundedRect(clientBoxX, yPos, boxWidth, boxHeight, 3, 3, 'S');
  
  // Client header - black border only for printing
  doc.setDrawColor(COLORS.dark.r, COLORS.dark.g, COLORS.dark.b);
  doc.setLineWidth(0.5);
  doc.roundedRect(clientBoxX, yPos, boxWidth, 8, 3, 3, 'S');
  
  doc.setFont('Roboto', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(COLORS.dark.r, COLORS.dark.g, COLORS.dark.b);
  doc.text('ПОЛУЧАТЕЛ', clientBoxX + 5, yPos + 6);
  
  // Client content
  let clientY = yPos + 14;
  doc.setTextColor(COLORS.dark.r, COLORS.dark.g, COLORS.dark.b);
  doc.setFontSize(10);
  
  if (invoice.client) {
    doc.text(invoice.client.name || '', clientBoxX + 5, clientY);
    clientY += 6;
    
    doc.setFont('Roboto', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(COLORS.text.r, COLORS.text.g, COLORS.text.b);
    
    if (invoice.client.address) {
      doc.text(invoice.client.address, clientBoxX + 5, clientY);
      clientY += 5;
    }
    
    if (invoice.client.city) {
      doc.text(invoice.client.city, clientBoxX + 5, clientY);
      clientY += 5;
    }
    
    if (invoice.client.phone) {
      doc.text(`Тел.: ${invoice.client.phone}`, clientBoxX + 5, clientY);
      clientY += 5;
    }
    
    if (invoice.client.bulstatNumber) {
      doc.text(`ЕИК: ${invoice.client.bulstatNumber}`, clientBoxX + 5, clientY);
      clientY += 5;
    }
    
    if (invoice.client.vatNumber) {
      doc.text(`ДДС №: ${invoice.client.vatNumber}`, clientBoxX + 5, clientY);
      clientY += 5;
    }
    
    if (invoice.client.mol) {
      doc.text(`МОЛ: ${invoice.client.mol}`, clientBoxX + 5, clientY);
      clientY += 5;
    }
  }
  
  // ==================== ITEMS TABLE ====================
  
  yPos += boxHeight + 10;
  
  // Table header - no border, just text for printing
  const tableHeaderHeight = 10;
  
  // Column definitions
  const cols = {
    no: { x: margin, w: 10, label: '№' },
    desc: { x: margin + 10, w: contentWidth * 0.35, label: 'Описание' },
    unit: { x: margin + 10 + contentWidth * 0.35, w: 15, label: 'Мярка' },
    qty: { x: margin + 25 + contentWidth * 0.35, w: 15, label: 'Кол.' },
    price: { x: margin + 40 + contentWidth * 0.35, w: contentWidth * 0.15, label: 'Ед. цена' },
    vat: { x: margin + 40 + contentWidth * 0.50, w: contentWidth * 0.10, label: 'ДДС' },
    total: { x: margin + 40 + contentWidth * 0.60, w: contentWidth * 0.20, label: 'Сума' },
  };
  
  doc.setFont('Roboto', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(COLORS.dark.r, COLORS.dark.g, COLORS.dark.b);
  
  doc.text(cols.no.label, cols.no.x + 2, yPos + 7);
  doc.text(cols.desc.label, cols.desc.x + 2, yPos + 7);
  doc.text(cols.unit.label, cols.unit.x + 2, yPos + 7);
  doc.text(cols.qty.label, cols.qty.x + 2, yPos + 7);
  doc.text(cols.price.label, cols.price.x + 2, yPos + 7);
  doc.text(cols.vat.label, cols.vat.x + 2, yPos + 7);
  doc.text(cols.total.label, cols.total.x + cols.total.w - 2, yPos + 7, { align: 'right' });
  
  yPos += tableHeaderHeight;
  
  // Table rows
  doc.setFont('Roboto', 'normal');
  doc.setFontSize(9);
  const rowHeight = 9;
  
  if (invoice.items && invoice.items.length > 0) {
    invoice.items.forEach((item: any, index: number) => {
      // Alternating row colors - REMOVED for black & white printing
      // Just draw border for each row
      doc.setDrawColor(COLORS.border.r, COLORS.border.g, COLORS.border.b);
      doc.setLineWidth(0.2);
      doc.line(margin, yPos, margin + contentWidth, yPos);
      
      doc.setTextColor(COLORS.text.r, COLORS.text.g, COLORS.text.b);
      
      // Row data
      doc.text((index + 1).toString(), cols.no.x + 4, yPos + 6);
      
      const description = item.description || '';
      const maxDescWidth = cols.desc.w - 4;
      const truncatedDesc = description.length > 40 ? description.substring(0, 40) + '...' : description;
      doc.text(truncatedDesc, cols.desc.x + 2, yPos + 6);
      
      doc.text(item.unit || 'бр.', cols.unit.x + 2, yPos + 6);
      doc.text(Number(item.quantity || 0).toString(), cols.qty.x + 2, yPos + 6);
      doc.text(Number(item.unitPrice || item.price || 0).toFixed(2), cols.price.x + 2, yPos + 6);
      doc.text(`${Number(item.taxRate || 0).toFixed(0)}%`, cols.vat.x + 2, yPos + 6);
      
      // Calculate item total correctly: quantity * unitPrice * (1 + taxRate/100)
      const itemQuantity = Number(item.quantity || 0);
      const itemUnitPrice = Number(item.unitPrice || item.price || 0);
      const itemTaxRate = Number(item.taxRate || 0);
      const itemSubtotal = itemQuantity * itemUnitPrice;
      const itemTax = itemSubtotal * (itemTaxRate / 100);
      const itemTotal = itemSubtotal + itemTax;
      
      doc.setFont('Roboto', 'bold');
      doc.text(itemTotal.toFixed(2), cols.total.x + cols.total.w - 2, yPos + 6, { align: 'right' });
      doc.setFont('Roboto', 'normal');
      
      yPos += rowHeight;
    });
  }
  
  // Table bottom border
  doc.setDrawColor(COLORS.border.r, COLORS.border.g, COLORS.border.b);
  doc.line(margin, yPos, margin + contentWidth, yPos);
  
  // ==================== TOTALS SECTION ====================
  
  yPos += 10;
  const totalsX = pageWidth - margin - 80;
  const totalsWidth = 80;
  const currency = invoice.currency || 'EUR';
  
  // Totals box - black border only for printing
  doc.setDrawColor(COLORS.dark.r, COLORS.dark.g, COLORS.dark.b);
  doc.setLineWidth(0.5);
  doc.roundedRect(totalsX, yPos, totalsWidth, 35, 3, 3, 'S');
  
  doc.setFont('Roboto', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(COLORS.text.r, COLORS.text.g, COLORS.text.b);
  
  doc.text('Сума без ДДС:', totalsX + 5, yPos + 8);
  doc.text(formatCurrency(Number(invoice.subtotal || 0), currency), totalsX + totalsWidth - 5, yPos + 8, { align: 'right' });
  
  doc.text('ДДС:', totalsX + 5, yPos + 16);
  doc.text(formatCurrency(Number(invoice.taxAmount || 0), currency), totalsX + totalsWidth - 5, yPos + 16, { align: 'right' });
  
  // Total line - black for printing
  doc.setDrawColor(COLORS.dark.r, COLORS.dark.g, COLORS.dark.b);
  doc.setLineWidth(0.5);
  doc.line(totalsX + 5, yPos + 21, totalsX + totalsWidth - 5, yPos + 21);
  
  doc.setFont('Roboto', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(COLORS.dark.r, COLORS.dark.g, COLORS.dark.b);
  doc.text('ОБЩО:', totalsX + 5, yPos + 30);
  
  // Calculate total to ensure it's correct (subtotal + taxAmount)
  const calculatedTotal = Number(invoice.subtotal || 0) + Number(invoice.taxAmount || 0);
  const displayTotal = Number(invoice.total || 0) > 0 ? Number(invoice.total || 0) : calculatedTotal;
  doc.text(formatCurrency(displayTotal, currency), totalsX + totalsWidth - 5, yPos + 30, { align: 'right' });
  
  // Amount in words (left side)
  doc.setFont('Roboto', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(COLORS.muted.r, COLORS.muted.g, COLORS.muted.b);
  doc.text('Словом:', margin, yPos + 10);
  doc.setTextColor(COLORS.text.r, COLORS.text.g, COLORS.text.b);
  
  // Use calculated total for words
  const totalForWords = displayTotal;
  const amountInWords = numberToWordsBG(totalForWords, invoice.currency || 'EUR');
  const maxWordsWidth = totalsX - margin - 10;
  const words = doc.splitTextToSize(amountInWords, maxWordsWidth);
  doc.text(words, margin, yPos + 17);
  
  // Payment method
  yPos += 25;
  doc.setTextColor(COLORS.muted.r, COLORS.muted.g, COLORS.muted.b);
  doc.text('Начин на плащане:', margin, yPos);
  doc.setTextColor(COLORS.text.r, COLORS.text.g, COLORS.text.b);
  const paymentMethodLabels: Record<string, string> = {
    'BANK_TRANSFER': 'Банков превод',
    'CREDIT_CARD': 'Кредитна/дебитна карта',
    'CARD': 'Карта',
    'CASH': 'В брой',
    'OTHER': 'Друго',
  };
  doc.text(paymentMethodLabels[invoice.paymentMethod] || invoice.paymentMethod || 'Банков превод', margin + 40, yPos);
  
  // ==================== BANK DETAILS ====================
  
  if (invoice.company?.bankAccount || invoice.company?.bankIban) {
    yPos += 15;
    
    // Bank details - black border only for printing
    doc.setDrawColor(COLORS.dark.r, COLORS.dark.g, COLORS.dark.b);
    doc.setLineWidth(0.5);
    doc.roundedRect(margin, yPos, contentWidth, 25, 3, 3, 'S');
    
    doc.setFont('Roboto', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(COLORS.dark.r, COLORS.dark.g, COLORS.dark.b);
    doc.text('БАНКОВИ ДАННИ', margin + 5, yPos + 6);
    
    doc.setFont('Roboto', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(COLORS.text.r, COLORS.text.g, COLORS.text.b);
    
    const bankAccount = invoice.company.bankAccount;
    let bankY = yPos + 13;
    
    if (bankAccount?.bankName || invoice.company.bankName) {
      doc.text(`Банка: ${bankAccount?.bankName || invoice.company.bankName}`, margin + 5, bankY);
    }
    
    if (bankAccount?.iban || invoice.company.bankIban) {
      doc.text(`IBAN: ${bankAccount?.iban || invoice.company.bankIban}`, margin + 5 + contentWidth / 3, bankY);
    }
    
    if (bankAccount?.swift || invoice.company.bankSwift) {
      doc.text(`SWIFT: ${bankAccount?.swift || invoice.company.bankSwift}`, margin + 5 + contentWidth * 2 / 3, bankY);
    }
    
    yPos += 25;
  }
  
  // ==================== NOTES ====================
  
  if (invoice.notes) {
    yPos += 10;
    
    doc.setFont('Roboto', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(COLORS.muted.r, COLORS.muted.g, COLORS.muted.b);
    doc.text('БЕЛЕЖКИ:', margin, yPos);
    
    doc.setFont('Roboto', 'normal');
    doc.setTextColor(COLORS.text.r, COLORS.text.g, COLORS.text.b);
    const noteLines = doc.splitTextToSize(invoice.notes, contentWidth);
    doc.text(noteLines, margin, yPos + 6);
  }
  
  // ==================== FOOTER ====================
  
  // Legal text
  yPos = pageHeight - 50;
  doc.setFont('Roboto', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(COLORS.muted.r, COLORS.muted.g, COLORS.muted.b);
  
  const legalText = [
    'Основание за издаване: чл. 113, ал. 1 от ЗДДС',
    'Съгласно чл. 6, ал. 1 от Закона за счетоводството и чл. 114 от ЗДДС',
    'Документът е валиден без подпис и печат съгласно чл. 7 от Закона за счетоводството',
  ];
  
  legalText.forEach((text, i) => {
    doc.text(text, margin, yPos + (i * 4));
  });
  
  // Signature areas
  yPos = pageHeight - 30;
  doc.setDrawColor(COLORS.border.r, COLORS.border.g, COLORS.border.b);
  doc.setLineWidth(0.3);
  
  // Supplier signature
  doc.line(margin, yPos, margin + 60, yPos);
  doc.setFontSize(8);
  doc.setTextColor(COLORS.muted.r, COLORS.muted.g, COLORS.muted.b);
  doc.text('Доставчик', margin + 30, yPos + 5, { align: 'center' });
  doc.setFontSize(7);
  doc.text('(подпис и печат)', margin + 30, yPos + 9, { align: 'center' });
  
  // Client signature
  doc.line(pageWidth - margin - 60, yPos, pageWidth - margin, yPos);
  doc.setFontSize(8);
  doc.text('Получател', pageWidth - margin - 30, yPos + 5, { align: 'center' });
  doc.setFontSize(7);
  doc.text('(подпис)', pageWidth - margin - 30, yPos + 9, { align: 'center' });
  
  // Bottom accent bar - REMOVED for black & white printing
  
  // Generated by - text only, no background for printing
  doc.setFontSize(6);
  doc.setTextColor(COLORS.muted.r, COLORS.muted.g, COLORS.muted.b);
  doc.text('Генерирано с Invoicy', pageWidth / 2, pageHeight - 3, { align: 'center' });

  // Generate PDF buffer
  const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
  return pdfBuffer;
}

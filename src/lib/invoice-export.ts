// Експорт на фактури като CSV
export async function exportInvoicesToCsv(filters?: {
  companyId?: string;
  clientId?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}): Promise<void> {
  // Изграждане на параметрите за заявката
  const params = new URLSearchParams({
    format: 'csv',
  });

  if (filters) {
    if (filters.companyId) params.append('companyId', filters.companyId);
    if (filters.clientId) params.append('clientId', filters.clientId);
    if (filters.status) params.append('status', filters.status);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
  }

  // Извикване на API endpoint за експорт
  const response = await fetch(`/api/invoices/export?${params.toString()}`);
  
  if (!response.ok) {
    throw new Error('Грешка при експортирането на фактурите');
  }

  // Получаване на CSV данните
  const csvData = await response.text();
  
  // Създаване на blob от CSV данните
  const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
  
  // Създаване на линк и стартиране на свалянето
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  
  link.setAttribute('href', url);
  link.setAttribute('download', `fakturi-export-${new Date().toISOString().slice(0, 10)}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Експорт на фактури като JSON
export async function exportInvoicesToJson(filters?: {
  companyId?: string;
  clientId?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}): Promise<any> {
  // Изграждане на параметрите за заявката
  const params = new URLSearchParams({
    format: 'json',
  });

  if (filters) {
    if (filters.companyId) params.append('companyId', filters.companyId);
    if (filters.clientId) params.append('clientId', filters.clientId);
    if (filters.status) params.append('status', filters.status);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
  }

  // Извикване на API endpoint за експорт
  const response = await fetch(`/api/invoices/export?${params.toString()}`);
  
  if (!response.ok) {
    throw new Error('Грешка при експортирането на фактурите');
  }

  // Връщане на JSON данните
  return response.json();
}

// Експорт на единична фактура като PDF
export async function exportInvoiceAsPdf(invoiceId: string): Promise<void> {
  // Първо извикваме API за получаване на данните за фактурата
  const response = await fetch(`/api/invoices/export-pdf?invoiceId=${invoiceId}`);
  
  if (!response.ok) {
    throw new Error('Грешка при експортирането на фактурата като PDF');
  }
  
  const result = await response.json();

  // Динамично импортиране за избягване на SSR проблеми
  const { default: jsPDF } = await import('jspdf');
  
  // Зареждане на шрифтовете
  const regularFontResponse = await fetch('/fonts/Roboto-Regular.ttf');
  const regularFontData = await regularFontResponse.arrayBuffer();
  
  const boldFontResponse = await fetch('/fonts/Roboto-Bold.ttf');
  const boldFontData = await boldFontResponse.arrayBuffer();
  
  // Създаване на нов PDF документ с поддръжка на кирилица
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    putOnlyUsedFonts: true,
    floatPrecision: 16
  });

  // Добавяне на шрифтовете към документа
  doc.addFileToVFS('Roboto-Regular.ttf', Buffer.from(regularFontData).toString('base64'));
  doc.addFileToVFS('Roboto-Bold.ttf', Buffer.from(boldFontData).toString('base64'));
  doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
  doc.addFont('Roboto-Bold.ttf', 'Roboto', 'bold');
  
  // Задаване на свойства
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - (2 * margin);

  // Функция за рисуване на рамка
  function drawBox(x: number, y: number, width: number, height: number) {
    doc.setDrawColor(200, 200, 200);
    doc.rect(x, y, width, height);
  }

  // Горна част на фактурата
  doc.setFillColor(240, 240, 240);
  doc.rect(margin, margin, contentWidth, 15, 'F');
  
  doc.setFont('Roboto', 'bold');
  doc.setFontSize(16);
  doc.text('ФАКТУРА', pageWidth / 2, margin + 10, { align: 'center' });
  
  // Номер и ОРИГИНАЛ
  doc.setFontSize(12);
  doc.text(`№ ${result.invoiceNumber}`, margin + 2, margin + 10);
  doc.setTextColor(0, 0, 150);
  doc.text('ОРИГИНАЛ', pageWidth - margin - 20, margin + 10);
  doc.setTextColor(0, 0, 0);

  // Основна информация
  let yPos = margin + 25;
  doc.setFontSize(10);
  doc.setFont('Roboto', 'normal');
  
  doc.text(`Дата на издаване: ${new Date(result.invoice?.issueDate || new Date()).toLocaleDateString('bg-BG')}`, margin, yPos);
  doc.text(`Място на издаване: ${result.invoice.placeOfIssue || 'София'}`, pageWidth - margin - 60, yPos);
  
  yPos += 7;
  doc.text(`Дата на дан. събитие: ${new Date(result.invoice?.supplyDate || result.invoice?.issueDate || new Date()).toLocaleDateString('bg-BG')}`, margin, yPos);
  
  // Информация за Доставчик
  yPos += 15;
  drawBox(margin, yPos, contentWidth / 2 - 5, 50);
  
  doc.setFont('Roboto', 'bold');
  doc.setFontSize(11);
  doc.text('ДОСТАВЧИК:', margin + 2, yPos + 6);
  
  doc.setFont('Roboto', 'normal');
  doc.setFontSize(10);
  yPos += 6;
  
  if (result.invoice.company) {
    const company = result.invoice.company;
    yPos += 7;
    doc.text(company.name, margin + 2, yPos);
    yPos += 7;
    if (company.address) doc.text(company.address, margin + 2, yPos);
    yPos += 7;
    if (company.bulstatNumber) doc.text(`ЕИК: ${company.bulstatNumber}`, margin + 2, yPos);
    yPos += 7;
    if (company.vatRegistered && company.vatRegistrationNumber) {
      doc.text(`ДДС №: ${company.vatRegistrationNumber}`, margin + 2, yPos);
    }
    yPos += 7;
    if (company.mол) doc.text(`МОЛ: ${company.mол}`, margin + 2, yPos);
  }

  // Информация за Получател
  const clientStartY = yPos - 41;
  drawBox(pageWidth / 2 + 5, clientStartY, contentWidth / 2 - 5, 50);
  
  let clientY = clientStartY;
  doc.setFont('Roboto', 'bold');
  doc.setFontSize(11);
  doc.text('ПОЛУЧАТЕЛ:', pageWidth / 2 + 7, clientY + 6);
  
  doc.setFont('Roboto', 'normal');
  doc.setFontSize(10);
  
  if (result.invoice.client) {
    const client = result.invoice.client;
    clientY += 13;
    doc.text(client.name, pageWidth / 2 + 7, clientY);
    clientY += 7;
    if (client.address) doc.text(client.address, pageWidth / 2 + 7, clientY);
    clientY += 7;
    if (client.bulstatNumber) doc.text(`ЕИК: ${client.bulstatNumber}`, pageWidth / 2 + 7, clientY);
    clientY += 7;
    if (client.vatNumber) doc.text(`ДДС №: ${client.vatNumber}`, pageWidth / 2 + 7, clientY);
    clientY += 7;
    if (client.mол) doc.text(`МОЛ: ${client.mол}`, pageWidth / 2 + 7, clientY);
  }

  // Таблица с артикулите
  yPos += 20;
  
  // Заглавие на таблицата
  doc.setFillColor(240, 240, 240);
  doc.rect(margin, yPos, contentWidth, 10, 'F');
  
  doc.setFont('Roboto', 'bold');
  doc.setFontSize(9);
  
  const col1Width = contentWidth * 0.35; // Описание
  const col2Width = contentWidth * 0.08; // Мярка
  const col3Width = contentWidth * 0.08; // Количество
  const col4Width = contentWidth * 0.12; // Ед. цена
  const col5Width = contentWidth * 0.08; // ДДС %
  const col6Width = contentWidth * 0.12; // ДДС сума
  const col7Width = contentWidth * 0.17; // Сума
  
  doc.text('Описание на стоката/услугата', margin + 2, yPos + 7);
  doc.text('Мярка', margin + col1Width + 2, yPos + 7);
  doc.text('Кол.', margin + col1Width + col2Width + 2, yPos + 7);
  doc.text('Ед. цена', margin + col1Width + col2Width + col3Width + 2, yPos + 7);
  doc.text('ДДС %', margin + col1Width + col2Width + col3Width + col4Width + 2, yPos + 7);
  doc.text('ДДС', margin + col1Width + col2Width + col3Width + col4Width + col5Width + 2, yPos + 7);
  doc.text('Сума', margin + col1Width + col2Width + col3Width + col4Width + col5Width + col6Width + 2, yPos + 7);
  
  // Рамка на таблицата
  drawBox(margin, yPos, contentWidth, 10);
  
  // Артикули
  doc.setFont('Roboto', 'normal');
  let totalHeight = 0;
  
  if (result.invoice.items && result.invoice.items.length > 0) {
    yPos += 10;
    result.invoice.items.forEach((item: any, index: number) => {
      const rowHeight = 8;
      drawBox(margin, yPos, contentWidth, rowHeight);
      
      // Вертикални линии с новите ширини
      doc.line(margin + col1Width, yPos, margin + col1Width, yPos + rowHeight);
      doc.line(margin + col1Width + col2Width, yPos, margin + col1Width + col2Width, yPos + rowHeight);
      doc.line(margin + col1Width + col2Width + col3Width, yPos, margin + col1Width + col2Width + col3Width, yPos + rowHeight);
      doc.line(margin + col1Width + col2Width + col3Width + col4Width, yPos, margin + col1Width + col2Width + col3Width + col4Width, yPos + rowHeight);
      doc.line(margin + col1Width + col2Width + col3Width + col4Width + col5Width, yPos, margin + col1Width + col2Width + col3Width + col4Width + col5Width, yPos + rowHeight);
      doc.line(margin + col1Width + col2Width + col3Width + col4Width + col5Width + col6Width, yPos, margin + col1Width + col2Width + col3Width + col4Width + col5Width + col6Width, yPos + rowHeight);
      
      doc.text(item.description.substring(0, 35), margin + 2, yPos + 5);
      doc.text(item.unit || 'бр.', margin + col1Width + 2, yPos + 5);
      doc.text(item.quantity.toString(), margin + col1Width + col2Width + 2, yPos + 5);
      doc.text(parseFloat(item.unitPrice).toFixed(2), margin + col1Width + col2Width + col3Width + 2, yPos + 5);
      doc.text(item.taxRate ? item.taxRate.toString() + '%' : '0%', margin + col1Width + col2Width + col3Width + col4Width + 2, yPos + 5);
      doc.text(parseFloat(item.taxAmount).toFixed(2), margin + col1Width + col2Width + col3Width + col4Width + col5Width + 2, yPos + 5);
      doc.text(parseFloat(item.total).toFixed(2), margin + col1Width + col2Width + col3Width + col4Width + col5Width + col6Width + 2, yPos + 5);
      
      yPos += rowHeight;
      totalHeight += rowHeight;
    });
  }

  // Обща сума и ДДС
  yPos += 10;
  const summaryStartX = pageWidth - margin - 80;
  
  doc.setFont('Roboto', 'normal');
  doc.text('Сума без ДДС:', summaryStartX, yPos);
  doc.text(`${parseFloat(result.invoice.subtotal).toFixed(2)} лв.`, pageWidth - margin - 15, yPos, { align: 'right' });
  
  yPos += 7;
  doc.text('ДДС:', summaryStartX, yPos);
  doc.text(`${parseFloat(result.invoice.taxAmount).toFixed(2)} лв.`, pageWidth - margin - 15, yPos, { align: 'right' });
  
  yPos += 7;
  doc.setFont('Roboto', 'bold');
  doc.text('Обща сума:', summaryStartX, yPos);
  doc.text(`${parseFloat(result.invoice.total).toFixed(2)} лв.`, pageWidth - margin - 15, yPos, { align: 'right' });

  // Словом
  yPos += 15;
  doc.setFont('Roboto', 'normal');
  doc.setFontSize(9);
  doc.text('Словом: ' + numberToWords(parseFloat(result.invoice.total)) + ' лева', margin, yPos);

  // Начин на плащане
  yPos += 10;
  doc.text(`Начин на плащане: ${result.invoice.paymentMethod || 'Банков превод'}`, margin, yPos);

  // Банкова информация (ако е наличнa)
  if (result.invoice.company?.bankAccount) {
    yPos += 7;
    doc.text(`Банка: ${result.invoice.company.bankAccount.bankName || ''}`, margin, yPos);
    yPos += 7;
    doc.text(`IBAN: ${result.invoice.company.bankAccount.iban || ''}`, margin, yPos);
    doc.text(`BIC: ${result.invoice.company.bankAccount.bic || ''}`, margin, yPos);
  }

  // Добавяме информация за основанието и условията
  yPos += 15;
  doc.setFontSize(9);
  doc.setFont('Roboto', 'bold');
  doc.text('Основание за издаване:', margin, yPos);
  doc.setFont('Roboto', 'normal');
  doc.text(result.invoice.basis || 'Договор за доставка на стоки/услуги', margin + 45, yPos);

  yPos += 7;
  doc.setFont('Roboto', 'bold');
  doc.text('Начин на плащане:', margin, yPos);
  doc.setFont('Roboto', 'normal');
  doc.text(result.invoice.paymentMethod || 'Банков превод', margin + 45, yPos);

  yPos += 7;
  doc.setFont('Roboto', 'bold');
  doc.text('Срок на плащане:', margin, yPos);
  doc.setFont('Roboto', 'normal');
  const dueDate = result.invoice.dueDate ? new Date(result.invoice.dueDate).toLocaleDateString('bg-BG') : 'При получаване';
  doc.text(dueDate, margin + 45, yPos);

  // Добавяме информация за доставката
  if (result.invoice.deliveryTerms) {
    yPos += 7;
    doc.setFont('Roboto', 'bold');
    doc.text('Условия на доставка:', margin, yPos);
    doc.setFont('Roboto', 'normal');
    doc.text(result.invoice.deliveryTerms, margin + 45, yPos);
  }

  // Ако има отстъпка, добавяме информация за нея
  if (result.invoice.discount > 0) {
    yPos += 7;
    doc.setFont('Roboto', 'bold');
    doc.text('Основание за отстъпка:', margin, yPos);
    doc.setFont('Roboto', 'normal');
    doc.text(result.invoice.discountReason || 'Търговска отстъпка', margin + 45, yPos);
  }

  // Добавяме банкова информация в отделна секция
  if (result.invoice.company?.bankAccount) {
    yPos += 15;
    doc.setFillColor(240, 240, 240);
    doc.rect(margin, yPos, contentWidth, 25, 'F');
    
    doc.setFont('Roboto', 'bold');
    doc.text('Банкова информация:', margin + 2, yPos + 7);
    doc.setFont('Roboto', 'normal');
    
    const bank = result.invoice.company.bankAccount;
    doc.text(`Банка: ${bank.bankName || ''}`, margin + 2, yPos + 15);
    doc.text(`IBAN: ${bank.iban || ''}`, margin + contentWidth/2, yPos + 15);
    doc.text(`BIC: ${bank.bic || ''}`, margin + 2, yPos + 23);
  }

  // Добавяме валутен курс, ако е приложимо
  if (result.invoice.currency && result.invoice.currency !== 'BGN') {
    yPos += 7;
    doc.text(`Валутен курс: 1 ${result.invoice.currency} = ${result.invoice.exchangeRate || '1.95583'} BGN`, margin, yPos);
  }

  // Актуализираме правното основание
  yPos = pageHeight - margin - 45;
  doc.setFontSize(8);
  doc.text('Основание за издаване: чл. 113, ал. 1 от ЗДДС', margin, yPos);
  yPos += 5;
  doc.text('Основание за неначисляване на ДДС: чл. 113, ал. 9 от ЗДДС', margin, yPos);
  yPos += 5;
  doc.text('Съгласно чл. 6, ал. 1 от Закона за счетоводството и чл. 114 от ЗДДС', margin, yPos);
  yPos += 5;
  doc.text('Документът е валиден без подпис и печат съгласно чл. 7 от Закона за счетоводството', margin, yPos);

  // Подписи
  yPos = pageHeight - margin - 30;
  
  // Подпис на доставчик
  doc.setFontSize(9);
  doc.text('Доставчик: .............................', margin, yPos);
  doc.setFontSize(8);
  doc.text('(подпис и печат)', margin + 5, yPos + 5);
  
  // Подпис на получател
  doc.setFontSize(9);
  doc.text('Получател: .............................', pageWidth - margin - 70, yPos);
  doc.setFontSize(8);
  doc.text('(подпис)', pageWidth - margin - 50, yPos + 5);

  // Запазване на PDF файла
  doc.save(`Фактура-${result.invoiceNumber}.pdf`);
}

// Помощна функция за конвертиране на число в думи на български
function numberToWords(num: number): string {
  const units = ['', 'един', 'два', 'три', 'четири', 'пет', 'шест', 'седем', 'осем', 'девет'];
  const teens = ['десет', 'единадесет', 'дванадесет', 'тринадесет', 'четиринадесет', 'петнадесет', 'шестнадесет', 'седемнадесет', 'осемнадесет', 'деветнадесет'];
  const tens = ['', '', 'двадесет', 'тридесет', 'четиридесет', 'петдесет', 'шестдесет', 'седемдесет', 'осемдесет', 'деветдесет'];
  const scales = ['', 'хиляда', 'милион', 'милиард'];

  if (num === 0) return 'нула';

  const numStr = Math.floor(num).toString();
  const decimal = Math.round((num - Math.floor(num)) * 100);
  
  let result = '';
  
  // Цяла част
  if (Math.floor(num) > 0) {
    result += convertGroup(numStr);
  }
  
  // Десетични
  if (decimal > 0) {
    result += ` и ${decimal} стотинки`;
  }
  
  return result;

  function convertGroup(n: string): string {
    if (n === '0') return '';
    
    const num = parseInt(n);
    if (num < 10) return units[num];
    if (num < 20) return teens[num - 10];
    if (num < 100) {
      const unit = num % 10;
      const ten = Math.floor(num / 10);
      return tens[ten] + (unit > 0 ? ' и ' + units[unit] : '');
    }
    
    return '';
  }
} 
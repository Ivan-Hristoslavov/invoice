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

// Експорт на единична фактура като PDF (server-generated)
// isCopy = false -> ОРИГИНАЛ watermark (default)
// isCopy = true -> КОПИЕ watermark
export async function exportInvoiceAsPdf(invoiceId: string, isCopy: boolean = false): Promise<void> {
  try {
    // Извикване на API за получаване на PDF
    const copyParam = isCopy ? '&copy=true' : '';
  const response = await fetch(`/api/invoices/export-pdf?invoiceId=${invoiceId}${copyParam}`);
  
  if (!response.ok) {
      const errorText = await response.text();
      console.error('PDF export error:', errorText);
    throw new Error('Грешка при експортирането на фактурата като PDF');
  }
  
    // Получаване на PDF като blob
    const blob = await response.blob();
    
    // Извличане на filename от Content-Disposition header или използване на default
    const contentDisposition = response.headers.get('Content-Disposition');
    let filename = `Faktura-${invoiceId}.pdf`;
    
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
      if (filenameMatch && filenameMatch[1]) {
        filename = filenameMatch[1].replace(/['"]/g, '');
      }
    }
    
    // Създаване на линк и стартиране на свалянето
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Освобождаване на URL обекта
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error in exportInvoiceAsPdf:', error);
    throw error;
  }
}

// Експорт на единично кредитно известие като PDF
export async function exportCreditNoteAsPdf(creditNoteId: string): Promise<void> {
  try {
    const response = await fetch(`/api/credit-notes/${creditNoteId}/export-pdf`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Credit Note PDF export error:', errorText);
      throw new Error('Грешка при експортирането на кредитното известие като PDF');
    }
    
    const blob = await response.blob();
    
    const contentDisposition = response.headers.get('Content-Disposition');
    let filename = `Kreditno-Izvestie-${creditNoteId}.pdf`;
    
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
      if (filenameMatch && filenameMatch[1]) {
        filename = filenameMatch[1].replace(/['"]/g, '');
      }
    }
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error in exportCreditNoteAsPdf:', error);
    throw error;
  }
}

// Генерира PDF за фактура и връща Buffer (за server-side usage)
// This function now accepts invoice data directly to avoid HTTP requests from server-side
export async function exportInvoicePdfBuffer(
  invoiceId: string, 
  invoiceData?: any
): Promise<{ buffer: Buffer, filename: string }> {
  // If invoice data is provided, use it directly (server-side)
  if (invoiceData) {
    // Only import pdf-generator on server-side (it uses Node.js 'fs' module)
    // This function should only be called from server-side code (API routes, server actions)
    if (typeof window !== 'undefined') {
      throw new Error('exportInvoicePdfBuffer with invoiceData can only be called server-side');
    }
    
    // Dynamic import - Next.js should handle this correctly for server-side code
    // The import is conditional and only happens server-side
    const pdfGeneratorModule = await import('./pdf-generator');
    const buffer = await pdfGeneratorModule.generateInvoicePdfServer(invoiceData);
    const invoiceNumber = (invoiceData.invoiceNumber || invoiceId || 'invoice').replace(/[^a-zA-Z0-9-_]/g, '_');
    const filename = `Invoice-${invoiceNumber}.pdf`;
    return { buffer, filename };
  }
  
  // Fallback: try HTTP request (for client-side usage, though this function is mainly server-side)
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/invoices/export-pdf?invoiceId=${invoiceId}`);
    
    if (!response.ok) {
      throw new Error('Грешка при експортирането на фактурата като PDF');
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Извличане на filename от Content-Disposition header
    const contentDisposition = response.headers.get('Content-Disposition');
    let filename = `Faktura-${invoiceId}.pdf`;
    
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
      if (filenameMatch && filenameMatch[1]) {
        filename = filenameMatch[1].replace(/['"]/g, '');
      }
    }
    
    return { buffer, filename };
  } catch (error) {
    throw new Error('Грешка при експортирането на фактурата като PDF');
  }
}

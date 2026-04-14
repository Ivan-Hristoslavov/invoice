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
function getInvoicePdfUrl(invoiceId: string, options?: { isCopy?: boolean; disposition?: "attachment" | "inline" }) {
  const params = new URLSearchParams({ invoiceId });
  if (options?.isCopy) params.set("copy", "true");
  if (options?.disposition === "inline") params.set("disposition", "inline");
  return `/api/invoices/export-pdf?${params.toString()}`;
}

async function getInvoicePdfResponse(invoiceId: string, options?: { isCopy?: boolean; disposition?: "attachment" | "inline" }) {
  const response = await fetch(getInvoicePdfUrl(invoiceId, options));

  if (!response.ok) {
    const errorText = await response.text();
    console.error("PDF export error:", errorText);
    throw new Error("Грешка при експортирането на фактурата като PDF");
  }

  return response;
}

export async function exportInvoiceAsPdf(invoiceId: string, isCopy: boolean = false): Promise<void> {
  try {
    const response = await getInvoicePdfResponse(invoiceId, { isCopy, disposition: "attachment" });
  
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

export function openInvoicePdf(invoiceId: string, isCopy: boolean = false): void {
  const url = getInvoicePdfUrl(invoiceId, { isCopy, disposition: "inline" });
  // Do not pass `noopener` in the window features string — in Chromium/Safari/Firefox
  // `window.open(..., "noopener")` often returns `null` (no WindowProxy). Use two-arg
  // open, then clear `opener` for the same security property.
  const openedWindow = window.open(url, "_blank");
  if (openedWindow) {
    openedWindow.opener = null;
    return;
  }

  const link = document.createElement("a");
  link.href = url;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  link.remove();
}

export function printInvoicePdf(invoiceId: string, isCopy: boolean = false): void {
  openInvoicePdf(invoiceId, isCopy);
}

function getMicroinvestExportUrl(invoiceId: string, kind: "xml" | "txt") {
  const path =
    kind === "xml"
      ? "/api/invoices/export-microinvest-xml"
      : "/api/invoices/export-microinvest-txt";
  return `${path}?invoiceId=${encodeURIComponent(invoiceId)}`;
}

async function downloadMicroinvestFile(
  invoiceId: string,
  kind: "xml" | "txt",
  defaultFilename: string
): Promise<void> {
  const response = await fetch(getMicroinvestExportUrl(invoiceId, kind));
  if (!response.ok) {
    const errorText = await response.text();
    console.error("Microinvest export error:", errorText);
    throw new Error(
      kind === "xml"
        ? "Грешка при експортиране на Microinvest XML"
        : "Грешка при експортиране на Microinvest TXT"
    );
  }
  const blob = await response.blob();
  const contentDisposition = response.headers.get("Content-Disposition");
  let filename = defaultFilename;
  if (contentDisposition) {
    const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
    if (filenameMatch?.[1]) filename = filenameMatch[1].replace(/['"]/g, "");
  }
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function exportInvoiceAsMicroinvestXml(invoiceId: string): Promise<void> {
  await downloadMicroinvestFile(invoiceId, "xml", `WarehouseProExport-${invoiceId}.xml`);
}

export async function exportInvoiceAsMicroinvestTxt(invoiceId: string): Promise<void> {
  await downloadMicroinvestFile(invoiceId, "txt", `WarehouseProExport-${invoiceId}.txt`);
}

export type MicroinvestXmlRangeFilters = {
  startDate: string;
  endDate: string;
  companyId?: string;
  clientId?: string;
  status?: string;
};

export async function exportInvoicesAsMicroinvestXmlRange(
  filters: MicroinvestXmlRangeFilters
): Promise<void> {
  const params = new URLSearchParams({
    startDate: filters.startDate,
    endDate: filters.endDate,
  });
  if (filters.companyId) params.set("companyId", filters.companyId);
  if (filters.clientId) params.set("clientId", filters.clientId);
  if (filters.status) params.set("status", filters.status);

  const response = await fetch(`/api/invoices/export-microinvest-xml-range?${params.toString()}`);
  if (!response.ok) {
    let message = "Грешка при експортиране на Microinvest XML за период";
    try {
      const data = (await response.json()) as { error?: string };
      if (typeof data.error === "string" && data.error) message = data.error;
    } catch {
      /* use default */
    }
    throw new Error(message);
  }

  const blob = await response.blob();
  const contentDisposition = response.headers.get("Content-Disposition");
  let filename = `WarehouseProExport-range-${filters.startDate}-${filters.endDate}.xml`;
  if (contentDisposition) {
    const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
    if (filenameMatch?.[1]) filename = filenameMatch[1].replace(/['"]/g, "");
  }
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
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


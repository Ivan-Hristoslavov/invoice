import Papa from 'papaparse';
import { z } from 'zod';

// Define structure for CSV data
interface CsvInvoiceItem {
  description: string;
  quantity: string;
  unitPrice: string;
  taxRate?: string;
  productId?: string;
}

interface CsvInvoice {
  invoiceNumber: string;
  clientId: string;
  companyId: string;
  issueDate: string;
  dueDate: string;
  status?: string;
  currency?: string;
  notes?: string;
  termsAndConditions?: string;
  items: CsvInvoiceItem[];
}

// CSV template structure for download
export const CSV_HEADERS = [
  'invoiceNumber',
  'clientId',
  'companyId',
  'issueDate', // YYYY-MM-DD
  'dueDate', // YYYY-MM-DD
  'status', // Optional: DRAFT, ISSUED, VOIDED, CANCELLED
  'currency', // Optional, defaults to USD
  'notes', // Optional
  'termsAndConditions', // Optional
  'item_1_description',
  'item_1_quantity',
  'item_1_unitPrice',
  'item_1_taxRate', // Optional, defaults to 0
  'item_1_productId' // Optional
];

export const SAMPLE_CSV_DATA = [
  'INV-IMPORT-001',
  'client_id_here',
  'company_id_here',
  '2024-05-20',
  '2024-06-19',
  'DRAFT',
  'USD',
  'Optional notes about this invoice',
  'Optional terms and conditions',
  'Web Development Services',
  '10',
  '120.00',
  '20',
  'product_id_here_optional'
];

// Parse a CSV file and return structured invoice data
export async function parseInvoiceCsv(file: File): Promise<CsvInvoice[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const { data, errors } = results;
          
          if (errors.length > 0) {
            reject(new Error(`CSV parsing error: ${errors[0].message}`));
            return;
          }
          
          if (!Array.isArray(data) || data.length === 0) {
            reject(new Error('No valid data found in CSV file'));
            return;
          }
          
          // Process the CSV data into invoice structures
          const invoices = processCsvRows(data);
          resolve(invoices);
        } catch (error) {
          reject(error);
        }
      },
      error: (error) => {
        reject(new Error(`CSV parsing error: ${error.message}`));
      }
    });
  });
}

// Process CSV rows into structured invoice data
function processCsvRows(rows: any[]): CsvInvoice[] {
  const invoices: CsvInvoice[] = [];
  
  for (const row of rows) {
    // Skip empty rows
    if (Object.values(row).every(value => !value)) continue;
    
    // Extract basic invoice fields
    const invoice: Partial<CsvInvoice> = {
      invoiceNumber: row.invoiceNumber,
      clientId: row.clientId,
      companyId: row.companyId,
      issueDate: row.issueDate,
      dueDate: row.dueDate,
      status: row.status || 'DRAFT',
      currency: row.currency || 'USD',
      notes: row.notes,
      termsAndConditions: row.termsAndConditions,
      items: []
    };
    
    // Extract invoice items - determine how many items are in the row
    const itemCount = Object.keys(row)
      .filter(key => key.startsWith('item_') && key.includes('_description'))
      .length;
    
    for (let i = 1; i <= itemCount; i++) {
      const description = row[`item_${i}_description`];
      const quantity = row[`item_${i}_quantity`];
      const unitPrice = row[`item_${i}_unitPrice`];
      
      // Skip if required fields are missing
      if (!description || !quantity || !unitPrice) continue;
      
      invoice.items.push({
        description,
        quantity,
        unitPrice,
        taxRate: row[`item_${i}_taxRate`] || '0',
        productId: row[`item_${i}_productId`] || undefined
      });
    }
    
    // Only add invoices with at least one item
    if (invoice.items.length > 0) {
      invoices.push(invoice as CsvInvoice);
    }
  }
  
  return invoices;
}

// Send invoice data to the API for bulk import
export async function importInvoices(invoices: CsvInvoice[]): Promise<any> {
  const response = await fetch('/api/invoices/bulk-import', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(invoices),
  });
  
  if (!response.ok) {
    let errorData;
    try {
      errorData = await response.json();
    } catch (e) {
      throw new Error(`Import failed: ${response.status} ${response.statusText}`);
    }
    throw new Error(errorData.error || `Import failed: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
}

// Generate a CSV template file for download
export function generateCsvTemplate() {
  const csv = Papa.unparse({
    fields: CSV_HEADERS,
    data: [SAMPLE_CSV_DATA]
  });
  
  return csv;
}

// Download a string as a file
export function downloadCsv(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
} 
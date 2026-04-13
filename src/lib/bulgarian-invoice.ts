/**
 * Bulgarian-specific invoice utilities for NAP (National Revenue Agency) compliance
 */

import { format } from 'date-fns';
import { bg } from 'date-fns/locale';

/**
 * Structure of Bulgarian invoice number parts per NAP regulations
 */
interface BulgarianInvoiceNumberComponents {
  // Required for legally compliant invoice numbering
  year: string;           // Year as YY
  companyId: string;      // Company identifier (can be last 4 of BULSTAT/EIK)
  /** Monotonic sequence (10-digit in new format; 6-digit in legacy stored numbers) */
  sequentialNumber: number;
  type: string;           // Type of document (usually "И" for invoice)
}

/**
 * Generate a Bulgarian invoice number compliant with NAP regulations
 * Format: YYCCCCNNNNNNNNNN (16 digits) where:
 * - YY is the year (e.g., 26 for 2026)
 * - CCCC is the last 4 digits of the company EIK (or 0000)
 * - NNNNNNNNNN is the 10-digit sequential part (e.g., 0000000001)
 *
 * Legacy 12-digit numbers (6-digit sequence) are still parsed for existing rows.
 *
 * @param sequenceNumber Next sequential index (monotonic, not reset by calendar year)
 * @param companyId Optional company identifier to include in the number
 * @returns A Bulgarian-format invoice number
 */
export function generateBulgarianInvoiceNumber(
  sequenceNumber: number,
  companyEik?: string,
  type: 'invoice' | 'credit-note' | 'debit-note' = 'invoice'
): string {
  const year = format(new Date(), 'yy'); // Get last 2 digits of current year
  
  // Use last 4 digits of EIK if available
  const companyPart = companyEik && companyEik.length >= 4 
    ? companyEik.slice(-4) 
    : '0000';
  
  const sequencePart = sequenceNumber.toString().padStart(10, '0');

  return `${year}${companyPart}${sequencePart}`;
}

/**
 * Parse a Bulgarian invoice number to extract its components
 * 
 * @param invoiceNumber The invoice number to parse
 * @returns The components of the invoice number
 */
/** 10-digit sequential segment as shown in settings / migration preview (e.g. 1 → 0000000001). */
export function formatTenDigitSequenceDisplay(sequenceNumber: number): string {
  if (!Number.isFinite(sequenceNumber) || sequenceNumber < 1) return '0000000001';
  const n = Math.floor(sequenceNumber);
  if (n > 9999999999) return '9999999999';
  return n.toString().padStart(10, '0');
}

export function parseBulgarianInvoiceNumber(invoiceNumber: string): BulgarianInvoiceNumberComponents | null {
  const digits = invoiceNumber.replace(/\D/g, '');
  if (digits.length < 12) return null;

  if (digits.length >= 16) {
    const core16 = digits.slice(-16);
    const m16 = core16.match(/^(\d{2})(\d{4})(\d{10})$/);
    if (m16) {
      return {
        year: m16[1],
        companyId: m16[2],
        sequentialNumber: parseInt(m16[3], 10),
        type: 'invoice',
      };
    }
  }

  const core12 = digits.slice(-12);
  const m12 = core12.match(/^(\d{2})(\d{4})(\d{6})$/);
  if (!m12) return null;

  return {
    year: m12[1],
    companyId: m12[2],
    sequentialNumber: parseInt(m12[3], 10),
    type: 'invoice',
  };
}

/**
 * Validate a Bulgarian VAT number (starts with BG followed by 9-10 digits)
 * 
 * @param vatNumber The VAT number to validate
 * @returns True if the VAT number is valid
 */
export function validateBulgarianVatNumber(vatNumber: string): boolean {
  if (!vatNumber) return false;
  
  const regex = /^BG\d{9,10}$/;
  return regex.test(vatNumber);
}

/**
 * Validate a Bulgarian BULSTAT/EIK number
 * 
 * @param eik The EIK/BULSTAT to validate
 * @returns True if the EIK/BULSTAT is valid
 */
export function validateBulgarianEik(eik: string): boolean {
  if (!eik) return false;
  
  // Remove all non-digits
  const digitsOnly = eik.replace(/\D/g, '');
  
  // EIK/BULSTAT should be 9 or 13 digits
  if (digitsOnly.length !== 9 && digitsOnly.length !== 13) {
    return false;
  }
  
  // For 9-digit EIK, perform specific validation algorithm
  if (digitsOnly.length === 9) {
    // Convert to array of digits
    const digits = digitsOnly.split('').map(d => parseInt(d, 10));
    
    // Calculate checksum
    let sum = 0;
    for (let i = 0; i < 8; i++) {
      sum += digits[i] * (i + 1);
    }
    
    const remainder = sum % 11;
    const checkDigit = remainder < 10 ? remainder : 0;
    
    return checkDigit === digits[8];
  }
  
  // For 13-digit, different algorithm
  if (digitsOnly.length === 13) {
    // First validate the base 9 digits
    const first9Valid = validateBulgarianEik(digitsOnly.substring(0, 9));
    if (!first9Valid) return false;
    
    // Validate last 4 digits
    const digits = digitsOnly.split('').map(d => parseInt(d, 10));
    const weights = [2, 7, 3, 5];
    
    let sum = 0;
    for (let i = 0; i < 4; i++) {
      sum += digits[i + 9] * weights[i];
    }
    
    const remainder = sum % 11;
    const checkDigit = remainder < 10 ? remainder : 0;
    
    return checkDigit === digits[12];
  }
  
  return false;
}

/**
 * Format a Bulgarian date according to local requirements
 * 
 * @param date The date to format
 * @returns Formatted date string (e.g., "01 Януари 2024 г.")
 */
export function formatBulgarianDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, 'dd MMMM yyyy \'г.\'', { locale: bg });
}

/**
 * Format a Bulgarian currency amount according to local requirements
 * 
 * @param amount The amount to format
 * @returns Formatted amount string (e.g., "1 234,56 €")
 */
export function formatBulgarianCurrency(amount: number): string {
  return new Intl.NumberFormat('bg-BG', { 
    style: 'currency', 
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2 
  }).format(amount);
} 
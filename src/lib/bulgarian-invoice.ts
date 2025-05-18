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
  sequentialNumber: number; // Sequential number starting from 1 each year
  type: string;           // Type of document (usually "И" for invoice)
}

/**
 * Generate a Bulgarian invoice number compliant with NAP regulations
 * Format: YYNNNNNNNNNN where:
 * - YY is the year (e.g., 24 for 2024)
 * - NNNNNNNNNN is the sequential number (e.g., 0000000001)
 * 
 * @param sequenceNumber Sequential number in the year
 * @param companyId Optional company identifier to include in the number
 * @returns A Bulgarian-format invoice number
 */
export function generateBulgarianInvoiceNumber(
  sequenceNumber: number,
  companyEik?: string,
  type: 'invoice' | 'credit-note' | 'debit-note' = 'invoice'
): string {
  const year = format(new Date(), 'yy'); // Get last 2 digits of current year
  
  let typeCode = 'И'; // Default for invoice (Фактура)
  if (type === 'credit-note') typeCode = 'К'; // Credit note (Кредитно известие)
  if (type === 'debit-note') typeCode = 'Д'; // Debit note (Дебитно известие)
  
  // Use last 4 digits of EIK if available
  const companyPart = companyEik && companyEik.length >= 4 
    ? companyEik.slice(-4) 
    : '0000';
  
  // Format the sequence number to have leading zeros
  const sequencePart = sequenceNumber.toString().padStart(6, '0');
  
  // Format according to Bulgarian regulations
  return `${year}${companyPart}${sequencePart}${typeCode}`;
}

/**
 * Parse a Bulgarian invoice number to extract its components
 * 
 * @param invoiceNumber The invoice number to parse
 * @returns The components of the invoice number
 */
export function parseBulgarianInvoiceNumber(invoiceNumber: string): BulgarianInvoiceNumberComponents | null {
  // Expected format: YYCCCCNNNNNNX where YY=year, CCCC=company, NNNNNN=sequential number, X=type
  const regex = /^(\d{2})(\d{4})(\d{6})([А-Я])$/;
  const match = invoiceNumber.match(regex);
  
  if (!match) return null;
  
  return {
    year: match[1],
    companyId: match[2],
    sequentialNumber: parseInt(match[3], 10),
    type: match[4]
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
 * @returns Formatted amount string (e.g., "1 234,56 лв.")
 */
export function formatBulgarianCurrency(amount: number): string {
  return new Intl.NumberFormat('bg-BG', { 
    style: 'currency', 
    currency: 'BGN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2 
  }).format(amount);
} 
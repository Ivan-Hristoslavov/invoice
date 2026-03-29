/**
 * Format a number as currency based on locale and currency code
 */
export function formatCurrency(
  amount: number, 
  locale: string = 'en', 
  currency: string = 'USD'
) {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

/**
 * Format a number based on locale
 */
export function formatNumber(
  number: number, 
  locale: string = 'en', 
  options?: Intl.NumberFormatOptions
) {
  return new Intl.NumberFormat(locale, options).format(number);
}

/**
 * Format a date based on locale
 */
export function formatDate(
  date: Date | string | number,
  locale: string = 'en',
  options: Intl.DateTimeFormatOptions = { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  }
) {
  const dateToFormat = typeof date === 'string' || typeof date === 'number' 
    ? new Date(date) 
    : date;
  
  return new Intl.DateTimeFormat(locale, options).format(dateToFormat);
}

/**
 * Get tax rate name based on country and locale
 */
export function getTaxRateName(taxRate: number, country: string, locale: string = 'en'): string {
  // Most EU countries use VAT, UK has its own name for VAT, US uses Sales Tax, etc.
  const euCountries = ['AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE'];
  
  const countryCode = country.toUpperCase().slice(0, 2);
  
  // Country-specific tax names
  const taxNames: Record<string, Record<string, string>> = {
    BG: {
      en: 'VAT',
      bg: 'ДДС'
    },
    GB: {
      en: 'VAT',
      bg: 'ДДС (UK)'
    },
    US: {
      en: 'Sales Tax',
      bg: 'Данък върху продажбите (US)'
    }
  };
  
  // Use country-specific names when available
  if (taxNames[countryCode] && taxNames[countryCode][locale]) {
    return `${taxNames[countryCode][locale]} (${taxRate}%)`;
  }
  
  // Default to VAT for EU countries
  if (euCountries.includes(countryCode)) {
    return locale === 'bg' ? `ДДС (${taxRate}%)` : `VAT (${taxRate}%)`;
  }
  
  // Fallback for other countries
  return locale === 'bg' ? `Данък (${taxRate}%)` : `Tax (${taxRate}%)`;
}

/**
 * Format a phone number based on country and locale
 */
export function formatPhoneNumber(phoneNumber: string, country: string): string {
  // This is a simple implementation; consider using a library like libphonenumber-js for production
  if (!phoneNumber) return '';
  
  // Remove all non-numeric characters except + at the beginning
  const cleaned = phoneNumber.replace(/(?!^\+)\D/g, '');
  
  // Format based on country
  switch(country.toUpperCase().slice(0, 2)) {
    case 'BG': // Bulgaria
      if (cleaned.startsWith('+359')) {
        // +359 2 123 4567
        const parts = [
          cleaned.slice(0, 4), // +359
          cleaned.slice(4, 5), // 2
          cleaned.slice(5, 8), // 123
          cleaned.slice(8)     // 4567
        ];
        return parts.join(' ');
      }
      break;
    case 'GB': // United Kingdom
      if (cleaned.startsWith('+44')) {
        // +44 12 3456 7890
        const parts = [
          cleaned.slice(0, 3), // +44
          cleaned.slice(3, 5), // 12
          cleaned.slice(5, 9), // 3456
          cleaned.slice(9)     // 7890
        ];
        return parts.join(' ');
      }
      break;
    case 'US': // United States
      if (cleaned.startsWith('+1')) {
        // +1 (123) 456-7890
        const parts = [
          cleaned.slice(0, 2),                    // +1
          `(${cleaned.slice(2, 5)})`,             // (123)
          `${cleaned.slice(5, 8)}-${cleaned.slice(8)}` // 456-7890
        ];
        return parts.join(' ');
      }
      break;
  }
  
  // Default formatting for other countries or if format doesn't match expectations
  return phoneNumber;
}

/**
 * Determines if a company is from the EU for tax purposes
 */
export function isEUCompany(country: string): boolean {
  const euCountries = ['AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE'];
  
  return euCountries.includes(country.toUpperCase().slice(0, 2));
} 
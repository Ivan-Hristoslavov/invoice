import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency: string = "USD"): string {
  // Define currency symbols
  const currencySymbols: Record<string, string> = {
    USD: "$",
    EUR: "€",
    GBP: "£",
    BGN: "лв ",
  };

  // Get symbol or default to currency code
  const symbol = currencySymbols[currency] || currency;
  
  // Format the amount with 2 decimal places
  const formattedAmount = amount.toFixed(2);
  
  return `${symbol}${formattedAmount}`;
}

export function getCurrencySymbol(currency: string = "USD"): string {
  const currencySymbols: Record<string, string> = {
    USD: "$",
    EUR: "€",
    GBP: "£",
    BGN: "лв",
  };
  
  return currencySymbols[currency] || "$";
}

// Function to convert country names to ISO 3166-1 alpha-2 codes
export function getCountryCode(countryName: string | null | undefined): string {
  if (!countryName) return 'BG'; // Default to Bulgaria if no country

  // Common country name mappings
  const countryMap: Record<string, string> = {
    'United States': 'US',
    'USA': 'US',
    'United States of America': 'US',
    'Bulgaria': 'BG',
    'United Kingdom': 'GB',
    'UK': 'GB',
    'Germany': 'DE',
    'France': 'FR',
    'Italy': 'IT',
    'Spain': 'ES',
    'Canada': 'CA',
    'Australia': 'AU',
    'Japan': 'JP',
    'China': 'CN',
    'India': 'IN',
    'Brazil': 'BR',
    'Russia': 'RU',
    'Netherlands': 'NL',
    'Greece': 'GR',
    'Turkey': 'TR',
  };
  
  // Try to find the country code in our map
  const countryCode = countryMap[countryName.trim()];
  if (countryCode) return countryCode;
  
  // If we have an exact 2-letter code already, use it
  if (countryName.length === 2 && /^[A-Z]{2}$/.test(countryName.toUpperCase())) {
    return countryName.toUpperCase();
  }
  
  // Default fallback
  return 'BG';
}

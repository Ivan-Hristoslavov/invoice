import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Helper function to format price - removes unnecessary trailing zeros
export function formatPrice(value: number): string {
  // Round to 2 decimal places to avoid floating point issues
  const rounded = Math.round(value * 100) / 100;
  
  // If it's a whole number, show without decimals
  if (Number.isInteger(rounded)) {
    return rounded.toString();
  }
  
  // Check if it has only one decimal place (e.g., 1.2, 5.5)
  const oneDecimal = Math.round(value * 10) / 10;
  if (oneDecimal === rounded) {
    return oneDecimal.toString();
  }
  
  // Otherwise show 2 decimal places
  return rounded.toFixed(2);
}

export function formatCurrency(amount: number, currency: string = "EUR"): string {
  const currencySymbols: Record<string, string> = {
    EUR: "€",
    USD: "$",
    GBP: "£",
  };

  const formattedAmount = formatPrice(amount);
  if (currency === "BGN") {
    return `${formattedAmount} лв.`;
  }

  const symbol = currencySymbols[currency] || currency;
  return `${symbol}${formattedAmount}`;
}

export function getCurrencySymbol(currency: string = "EUR"): string {
  const currencySymbols: Record<string, string> = {
    EUR: "€",
    USD: "$",
    GBP: "£",
  };

  return currencySymbols[currency] || currency;
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

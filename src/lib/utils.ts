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

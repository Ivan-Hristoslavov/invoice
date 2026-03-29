import { describe, it, expect } from "vitest";
import {
  formatCurrency,
  formatNumber,
  formatDate,
  getTaxRateName,
  formatPhoneNumber,
  isEUCompany,
} from "@/lib/format";

describe("formatCurrency (lib/format)", () => {
  it("formats EUR by default", () => {
    const result = formatCurrency(1000, "en", "EUR");
    expect(result).toContain("1,000.00");
  });

  it("formats USD", () => {
    const result = formatCurrency(50, "en", "USD");
    expect(result).toContain("50.00");
  });

  it("formats BGN", () => {
    const result = formatCurrency(100, "bg", "BGN");
    expect(typeof result).toBe("string");
    expect(result).not.toBe("");
  });

  it("handles zero", () => {
    const result = formatCurrency(0, "en", "EUR");
    expect(result).toContain("0.00");
  });

  it("handles negative values", () => {
    const result = formatCurrency(-100, "en", "EUR");
    expect(result).toContain("100.00");
  });
});

describe("formatNumber", () => {
  it("formats integer", () => {
    expect(formatNumber(1234, "en")).toBe("1,234");
  });

  it("formats decimal", () => {
    const result = formatNumber(1234.56, "en", { minimumFractionDigits: 2 });
    expect(result).toContain("1,234.56");
  });
});

describe("formatDate", () => {
  it("formats a Date object", () => {
    const date = new Date("2024-01-15");
    const result = formatDate(date, "en");
    expect(result).toContain("2024");
    expect(result).toContain("January");
  });

  it("formats an ISO string", () => {
    const result = formatDate("2024-06-01", "en");
    expect(result).toContain("2024");
  });

  it("formats a timestamp", () => {
    const result = formatDate(Date.UTC(2024, 0, 1), "en");
    expect(result).toContain("2024");
  });
});

describe("getTaxRateName", () => {
  it("returns ДДС in Bulgarian for BG", () => {
    expect(getTaxRateName(20, "BG", "bg")).toBe("ДДС (20%)");
  });

  it("returns VAT in English for BG", () => {
    expect(getTaxRateName(20, "BG", "en")).toBe("VAT (20%)");
  });

  it("returns VAT for EU countries", () => {
    expect(getTaxRateName(19, "DE", "en")).toBe("VAT (19%)");
    expect(getTaxRateName(23, "PL", "en")).toBe("VAT (23%)");
  });

  it("returns ДДС for EU countries in bg locale", () => {
    expect(getTaxRateName(19, "DE", "bg")).toBe("ДДС (19%)");
  });

  it("returns Sales Tax for US", () => {
    expect(getTaxRateName(8, "US", "en")).toBe("Sales Tax (8%)");
  });

  it("returns generic tax for unknown countries", () => {
    expect(getTaxRateName(10, "JP", "en")).toBe("Tax (10%)");
    expect(getTaxRateName(10, "JP", "bg")).toBe("Данък (10%)");
  });

  it("extracts first 2 uppercase chars as country code", () => {
    // "BG" → "BG" → exact match
    expect(getTaxRateName(20, "BG", "en")).toBe("VAT (20%)");
    // "bg" → "BG" after toUpperCase().slice(0,2)
    expect(getTaxRateName(20, "bg", "en")).toBe("VAT (20%)");
  });
});

describe("formatPhoneNumber", () => {
  it("formats Bulgarian phone number", () => {
    const result = formatPhoneNumber("+35921234567", "BG");
    expect(result).toContain("+359");
  });

  it("formats US phone number", () => {
    const result = formatPhoneNumber("+11234567890", "US");
    expect(result).toContain("+1");
    expect(result).toContain("(123)");
  });

  it("formats UK phone number", () => {
    const result = formatPhoneNumber("+441234567890", "GB");
    expect(result).toContain("+44");
  });

  it("returns empty string for empty input", () => {
    expect(formatPhoneNumber("", "BG")).toBe("");
  });

  it("passes through unrecognised format", () => {
    const phone = "+491234567890";
    expect(formatPhoneNumber(phone, "DE")).toBe(phone);
  });
});

describe("isEUCompany", () => {
  it("returns true for EU countries", () => {
    expect(isEUCompany("BG")).toBe(true);
    expect(isEUCompany("DE")).toBe(true);
    expect(isEUCompany("FR")).toBe(true);
    expect(isEUCompany("PL")).toBe(true);
    expect(isEUCompany("SE")).toBe(true);
  });

  it("returns false for non-EU countries", () => {
    expect(isEUCompany("US")).toBe(false);
    expect(isEUCompany("GB")).toBe(false);
    expect(isEUCompany("JP")).toBe(false);
    expect(isEUCompany("CN")).toBe(false);
  });

  it("is case-insensitive for 2-char codes", () => {
    // lowercase 2-char code: "bg".toUpperCase().slice(0,2) = "BG" ✓
    expect(isEUCompany("bg")).toBe(true);
    expect(isEUCompany("de")).toBe(true);
  });
});

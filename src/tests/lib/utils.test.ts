import { describe, it, expect } from "vitest";
import { cn, formatPrice, formatCurrency, getCurrencySymbol, getCountryCode } from "@/lib/utils";

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("handles conditional classes", () => {
    expect(cn("base", false && "hidden", "visible")).toBe("base visible");
  });

  it("deduplicates tailwind conflicts (twMerge)", () => {
    expect(cn("p-4", "p-8")).toBe("p-8");
  });

  it("handles undefined/null gracefully", () => {
    expect(cn("foo", undefined, null as any, "bar")).toBe("foo bar");
  });

  it("handles empty input", () => {
    expect(cn()).toBe("");
  });
});

describe("formatPrice", () => {
  it("always shows two fraction digits", () => {
    expect(formatPrice(10)).toBe("10.00");
    expect(formatPrice(0)).toBe("0.00");
    expect(formatPrice(100)).toBe("100.00");
  });

  it("pads one-decimal amounts to two places", () => {
    expect(formatPrice(1.5)).toBe("1.50");
    expect(formatPrice(9.1)).toBe("9.10");
  });

  it("shows two decimals for fractional amounts", () => {
    expect(formatPrice(1.23)).toBe("1.23");
    expect(formatPrice(99.99)).toBe("99.99");
  });

  it("rounds to 2 decimal places", () => {
    expect(formatPrice(1.005)).toBe("1.00");
    expect(formatPrice(1.234567)).toBe("1.23");
  });

  it("handles negative values", () => {
    expect(formatPrice(-5)).toBe("-5.00");
    expect(formatPrice(-1.5)).toBe("-1.50");
  });
});

describe("formatCurrency", () => {
  it("defaults to EUR symbol", () => {
    expect(formatCurrency(10)).toBe("€10.00");
  });

  it("uses EUR symbol for EUR", () => {
    expect(formatCurrency(100, "EUR")).toBe("€100.00");
  });

  it("formats BGN and USD with known symbols", () => {
    expect(formatCurrency(50, "BGN")).toBe("50.00 лв.");
    expect(formatCurrency(50, "USD")).toBe("$50.00");
  });

  it("uses raw currency code as symbol when unknown", () => {
    expect(formatCurrency(50, "CHF")).toBe("CHF50.00");
  });

  it("formats decimal amounts correctly", () => {
    expect(formatCurrency(9.99)).toBe("€9.99");
    expect(formatCurrency(0.5)).toBe("€0.50");
  });

  it("handles zero", () => {
    expect(formatCurrency(0)).toBe("€0.00");
  });
});

describe("getCurrencySymbol", () => {
  it("returns € for EUR", () => {
    expect(getCurrencySymbol("EUR")).toBe("€");
  });

  it("returns code string for unknown currencies and € by default", () => {
    expect(getCurrencySymbol("XYZ")).toBe("XYZ");
    expect(getCurrencySymbol()).toBe("€");
  });
});

describe("getCountryCode", () => {
  it("returns BG for null/undefined", () => {
    expect(getCountryCode(null)).toBe("BG");
    expect(getCountryCode(undefined)).toBe("BG");
    expect(getCountryCode("")).toBe("BG");
  });

  it("maps full country names to codes", () => {
    expect(getCountryCode("Bulgaria")).toBe("BG");
    expect(getCountryCode("United States")).toBe("US");
    expect(getCountryCode("United Kingdom")).toBe("GB");
    expect(getCountryCode("Germany")).toBe("DE");
    expect(getCountryCode("France")).toBe("FR");
  });

  it("accepts aliases", () => {
    expect(getCountryCode("USA")).toBe("US");
    expect(getCountryCode("UK")).toBe("GB");
  });

  it("passthrough 2-letter uppercase codes", () => {
    expect(getCountryCode("BG")).toBe("BG");
    expect(getCountryCode("DE")).toBe("DE");
    expect(getCountryCode("US")).toBe("US");
  });

  it("falls back to BG for unknown names", () => {
    expect(getCountryCode("Narnia")).toBe("BG");
  });
});

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  formatTenDigitSequenceDisplay,
  generateBulgarianInvoiceNumber,
  parseBulgarianInvoiceNumber,
} from "@/lib/bulgarian-invoice";
import { computeBootstrapNextSequence } from "@/lib/invoice-sequence-logic";

describe("invoice numbering", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(Date.UTC(2026, 3, 13, 12, 0, 0)));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("generate uses 10-digit sequence segment (16-digit core)", () => {
    const core = generateBulgarianInvoiceNumber(1, "123456789");
    expect(core).toBe("2667890000000001");
    expect(core).toHaveLength(16);
  });

  it("parse supports new 16-digit core with optional prefix", () => {
    const p = parseBulgarianInvoiceNumber("Ф-2667890000000123");
    expect(p?.sequentialNumber).toBe(123);
    expect(p?.year).toBe("26");
  });

  it("parse supports legacy 12-digit numbers", () => {
    const p = parseBulgarianInvoiceNumber("260000000001");
    expect(p?.sequentialNumber).toBe(1);
  });

  it("formatTenDigitSequenceDisplay pads migration preview", () => {
    expect(formatTenDigitSequenceDisplay(1)).toBe("0000000001");
    expect(formatTenDigitSequenceDisplay(123)).toBe("0000000123");
  });

  it("computeBootstrapNextSequence respects migration start and existing max", () => {
    expect(
      computeBootstrapNextSequence({
        maxSequentialFromInvoices: 0,
        maxLegacySequenceCounter: 0,
        startingInvoiceNumber: 1,
      })
    ).toBe(1);

    expect(
      computeBootstrapNextSequence({
        maxSequentialFromInvoices: 122,
        maxLegacySequenceCounter: 0,
        startingInvoiceNumber: 1,
      })
    ).toBe(123);

    expect(
      computeBootstrapNextSequence({
        maxSequentialFromInvoices: 50,
        maxLegacySequenceCounter: 0,
        startingInvoiceNumber: 200,
      })
    ).toBe(200);

    expect(
      computeBootstrapNextSequence({
        maxSequentialFromInvoices: 200,
        maxLegacySequenceCounter: 0,
        startingInvoiceNumber: 123,
      })
    ).toBe(201);
  });
});

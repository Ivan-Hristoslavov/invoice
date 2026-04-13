import { describe, expect, it } from "vitest";
import { evaluateInvoiceItemEditorDraft } from "@/lib/invoice-item-editor-draft";

const fallback = {
  taxRate: 20,
  unitPrice: 100,
  unitPriceGross: 120,
};

describe("evaluateInvoiceItemEditorDraft", () => {
  it("allows empty quantity temporarily and marks invalid", () => {
    const r = evaluateInvoiceItemEditorDraft("Item", "", "20", "120", fallback);
    expect(r.quantityInvalid).toBe(true);
    expect(r.canSave).toBe(false);
  });

  it("allows zero quantity in draft and marks invalid", () => {
    const r = evaluateInvoiceItemEditorDraft("Item", "0", "20", "120", fallback);
    expect(r.quantityInvalid).toBe(true);
    expect(r.canSave).toBe(false);
  });

  it("enables save when all fields valid", () => {
    const r = evaluateInvoiceItemEditorDraft("Item", "2", "20", "120", fallback);
    expect(r.canSave).toBe(true);
    expect(r.quantityInvalid).toBe(false);
    expect(r.taxInvalid).toBe(false);
    expect(r.grossInvalid).toBe(false);
  });

  it("rejects gross price at zero", () => {
    const r = evaluateInvoiceItemEditorDraft("Item", "1", "20", "0", fallback);
    expect(r.grossInvalid).toBe(true);
    expect(r.canSave).toBe(false);
  });

  it("computes preview totals for valid drafts", () => {
    const r = evaluateInvoiceItemEditorDraft("Item", "2", "20", "120", fallback);
    expect(r.previewQty).toBe(2);
    expect(r.itemTotal).toBeGreaterThan(0);
    expect(r.itemTotalWithTax).toBeGreaterThan(r.itemTotal);
  });
});

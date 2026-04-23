import { describe, expect, it } from "vitest";
import { validateInvoiceForIssuing } from "@/lib/validate-invoice-for-issuing";

const baseCompany = {
  bulstatNumber: "175074752",
  mol: "Иван Иванов",
  vatRegistered: true,
};

describe("validateInvoiceForIssuing — supplyType scenarios", () => {
  it("accepts a domestic invoice with standard VAT", () => {
    const { validationErrors } = validateInvoiceForIssuing({
      placeOfIssue: "София",
      supplyType: "DOMESTIC",
      reverseCharge: false,
      company: baseCompany,
      items: [{ description: "Услуга", taxRate: 20 }],
    });
    expect(validationErrors).toEqual([]);
  });

  it("blocks reverse charge without 0% VAT", () => {
    const { validationErrors } = validateInvoiceForIssuing({
      placeOfIssue: "София",
      supplyType: "REVERSE_CHARGE_DOMESTIC",
      reverseCharge: true,
      company: baseCompany,
      items: [{ description: "Услуга", taxRate: 20 }],
    });
    expect(validationErrors.some((err) => err.includes("0%"))).toBe(true);
  });

  it("blocks reverse-charge supplyType when flag is missing", () => {
    const { validationErrors } = validateInvoiceForIssuing({
      placeOfIssue: "София",
      supplyType: "REVERSE_CHARGE_DOMESTIC",
      reverseCharge: false,
      company: baseCompany,
      items: [
        { description: "Услуга", taxRate: 0, vatExemptReason: "чл. 82 ЗДДС" },
      ],
    });
    expect(
      validationErrors.some((err) => err.includes("Обратно начисляване"))
    ).toBe(true);
  });

  it("warns on intra-community delivery without VIES validation", () => {
    const { validationErrors, warnings } = validateInvoiceForIssuing({
      placeOfIssue: "София",
      supplyType: "INTRA_COMMUNITY",
      reverseCharge: true,
      company: baseCompany,
      client: { country: "DE", viesValid: false, vatRegistered: true },
      items: [
        { description: "ЕС услуга", taxRate: 0, vatExemptReason: "чл. 53 ЗДДС" },
      ],
    });
    expect(validationErrors).toEqual([]);
    expect(warnings.some((w) => w.includes("VIES"))).toBe(true);
  });

  it("blocks export to BG client", () => {
    const { validationErrors } = validateInvoiceForIssuing({
      placeOfIssue: "София",
      supplyType: "EXPORT",
      reverseCharge: false,
      company: baseCompany,
      client: { country: "BG" },
      items: [
        { description: "Стока", taxRate: 0, vatExemptReason: "чл. 28 ЗДДС" },
      ],
    });
    expect(
      validationErrors.some((err) => err.includes("България"))
    ).toBe(true);
  });

  it("blocks NOT_VAT_REGISTERED when company is VAT registered", () => {
    const { validationErrors } = validateInvoiceForIssuing({
      placeOfIssue: "София",
      supplyType: "NOT_VAT_REGISTERED",
      reverseCharge: false,
      company: baseCompany,
      items: [
        { description: "Услуга", taxRate: 0, vatExemptReason: "чл. 113, ал. 9 ЗДДС" },
      ],
    });
    expect(
      validationErrors.some((err) => err.includes("регистрирана"))
    ).toBe(true);
  });

  it("requires vatExemptReason for any 0% line", () => {
    const { validationErrors } = validateInvoiceForIssuing({
      placeOfIssue: "София",
      supplyType: "DOMESTIC",
      reverseCharge: false,
      company: baseCompany,
      items: [{ description: "Услуга", taxRate: 0 }],
    });
    expect(
      validationErrors.some((err) => err.includes("основание за освобождаване"))
    ).toBe(true);
  });
});

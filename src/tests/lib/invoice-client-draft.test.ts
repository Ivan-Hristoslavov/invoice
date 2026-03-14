import { describe, expect, it } from "vitest";
import {
  defaultInvoiceClientDraft,
  mapInvoiceClientApiErrors,
  parseInvoiceClientDraft,
  validateInvoiceClientDraft,
} from "@/lib/invoice-client-draft";

describe("invoice-client-draft", () => {
  it("returns inline errors for missing required Bulgarian client fields", () => {
    const errors = validateInvoiceClientDraft(defaultInvoiceClientDraft);

    expect(errors.name).toBeTruthy();
    expect(errors.address).toBeTruthy();
    expect(errors.city).toBeTruthy();
    expect(errors.bulstatNumber).toBeTruthy();
  });

  it("parses a valid Bulgarian client payload", () => {
    const payload = parseInvoiceClientDraft({
      ...defaultInvoiceClientDraft,
      name: "Пример ООД",
      address: "ул. Шипка 1",
      city: "София",
      bulstatNumber: "175074752",
    });

    expect(payload.name).toBe("Пример ООД");
    expect(payload.country).toBe("България");
    expect(payload.uicType).toBe("BULSTAT");
  });

  it("maps API validation details by field", () => {
    expect(
      mapInvoiceClientApiErrors([
        { path: ["bulstatNumber"], message: "Невалиден ЕИК" },
        { path: ["address"], message: "Адресът е задължителен" },
      ])
    ).toEqual({
      bulstatNumber: "Невалиден ЕИК",
      address: "Адресът е задължителен",
    });
  });
});

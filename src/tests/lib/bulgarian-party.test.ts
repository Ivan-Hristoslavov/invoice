import { describe, expect, it } from "vitest";
import {
  buildPartyPayload,
  validateBulgarianPartyInput,
} from "@/lib/bulgarian-party";

describe("bulgarian-party", () => {
  it("requires a Bulgarian VAT number when vatRegistered is enabled", () => {
    const { issues } = validateBulgarianPartyInput({
      name: "Тестова фирма",
      country: "България",
      address: "бул. България 1",
      city: "София",
      bulstatNumber: "175074752",
      vatRegistered: true,
      mol: "Иван Иванов",
      uicType: "BULSTAT",
    }, { requireMol: true });

    expect(issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: ["vatRegistrationNumber"] }),
      ])
    );
  });

  it("normalizes Bulgarian company data into a stable payload", () => {
    const payload = buildPartyPayload({
      name: " Тестова фирма ",
      country: "България",
      address: "бул. България 1",
      city: "София",
      bulstatNumber: "175074752",
      vatRegistered: true,
      vatRegistrationNumber: " bg175074752 ",
      mol: "Иван Иванов",
      uicType: "BULSTAT",
    });

    expect(payload.name).toBe("Тестова фирма");
    expect(payload.vatNumber).toBe("BG175074752");
    expect(payload.taxComplianceSystem).toBe("bulgarian");
  });

  it("does not force Bulgarian validation for foreign EU VAT numbers", () => {
    const { issues } = validateBulgarianPartyInput({
      name: "ACME GmbH",
      country: "Germany",
      address: "Unter den Linden 1",
      city: "Berlin",
      vatNumber: "DE123456789",
      vatRegistered: false,
      uicType: "BULSTAT",
    });

    expect(
      issues.some((issue) => issue.path[0] === "vatRegistrationNumber")
    ).toBe(false);
  });
});

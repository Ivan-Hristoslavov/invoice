import { describe, expect, it } from "vitest";
import {
  buildCompanyBookUrl,
  mapCompanyBookToFormFields,
  normalizeCompanyBookApiBase,
  type CompanyBookResponse,
} from "@/lib/companybook";

describe("companybook helpers", () => {
  it("normalizes legacy /api/companies base path", () => {
    expect(
      normalizeCompanyBookApiBase("https://api.companybook.bg/api/companies")
    ).toBe("https://api.companybook.bg/api");
  });

  it("builds url and skips empty query params", () => {
    const url = buildCompanyBookUrl("https://api.companybook.bg/api", "/companies/search", {
      name: "alfa",
      limit: 5,
      district: "",
    });

    expect(url.toString()).toContain("/companies/search");
    expect(url.searchParams.get("name")).toBe("alfa");
    expect(url.searchParams.get("limit")).toBe("5");
    expect(url.searchParams.get("district")).toBeNull();
  });

  it("maps CompanyBook company payload to party form fields", () => {
    const payload: CompanyBookResponse = {
      company: {
        id: "1",
        uic: "175074752",
        companyName: { name: "Тест ООД" },
        legalForm: "ООД",
        status: "N",
        seat: {
          country: "BG",
          district: "София",
          municipality: "Столична",
          settlement: "гр. София",
          postCode: "1000",
          street: "бул. Цар Борис III",
          streetNumber: "1",
          block: "",
          entrance: "",
          floor: "",
          apartment: "",
        },
        contacts: { phone: "029999999", fax: "", email: "office@test.bg", url: "" },
        subjectOfActivity: "",
        managers: [{ name: "Иван Петров", countryName: "BG" }],
        registerInfo: {
          vat: "BG175074752",
          address: "",
          region: "",
          municipality: "",
          settlement: "",
          registrationBasis: "",
          registrationDate: "",
        },
      },
    };

    const fields = mapCompanyBookToFormFields(payload);
    expect(fields.name).toBe("Тест ООД");
    expect(fields.city).toBe("София");
    expect(fields.vatRegistered).toBe(true);
    expect(fields.vatRegistrationNumber).toBe("BG175074752");
    expect(fields.bulstatNumber).toBe("175074752");
    expect(fields.mol).toBe("Иван Петров");
  });
});

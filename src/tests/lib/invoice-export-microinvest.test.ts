import { describe, expect, it } from "vitest";
import {
  buildMicroinvestWarehouseXml,
  buildMicroinvestWarehouseXmlBatch,
  buildMicroinvestWarehouseTxt,
  microinvestPaymentType,
} from "@/lib/invoice-export-microinvest";
import { parseEuVatInput } from "@/lib/vies";

describe("invoice-export-microinvest", () => {
  it("maps payment methods", () => {
    expect(microinvestPaymentType("CASH")).toBe("1");
    expect(microinvestPaymentType("BANK_TRANSFER")).toBe("2");
    expect(microinvestPaymentType("CREDIT_CARD")).toBe("3");
  });

  it("builds XML with Microinvest root and ExportData", () => {
    const xml = buildMicroinvestWarehouseXml({
      invoiceNumber: "0000123",
      issueDate: "2024-06-15T00:00:00.000Z",
      subtotal: 100,
      taxAmount: 20,
      total: 120,
      paymentMethod: "BANK_TRANSFER",
      notes: "Test sale",
      client: {
        name: "ACME OOD",
        city: "Sofia",
        address: "Main1",
        mol: "Ivan Petrov",
        bulstatNumber: "123456789",
        vatRegistrationNumber: "BG123456789",
      },
    });
    expect(xml).toContain("<Microinvest>");
    expect(xml).toContain("<ExportData>");
    expect(xml).toContain("<StockReceiptType>2</StockReceiptType>");
    expect(xml).toContain("<PartnerName>ACME OOD</PartnerName>");
    expect(xml).toContain("<OperationDescription>Test sale</OperationDescription>");
  });

  it("builds batch XML with multiple ExportData under one Microinvest root", () => {
    const xml = buildMicroinvestWarehouseXmlBatch([
      {
        invoiceNumber: "A-1",
        issueDate: "2024-01-10T00:00:00.000Z",
        subtotal: 100,
        taxAmount: 20,
        total: 120,
        paymentMethod: "BANK_TRANSFER",
        client: { name: "Client A" },
      },
      {
        invoiceNumber: "A-2",
        issueDate: "2024-01-11T00:00:00.000Z",
        subtotal: 50,
        taxAmount: 10,
        total: 60,
        paymentMethod: "CASH",
        client: { name: "Client B" },
      },
    ]);
    expect(xml.match(/<Microinvest>/g)?.length).toBe(1);
    expect(xml.match(/<ExportData>/g)?.length).toBe(2);
    expect(xml).toContain("<InvoiceNo>A-1</InvoiceNo>");
    expect(xml).toContain("<InvoiceNo>A-2</InvoiceNo>");
    expect(xml).toContain("<PartnerName>Client A</PartnerName>");
    expect(xml).toContain("<PartnerName>Client B</PartnerName>");
  });

  it("builds TXT key=value export", () => {
    const txt = buildMicroinvestWarehouseTxt({
      invoiceNumber: "1",
      issueDate: new Date(2024, 5, 15),
      subtotal: 50,
      taxAmount: 10,
      total: 60,
      paymentMethod: "CASH",
      client: { name: "X" },
    });
    expect(txt).toContain("FORMAT=MICROINVEST_WAREHOUSE_EXPORT_V1");
    expect(txt).toContain("StockReceiptType=2");
    expect(txt).toContain("PartnerName=X");
  });
});

describe("vies parseEuVatInput", () => {
  it("normalizes Greece GR to EL for API", () => {
    const p = parseEuVatInput("GR123456789");
    expect(p?.countryCode).toBe("EL");
  });

  it("parses standard EU VAT", () => {
    const p = parseEuVatInput("DE123456789");
    expect(p?.countryCode).toBe("DE");
    expect(p?.vatLocal).toBe("123456789");
  });
});

import { describe, expect, it } from "vitest";
import {
  detectMicroinvestTxtKind,
  parseMicroinvestTxtFormScriptStatusImport,
  parseMicroinvestTxtKeyValueStatusImport,
  parseMicroinvestXmlStatusImport,
  parseStatusImportCsv,
  parseStatusImportJson,
} from "@/lib/invoice-status-import-parsers";

describe("parseStatusImportCsv", () => {
  it("parses valid rows with English headers", () => {
    const csv = "invoiceNumber,companyId,status,paidAt\nINV-1,c1,PAID,2026-05-13T10:00:00.000Z\n";
    const { rows, warnings } = parseStatusImportCsv(csv);
    expect(warnings.length).toBe(0);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      invoiceNumber: "INV-1",
      companyId: "c1",
      status: "PAID",
      paidAt: "2026-05-13T10:00:00.000Z",
    });
  });

  it("maps Bulgarian status labels", () => {
    const csv = "invoiceNumber,companyId,status\nINV-2,c1,ПЛАТЕНА\n";
    const { rows, warnings } = parseStatusImportCsv(csv);
    expect(warnings.length).toBe(0);
    expect(rows[0]?.status).toBe("PAID");
  });

  it("records warnings for invalid status", () => {
    const csv = "invoiceNumber,companyId,status\nINV-3,c1,UNKNOWN\n";
    const { rows, warnings } = parseStatusImportCsv(csv);
    expect(rows).toHaveLength(0);
    expect(warnings.some((w) => w.message.includes("Невалиден"))).toBe(true);
  });
});

describe("parseStatusImportJson", () => {
  it("accepts bare array", () => {
    const text = JSON.stringify([
      { invoiceNumber: "A", companyId: "c1", status: "UNPAID" },
    ]);
    const { rows } = parseStatusImportJson(text);
    expect(rows).toHaveLength(1);
  });

  it("accepts object with rows", () => {
    const text = JSON.stringify({
      rows: [{ invoiceNumber: "B", companyId: "c1", status: "ПРОСРОЧЕНА" }],
    });
    const { rows } = parseStatusImportJson(text);
    expect(rows[0]?.status).toBe("OVERDUE");
  });

  it("returns warning on invalid JSON", () => {
    const { rows, warnings } = parseStatusImportJson("{");
    expect(rows).toHaveLength(0);
    expect(warnings[0]?.message).toMatch(/JSON/);
  });
});

describe("parseMicroinvestXmlStatusImport", () => {
  it("requires default company id", () => {
    const xml = "<ExportData><InvoiceNo>99</InvoiceNo></ExportData>";
    const { rows, warnings } = parseMicroinvestXmlStatusImport(xml, "");
    expect(rows).toHaveLength(0);
    expect(warnings[0]?.message).toMatch(/фирма/);
  });

  it("extracts invoice numbers as UNPAID", () => {
    const xml = "<ExportData><InvoiceNo>100</InvoiceNo></ExportData>";
    const { rows } = parseMicroinvestXmlStatusImport(xml, "c1");
    expect(rows).toEqual([
      expect.objectContaining({
        invoiceNumber: "100",
        companyId: "c1",
        status: "UNPAID",
      }),
    ]);
  });
});

describe("microinvest txt parsers", () => {
  it("detects key=value kind", () => {
    const raw = "FORMAT=MICROINVEST_WAREHOUSE_EXPORT_V1\nInvoiceNo=55\n";
    expect(detectMicroinvestTxtKind(raw)).toBe("kv");
  });

  it("detects formscript kind", () => {
    const raw = "F3\nНаредител - име=Фактура 260000000099\n";
    expect(detectMicroinvestTxtKind(raw)).toBe("formscript");
  });

  it("parses key=value blocks", () => {
    const raw = "InvoiceNo=77\n";
    const { rows } = parseMicroinvestTxtKeyValueStatusImport(raw, "c1");
    expect(rows[0]?.invoiceNumber).toBe("77");
  });

  it("parses formscript invoice number", () => {
    const raw = "F3\nНаредител - име=Фактура 260000000099\n";
    const { rows } = parseMicroinvestTxtFormScriptStatusImport(raw, "c1");
    expect(rows[0]?.invoiceNumber).toBe("260000000099");
  });
});

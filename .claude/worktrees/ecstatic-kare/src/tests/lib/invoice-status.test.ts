import { describe, expect, it } from "vitest";
import {
  getDatabaseStatusForAppStatus,
  getDatabaseStatusesForAppStatus,
  isIssuedLikeStatus,
  normalizeInvoiceStatus,
} from "@/lib/invoice-status";

describe("invoice-status", () => {
  it("normalizes legacy database statuses to the app issued status", () => {
    expect(normalizeInvoiceStatus("ISSUED")).toBe("ISSUED");
    expect(normalizeInvoiceStatus("PAID")).toBe("ISSUED");
    expect(normalizeInvoiceStatus("UNPAID")).toBe("ISSUED");
    expect(normalizeInvoiceStatus("OVERDUE")).toBe("ISSUED");
  });

  it("returns all compatible database values for the issued filter", () => {
    expect(getDatabaseStatusesForAppStatus("ISSUED")).toEqual([
      "UNPAID",
      "PAID",
      "OVERDUE",
    ]);
  });

  it("maps the app issued status to the initial database status", () => {
    expect(getDatabaseStatusForAppStatus("ISSUED")).toBe("UNPAID");
    expect(getDatabaseStatusForAppStatus("VOIDED")).toBe("VOIDED");
  });

  it("detects issued-like statuses consistently", () => {
    expect(isIssuedLikeStatus("PAID")).toBe(true);
    expect(isIssuedLikeStatus("ISSUED")).toBe(true);
    expect(isIssuedLikeStatus("VOIDED")).toBe(false);
  });
});

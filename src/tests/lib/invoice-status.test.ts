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
      "ISSUED",
      "UNPAID",
      "PAID",
      "OVERDUE",
    ]);
  });

  it("reuses an existing legacy issued-like status when persisting", () => {
    expect(getDatabaseStatusForAppStatus("ISSUED", "PAID")).toBe("PAID");
    expect(getDatabaseStatusForAppStatus("ISSUED", "UNPAID")).toBe("UNPAID");
    expect(getDatabaseStatusForAppStatus("ISSUED", "DRAFT")).toBe("PAID");
  });

  it("detects issued-like statuses consistently", () => {
    expect(isIssuedLikeStatus("PAID")).toBe(true);
    expect(isIssuedLikeStatus("ISSUED")).toBe(true);
    expect(isIssuedLikeStatus("VOIDED")).toBe(false);
  });
});

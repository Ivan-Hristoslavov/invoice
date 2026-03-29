import { describe, expect, it } from "vitest";

import { canExportFormat, hasAnyExportAccess } from "@/lib/subscription-plans";

describe("subscription-plans export helpers", () => {
  it("restricts export formats by capability tier", () => {
    expect(hasAnyExportAccess("none")).toBe(false);
    expect(hasAnyExportAccess("csv")).toBe(true);
    expect(canExportFormat("none", "csv")).toBe(false);
    expect(canExportFormat("csv", "csv")).toBe(true);
    expect(canExportFormat("csv", "json")).toBe(false);
    expect(canExportFormat("csv", "pdf")).toBe(false);
    expect(canExportFormat("full", "csv")).toBe(true);
    expect(canExportFormat("full", "json")).toBe(true);
    expect(canExportFormat("full", "pdf")).toBe(true);
  });
});

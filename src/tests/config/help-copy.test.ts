import { describe, it, expect } from "vitest";
import { getHelpText, helpCopy } from "@/config/help-copy";

describe("help-copy", () => {
  it("returns BG strings for keys", () => {
    expect(getHelpText("eik").length).toBeGreaterThan(10);
    expect(helpCopy.mol).toContain("МОЛ");
  });
});

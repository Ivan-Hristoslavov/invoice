import { describe, it, expect } from "vitest";
import {
  SETTINGS_NAV_ITEMS,
  isSettingsChildActive,
} from "@/components/layout/sidebar-config";

describe("sidebar settings config", () => {
  it("lists 7 settings links", () => {
    expect(SETTINGS_NAV_ITEMS.length).toBe(7);
  });

  it("matches company sub-routes", () => {
    expect(isSettingsChildActive("/settings/company/bank", "/settings/company")).toBe(true);
    expect(isSettingsChildActive("/settings/company/logo", "/settings/company")).toBe(true);
    expect(isSettingsChildActive("/settings/company", "/settings/company")).toBe(true);
  });
});

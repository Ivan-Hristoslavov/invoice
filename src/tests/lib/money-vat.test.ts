import { describe, expect, it } from "vitest";
import { grossToNetAmount, netToGrossAmount, roundMoney2 } from "@/lib/money-vat";

describe("money-vat (VAT-inclusive gross entry)", () => {
  it("gross 15 @ 9% -> net 13.76, vat 1.24, round-trip gross 15", () => {
    const gross = 15;
    const rate = 9;
    const net = grossToNetAmount(gross, rate);
    const vat = roundMoney2(gross - net);
    expect(net).toBe(13.76);
    expect(vat).toBe(1.24);
    expect(netToGrossAmount(net, rate)).toBe(15);
  });

  it("gross 15 @ 20% -> net 12.50, vat 2.50", () => {
    const gross = 15;
    const rate = 20;
    const net = grossToNetAmount(gross, rate);
    const vat = roundMoney2(gross - net);
    expect(net).toBe(12.5);
    expect(vat).toBe(2.5);
    expect(netToGrossAmount(net, rate)).toBe(15);
  });

  it("gross 15 @ 0% -> net 15, vat 0", () => {
    expect(grossToNetAmount(15, 0)).toBe(15);
    expect(roundMoney2(15 - grossToNetAmount(15, 0))).toBe(0);
  });
});

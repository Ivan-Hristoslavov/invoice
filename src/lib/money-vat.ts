/** 2-decimal rounding for currency amounts */
export function roundMoney2(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100) / 100;
}

/** Gross amount including VAT → net (excl. VAT) */
export function grossToNetAmount(gross: number, taxRatePercent: number): number {
  if (!Number.isFinite(gross) || gross < 0) return 0;
  if (taxRatePercent <= 0) return roundMoney2(gross);
  return roundMoney2(gross / (1 + taxRatePercent / 100));
}

/** Net (excl. VAT) → gross including VAT */
export function netToGrossAmount(net: number, taxRatePercent: number): number {
  if (!Number.isFinite(net) || net < 0) return 0;
  if (taxRatePercent <= 0) return roundMoney2(net);
  return roundMoney2(net * (1 + taxRatePercent / 100));
}

/** First sequence value to assign when no global sequence row exists yet. */
export function computeBootstrapNextSequence(params: {
  maxSequentialFromInvoices: number;
  maxLegacySequenceCounter: number;
  startingInvoiceNumber: number | null | undefined;
}): number {
  const migrationStart =
    params.startingInvoiceNumber != null && Number.isFinite(params.startingInvoiceNumber)
      ? Math.max(1, Math.floor(Number(params.startingInvoiceNumber)))
      : 1;
  const usedMax = Math.max(params.maxSequentialFromInvoices, params.maxLegacySequenceCounter);
  return Math.max(usedMax + 1, migrationStart);
}

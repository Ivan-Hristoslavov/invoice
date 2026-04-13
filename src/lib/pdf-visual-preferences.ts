export type PdfVisualPrefs = {
  showCompanyLogo: boolean;
  showAmountInWords: boolean;
};

/** Defaults when user prefs are missing or not loaded (matches previous behavior). */
export const DEFAULT_PDF_VISUAL_PREFS: PdfVisualPrefs = {
  showCompanyLogo: true,
  showAmountInWords: true,
};

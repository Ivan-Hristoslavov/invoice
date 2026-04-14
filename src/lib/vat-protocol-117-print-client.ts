/**
 * Client-only: open protocol PDF inline and trigger the browser print dialog.
 * Call only from a click handler (user gesture).
 * @returns false if popup was blocked
 */
export function printVatProtocol117Pdf(protocolId: string): boolean {
  const url = `/api/vat-protocols-117/${encodeURIComponent(protocolId)}/export-pdf?disposition=inline`;
  const printWindow = window.open(url, "_blank");
  if (!printWindow) {
    return false;
  }
  printWindow.opener = null;
  window.setTimeout(() => {
    try {
      printWindow.focus();
      printWindow.print();
    } catch {
      /* PDF viewer may still be loading; user can print from the tab (e.g. Ctrl+P). */
    }
  }, 1000);
  return true;
}

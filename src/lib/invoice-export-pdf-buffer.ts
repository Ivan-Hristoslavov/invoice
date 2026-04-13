import "server-only";

/**
 * Generates invoice PDF bytes on the server (email attachments, internal jobs).
 * Kept separate from `@/lib/invoice-export` so client bundles never pull `pdf-generator` / `server-only` deps.
 */
export async function exportInvoicePdfBuffer(
  invoiceId: string,
  invoiceData?: any
): Promise<{ buffer: Buffer; filename: string }> {
  if (invoiceData) {
    if (typeof window !== "undefined") {
      throw new Error("exportInvoicePdfBuffer with invoiceData can only be called server-side");
    }

    const pdfGeneratorModule = await import("./pdf-generator");
    const buffer = await pdfGeneratorModule.generateInvoicePdfServer(invoiceData);
    const invoiceNumber = (invoiceData.invoiceNumber || invoiceId || "invoice").replace(
      /[^a-zA-Z0-9-_]/g,
      "_"
    );
    const filename = `Invoice-${invoiceNumber}.pdf`;
    return { buffer, filename };
  }

  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL;
    if (!baseUrl) {
      throw new Error("NEXT_PUBLIC_APP_URL (or VERCEL_URL) is required for exportInvoicePdfBuffer without invoiceData");
    }
    const origin = baseUrl.startsWith("http") ? baseUrl : `https://${baseUrl}`;
    const response = await fetch(`${origin}/api/invoices/export-pdf?invoiceId=${invoiceId}`);

    if (!response.ok) {
      throw new Error("Грешка при експортирането на фактурата като PDF");
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const contentDisposition = response.headers.get("Content-Disposition");
    let filename = `Faktura-${invoiceId}.pdf`;

    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
      if (filenameMatch && filenameMatch[1]) {
        filename = filenameMatch[1].replace(/['"]/g, "");
      }
    }

    return { buffer, filename };
  } catch {
    throw new Error("Грешка при експортирането на фактурата като PDF");
  }
}

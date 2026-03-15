/**
 * Service for handling document operations
 */

type Document = {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  invoiceId: string;
  userId: string;
  createdAt: string;
};

/**
 * Get all documents for an invoice
 */
export async function getDocuments(invoiceId: string): Promise<Document[]> {
  try {
    const response = await fetch(`/api/invoices/${invoiceId}/documents`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to fetch documents");
    }
    
    const data = await response.json();
    return data.documents;
  } catch (error) {
    console.error("Error fetching documents:", error);
    throw error;
  }
}

/**
 * Upload a document for an invoice to storage (images bucket).
 * Allowed: PDF, JPEG, PNG, WebP, GIF. Max size per file is enforced by the API.
 */
export async function uploadDocument(
  invoiceId: string,
  file: File
): Promise<Document> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`/api/invoices/${invoiceId}/documents`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || "Failed to upload document");
  }

  const data = await response.json();
  return data.document;
}

/**
 * Delete a document
 */
export async function deleteDocument(
  invoiceId: string,
  documentId: string
): Promise<void> {
  try {
    const response = await fetch(
      `/api/invoices/${invoiceId}/documents?documentId=${documentId}`,
      {
        method: "DELETE",
      }
    );
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to delete document");
    }
  } catch (error) {
    console.error("Error deleting document:", error);
    throw error;
  }
} 
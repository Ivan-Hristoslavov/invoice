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
 * Upload a document for an invoice
 * In a real application, this would handle file uploads to a storage service
 * For this example, we're just storing metadata
 */
export async function uploadDocument(
  invoiceId: string,
  file: File
): Promise<Document> {
  try {
    // In a real application, you would upload the file to a storage service
    // and get back a URL. For this example, we're using a local URL.
    const url = URL.createObjectURL(file);
    
    const response = await fetch(`/api/invoices/${invoiceId}/documents`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: file.name,
        size: file.size,
        type: file.type,
        url,
      }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to upload document");
    }
    
    const data = await response.json();
    return data.document;
  } catch (error) {
    console.error("Error uploading document:", error);
    throw error;
  }
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
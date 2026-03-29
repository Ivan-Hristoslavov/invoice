# Document Management for Invoices

The Document Management feature allows users to attach and manage documents related to their invoices, such as receipts, contracts, and any other relevant files.

## Features

- Attach multiple files to any invoice
- View a list of all documents attached to an invoice
- Download attached documents
- Delete documents when they are no longer needed
- Support for various file types (PDFs, images, etc.)

## How It Works

Documents are accessible through a dedicated tab in the invoice detail page. Users can:

1. Upload files by clicking the "Attach Files" button
2. View all attached documents with details like file name, size, and date added
3. Download files by clicking the download icon
4. Delete files by clicking the delete icon

## Implementation Details

### Database Schema

Documents are stored in the `Document` table with the following structure:

```sql
CREATE TABLE "Document" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "size" INTEGER NOT NULL,
  "type" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "invoiceId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);
```

### API Endpoints

The following API endpoints are available for document management:

- `GET /api/invoices/[id]/documents` - Get all documents for an invoice
- `POST /api/invoices/[id]/documents` - Upload a new document
- `DELETE /api/invoices/[id]/documents?documentId=[documentId]` - Delete a document

### Frontend Components

- `DocumentsTab.tsx` - Main component for the documents tab in the invoice detail page
- Service functions in `document-service.ts` for API interactions

## Future Enhancements

- Add file validation for security (size limits, allowed file types)
- Implement proper cloud storage integration (AWS S3, Google Cloud Storage, etc.)
- Add document preview functionality for common file types
- Enable document sharing with clients
- Add document categories and tagging
- Implement document search functionality 
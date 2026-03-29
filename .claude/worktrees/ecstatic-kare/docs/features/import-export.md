# Import and Export Functionality

This document describes the import and export functionality for invoices, clients, and products in the InvoiceNinja application.

## Import Features

### Bulk Invoice Import

The application supports importing multiple invoices at once from a CSV file. This feature allows users to:

1. **Upload a CSV file** containing invoice data
2. **Validate the data** against our schema to ensure accuracy
3. **Create multiple invoices** in a single operation
4. **Track success and failures** of individual invoice imports

#### CSV Format Requirements

The CSV file for invoice imports must include the following required fields:

- `invoiceNumber` - A unique identifier for the invoice
- `clientId` - The ID of an existing client in the system
- `companyId` - The ID of an existing company in the system
- `issueDate` - The date the invoice was issued (YYYY-MM-DD format)
- `dueDate` - The payment due date (YYYY-MM-DD format)
- `item_1_description` - Description of the first item
- `item_1_quantity` - Quantity of the first item
- `item_1_unitPrice` - Unit price of the first item

Optional fields include:

- `status` - Invoice status (DRAFT, UNPAID, PAID, OVERDUE, CANCELLED)
- `currency` - Currency code (USD, EUR, etc.)
- `notes` - Additional notes
- `termsAndConditions` - Terms and conditions
- `item_1_taxRate` - Tax rate for the first item
- `item_1_productId` - ID of a product if applicable

For multiple items, the naming pattern continues with incrementing numbers:
- `item_2_description`, `item_2_quantity`, etc.

### Client and Product Import

The system also allows for importing clients and products from CSV files with similar validation logic.

## Export Features

### Export Formats

The application supports exporting invoices in the following formats:

1. **CSV (Excel)** - For data processing and analysis
2. **PDF** - For printing and professional sharing with clients

### Export Options

When exporting, users can filter the data by:

- **Company** - Export invoices for a specific company
- **Client** - Export invoices for a specific client
- **Status** - Export invoices of a particular status (DRAFT, UNPAID, PAID, etc.)
- **Date Range** - Export invoices within a specific date range

### Export Process

The export process is handled in a few steps:

1. **User selects export options** via the Export Dialog
2. **Server generates the export file** based on selected criteria
3. **File is downloaded** to the user's device

## Implementation Details

### API Endpoints

- **POST /api/invoices/bulk-import** - Handles the import of multiple invoices
- **GET /api/invoices/export** - Handles CSV exports with filtering options
- **GET /api/invoices/export-pdf** - Handles PDF exports of single invoices

### Libraries Used

- **PapaParse** - For CSV parsing and generation
- **SWR** - For data fetching with caching and revalidation
- **date-fns** - For date handling and formatting

### Security Considerations

- All import and export operations require authentication
- Input validation ensures data integrity and prevents injection attacks
- Role-based permissions control who can import and export data (requires 'invoice:create' permission)

## Future Enhancements

Planned enhancements to the import/export functionality include:

1. **Template-based exports** - Allow users to design and save export templates
2. **Scheduled exports** - Automatically generate and email exports on a schedule
3. **Advanced filtering** - More granular filtering options for exports
4. **Bulk import of payments** - Support for importing payment records in bulk
5. **Real PDF generation** - Replace the mock PDF implementation with actual PDF generation 
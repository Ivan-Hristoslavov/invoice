-- Migration: Add startingInvoiceNumber field to User table and update invoice number unique constraint
-- This allows users migrating from other apps to set their starting invoice number
-- Invoice numbers are now per-user (not per-company) and use 10-digit format (0000000001, 0000000002, etc.)

-- Add startingInvoiceNumber column to User table if it doesn't exist
ALTER TABLE "User" 
ADD COLUMN IF NOT EXISTS "startingInvoiceNumber" INTEGER;

-- Add comment to explain the field
COMMENT ON COLUMN "User"."startingInvoiceNumber" IS 'Starting invoice number for migration from other apps (e.g., 1 for 0000000001). Invoice numbers are 10 digits starting from this number.';

-- Update unique constraint: Invoice numbers are now per-user (not per-company)
-- First, drop the old constraint if it exists
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'Invoice_invoiceNumber_companyId_key'
    ) THEN
        ALTER TABLE "Invoice" 
        DROP CONSTRAINT "Invoice_invoiceNumber_companyId_key";
    END IF;
END $$;

-- Create new unique constraint: invoiceNumber per userId
CREATE UNIQUE INDEX IF NOT EXISTS "Invoice_invoiceNumber_userId_key" 
ON "Invoice"("invoiceNumber", "userId");

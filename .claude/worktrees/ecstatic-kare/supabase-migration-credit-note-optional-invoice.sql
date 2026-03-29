-- Migration: Make invoiceId optional in CreditNote table
-- This allows creating credit notes manually (not just from canceling invoices)

-- Make invoiceId nullable
ALTER TABLE "CreditNote" 
ALTER COLUMN "invoiceId" DROP NOT NULL;

-- Drop the unique constraint on invoiceId (since it can now be null and multiple credit notes can have null)
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'CreditNote_invoiceId_key'
    ) THEN
        ALTER TABLE "CreditNote" 
        DROP CONSTRAINT "CreditNote_invoiceId_key";
    END IF;
END $$;

-- Create a partial unique index: invoiceId must be unique only when it's not null
CREATE UNIQUE INDEX IF NOT EXISTS "CreditNote_invoiceId_unique_when_not_null" 
ON "CreditNote"("invoiceId") 
WHERE "invoiceId" IS NOT NULL;

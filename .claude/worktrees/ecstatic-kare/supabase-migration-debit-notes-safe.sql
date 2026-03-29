-- Migration: Add DebitNote and DebitNoteItem tables (SAFE VERSION)
-- This migration adds support for debit notes (used when replacing products but customer needs to pay more)
-- 
-- This is a safe version that checks for existing objects before creating them.
-- Run this migration independently - it does NOT create types or enums.

-- CreateTable: DebitNote (only if it doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'DebitNote') THEN
        CREATE TABLE "DebitNote" (
            "id" TEXT NOT NULL,
            "debitNoteNumber" TEXT NOT NULL,
            "invoiceId" TEXT,
            "companyId" TEXT NOT NULL,
            "clientId" TEXT NOT NULL,
            "userId" TEXT NOT NULL,
            "issueDate" TIMESTAMP(3) NOT NULL,
            "reason" TEXT,
            "subtotal" DECIMAL(10,2) NOT NULL,
            "taxAmount" DECIMAL(10,2) NOT NULL,
            "total" DECIMAL(10,2) NOT NULL,
            "currency" TEXT NOT NULL DEFAULT 'EUR',
            "notes" TEXT,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL,

            CONSTRAINT "DebitNote_pkey" PRIMARY KEY ("id")
        );
    END IF;
END $$;

-- CreateTable: DebitNoteItem (only if it doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'DebitNoteItem') THEN
        CREATE TABLE "DebitNoteItem" (
            "id" TEXT NOT NULL,
            "debitNoteId" TEXT NOT NULL,
            "description" TEXT NOT NULL,
            "quantity" DECIMAL(10,2) NOT NULL,
            "unitPrice" DECIMAL(10,2) NOT NULL,
            "taxRate" DECIMAL(5,2) NOT NULL DEFAULT 0,
            "subtotal" DECIMAL(10,2) NOT NULL,
            "taxAmount" DECIMAL(10,2) NOT NULL,
            "total" DECIMAL(10,2) NOT NULL,

            CONSTRAINT "DebitNoteItem_pkey" PRIMARY KEY ("id")
        );
    END IF;
END $$;

-- CreateIndex: Unique constraint on debitNoteNumber (only if it doesn't exist)
CREATE UNIQUE INDEX IF NOT EXISTS "DebitNote_debitNoteNumber_key" ON "DebitNote"("debitNoteNumber");

-- CreateIndex: Unique constraint on debitNoteNumber and companyId (only if it doesn't exist)
CREATE UNIQUE INDEX IF NOT EXISTS "DebitNote_debitNoteNumber_companyId_key" ON "DebitNote"("debitNoteNumber", "companyId");

-- AddForeignKey: DebitNote -> Invoice (optional)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'DebitNote_invoiceId_fkey'
    ) THEN
        ALTER TABLE "DebitNote" 
        ADD CONSTRAINT "DebitNote_invoiceId_fkey" 
        FOREIGN KEY ("invoiceId") 
        REFERENCES "Invoice"("id") 
        ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey: DebitNote -> Company
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'DebitNote_companyId_fkey'
    ) THEN
        ALTER TABLE "DebitNote" 
        ADD CONSTRAINT "DebitNote_companyId_fkey" 
        FOREIGN KEY ("companyId") 
        REFERENCES "Company"("id") 
        ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey: DebitNote -> Client
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'DebitNote_clientId_fkey'
    ) THEN
        ALTER TABLE "DebitNote" 
        ADD CONSTRAINT "DebitNote_clientId_fkey" 
        FOREIGN KEY ("clientId") 
        REFERENCES "Client"("id") 
        ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey: DebitNote -> User
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'DebitNote_userId_fkey'
    ) THEN
        ALTER TABLE "DebitNote" 
        ADD CONSTRAINT "DebitNote_userId_fkey" 
        FOREIGN KEY ("userId") 
        REFERENCES "User"("id") 
        ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey: DebitNoteItem -> DebitNote
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'DebitNoteItem_debitNoteId_fkey'
    ) THEN
        ALTER TABLE "DebitNoteItem" 
        ADD CONSTRAINT "DebitNoteItem_debitNoteId_fkey" 
        FOREIGN KEY ("debitNoteId") 
        REFERENCES "DebitNote"("id") 
        ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

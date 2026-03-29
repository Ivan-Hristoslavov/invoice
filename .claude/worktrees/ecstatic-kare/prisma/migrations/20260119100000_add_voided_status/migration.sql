-- Add VOIDED status to InvoiceStatus enum
-- This allows marking draft invoices as voided (cancelled before issuing)

ALTER TYPE "InvoiceStatus" ADD VALUE IF NOT EXISTS 'VOIDED';

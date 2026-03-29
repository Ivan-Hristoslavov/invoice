-- AlterTable: add reverseCharge flag to Invoice for НАП reverse-charge VAT compliance
ALTER TABLE "Invoice" ADD COLUMN "reverseCharge" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable: add vatExemptReason to InvoiceItem for НАП VAT-exempt article citation
ALTER TABLE "InvoiceItem" ADD COLUMN "vatExemptReason" TEXT;

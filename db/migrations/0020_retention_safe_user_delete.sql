-- Retention-safe user deletion for Bulgarian Accounting Act (ZSch chl. 12, al. 1):
-- issued invoices and accompanying documents must be retained 10 years even after
-- the creator deletes their account. We do this by relaxing the ON DELETE CASCADE
-- rules on accounting documents to SET NULL, and by anonymizing User rows
-- instead of hard-deleting them.

-- Add soft-delete marker + anonymization flag on User.
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "anonymizedAt" TIMESTAMP(3);

-- Invoice: relax userId FK from CASCADE to SET NULL to preserve history.
ALTER TABLE "Invoice" ALTER COLUMN "userId" DROP NOT NULL;
ALTER TABLE "Invoice" DROP CONSTRAINT IF EXISTS "Invoice_userId_fkey";
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- CreditNote: same retention requirement.
ALTER TABLE "CreditNote" ALTER COLUMN "userId" DROP NOT NULL;
ALTER TABLE "CreditNote" DROP CONSTRAINT IF EXISTS "CreditNote_userId_fkey";
ALTER TABLE "CreditNote" ADD CONSTRAINT "CreditNote_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- DebitNote: same retention requirement.
ALTER TABLE "DebitNote" ALTER COLUMN "userId" DROP NOT NULL;
ALTER TABLE "DebitNote" DROP CONSTRAINT IF EXISTS "DebitNote_userId_fkey";
ALTER TABLE "DebitNote" ADD CONSTRAINT "DebitNote_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- VatProtocol117: protokoli po chl. 117 are tax documents with same retention.
ALTER TABLE "VatProtocol117" ALTER COLUMN "userId" DROP NOT NULL;
ALTER TABLE "VatProtocol117" DROP CONSTRAINT IF EXISTS "VatProtocol117_userId_fkey";
ALTER TABLE "VatProtocol117" ADD CONSTRAINT "VatProtocol117_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- Companies are linked to invoices by FK, so they must also survive user delete.
-- Keep cascade on Company but mark userId nullable so anonymized users do not
-- trigger orphan cleanup. Existing cascade from Company -> Invoice is fine; we
-- only relax User -> Company.
ALTER TABLE "Company" ALTER COLUMN "userId" DROP NOT NULL;
ALTER TABLE "Company" DROP CONSTRAINT IF EXISTS "Company_userId_fkey";
ALTER TABLE "Company" ADD CONSTRAINT "Company_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- Clients too (referenced from historical invoices by FK with snapshot fallback).
ALTER TABLE "Client" ALTER COLUMN "userId" DROP NOT NULL;
ALTER TABLE "Client" DROP CONSTRAINT IF EXISTS "Client_userId_fkey";
ALTER TABLE "Client" ADD CONSTRAINT "Client_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

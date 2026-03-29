ALTER TABLE "Invoice"
  ADD COLUMN IF NOT EXISTS "sellerSnapshot" jsonb,
  ADD COLUMN IF NOT EXISTS "buyerSnapshot" jsonb,
  ADD COLUMN IF NOT EXISTS "itemsSnapshot" jsonb;

ALTER TABLE "CreditNote"
  ADD COLUMN IF NOT EXISTS "sellerSnapshot" jsonb,
  ADD COLUMN IF NOT EXISTS "buyerSnapshot" jsonb,
  ADD COLUMN IF NOT EXISTS "itemsSnapshot" jsonb;

ALTER TABLE "DebitNote"
  ADD COLUMN IF NOT EXISTS "sellerSnapshot" jsonb,
  ADD COLUMN IF NOT EXISTS "buyerSnapshot" jsonb,
  ADD COLUMN IF NOT EXISTS "itemsSnapshot" jsonb;

ALTER TABLE "InvoiceItem"
  ADD COLUMN IF NOT EXISTS "unit" text DEFAULT 'бр.';

ALTER TABLE "CreditNoteItem"
  ADD COLUMN IF NOT EXISTS "unit" text DEFAULT 'бр.';

ALTER TABLE "DebitNoteItem"
  ADD COLUMN IF NOT EXISTS "unit" text DEFAULT 'бр.';

ALTER TABLE "InvoiceSequence"
  ADD COLUMN IF NOT EXISTS "userId" text;

UPDATE "InvoiceSequence" sequenceTable
SET "userId" = companyTable."userId"
FROM "Company" companyTable
WHERE sequenceTable."companyId" = companyTable."id"
  AND sequenceTable."userId" IS NULL;

ALTER TABLE "InvoiceSequence"
  ALTER COLUMN "userId" SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'InvoiceSequence_userId_fkey'
  ) THEN
    ALTER TABLE "InvoiceSequence"
      ADD CONSTRAINT "InvoiceSequence_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "InvoiceSequence_userId_idx"
  ON "InvoiceSequence" ("userId");

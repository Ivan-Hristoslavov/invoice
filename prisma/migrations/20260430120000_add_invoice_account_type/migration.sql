-- Add missing accountType field used by invoice reports filters.
ALTER TABLE "public"."Invoice"
ADD COLUMN IF NOT EXISTS "accountType" TEXT;

-- Match Prisma schema index for faster account type filtering.
CREATE INDEX IF NOT EXISTS "Invoice_accountType_idx" ON "public"."Invoice"("accountType");

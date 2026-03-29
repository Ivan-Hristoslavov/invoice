-- Ensure one company per BULSTAT/ЕИК across the platform to prevent multiple accounts with the same company.
-- Only applies to non-empty bulstatNumber; companies without BULSTAT are unaffected.

-- Normalize existing empty strings to NULL so the unique index applies only to real values (optional)
-- UPDATE "Company" SET "bulstatNumber" = NULL WHERE trim("bulstatNumber") = '';

-- Unique partial index: no two companies can have the same non-null, non-empty BULSTAT
CREATE UNIQUE INDEX IF NOT EXISTS "Company_bulstatNumber_unique"
  ON "Company" (trim("bulstatNumber"))
  WHERE "bulstatNumber" IS NOT NULL AND trim("bulstatNumber") != '';

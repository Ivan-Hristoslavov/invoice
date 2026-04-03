-- Drop unused NAP credential columns from Company table.
-- These fields were never populated via UI or API and storing
-- portal credentials in the application DB is a security risk.
ALTER TABLE "Company" DROP COLUMN IF EXISTS "napUserName";
ALTER TABLE "Company" DROP COLUMN IF EXISTS "napPassword";

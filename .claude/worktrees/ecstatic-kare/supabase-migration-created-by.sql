-- Migration: createdById + User profile fields only
-- Run this file to add these changes (no need to run the full supabase-schema.sql for this).
-- For a new DB: run supabase-schema.sql first, then this file. For existing DB: run only this file.
-- Idempotent: safe to run multiple times (columns/constraints/indexes created only if missing).
--
-- Adds:
--   Invoice.createdById, Client.createdById (who created the record)
--   User.phone, User.profileCompletedAt (profile setup after invite)
-- Backfills existing Invoice/Client rows with createdById = userId.

-- Invoice: who created the record
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'Invoice' AND column_name = 'createdById'
  ) THEN
    ALTER TABLE "Invoice" ADD COLUMN "createdById" TEXT;
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Invoice_createdById_fkey') THEN
    ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_createdById_fkey"
      FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS "Invoice_createdById_idx" ON "Invoice"("createdById");

-- Client: who created the record
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'Client' AND column_name = 'createdById'
  ) THEN
    ALTER TABLE "Client" ADD COLUMN "createdById" TEXT;
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Client_createdById_fkey') THEN
    ALTER TABLE "Client" ADD CONSTRAINT "Client_createdById_fkey"
      FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS "Client_createdById_idx" ON "Client"("createdById");

-- Backfill: assume owner created existing records
UPDATE "Invoice" SET "createdById" = "userId" WHERE "createdById" IS NULL;
UPDATE "Client" SET "createdById" = "userId" WHERE "createdById" IS NULL;

-- User: phone and profile completion
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'User' AND column_name = 'phone'
  ) THEN
    ALTER TABLE "User" ADD COLUMN "phone" TEXT;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'User' AND column_name = 'profileCompletedAt'
  ) THEN
    ALTER TABLE "User" ADD COLUMN "profileCompletedAt" TIMESTAMP(3);
  END IF;
END $$;

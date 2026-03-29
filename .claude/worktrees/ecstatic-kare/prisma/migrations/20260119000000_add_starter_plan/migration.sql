-- Migration: Add STARTER plan to SubscriptionPlan enum
-- Run this SQL directly on your PostgreSQL database

-- Check current enum values first (optional, for debugging):
-- SELECT enum_range(NULL::"SubscriptionPlan");

-- If your database currently has BASIC/PRO/VIP enum values,
-- use this transaction to migrate to FREE/STARTER/PRO/BUSINESS:

BEGIN;

-- Create new enum type with correct values
CREATE TYPE "SubscriptionPlan_new" AS ENUM ('FREE', 'STARTER', 'PRO', 'BUSINESS');

-- Update the Subscription table column to use the new type
-- This maps old values to new ones:
-- BASIC -> FREE
-- PRO -> PRO (unchanged)
-- VIP -> BUSINESS
ALTER TABLE "Subscription" 
  ALTER COLUMN "plan" TYPE "SubscriptionPlan_new" 
  USING (
    CASE plan::text
      WHEN 'BASIC' THEN 'FREE'::"SubscriptionPlan_new"
      WHEN 'PRO' THEN 'PRO'::"SubscriptionPlan_new"
      WHEN 'VIP' THEN 'BUSINESS'::"SubscriptionPlan_new"
      WHEN 'FREE' THEN 'FREE'::"SubscriptionPlan_new"
      WHEN 'STARTER' THEN 'STARTER'::"SubscriptionPlan_new"
      WHEN 'BUSINESS' THEN 'BUSINESS'::"SubscriptionPlan_new"
      ELSE 'FREE'::"SubscriptionPlan_new"
    END
  );

-- Drop the old enum type
DROP TYPE "SubscriptionPlan";

-- Rename the new enum type to the original name
ALTER TYPE "SubscriptionPlan_new" RENAME TO "SubscriptionPlan";

COMMIT;

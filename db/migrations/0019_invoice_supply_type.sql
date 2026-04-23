-- AlterTable: add supplyType to Invoice for ZDDS/VAT scenario classification
-- Valid values (enforced by application Zod schema, stored as TEXT for flexibility):
--   DOMESTIC                  - obichaina B2B/B2C v BG (chl. 113, al. 1 ZDDS)
--   REVERSE_CHARGE_DOMESTIC   - obratno nachislyavane v BG (chl. 82, al. 2-5 ZDDS)
--   INTRA_COMMUNITY           - vatreobshtnostna dostavka (chl. 53, al. 1 ZDDS)
--   EXPORT                    - iznos izvan ES (chl. 28 ZDDS)
--   NOT_VAT_REGISTERED        - litseto ne e registrirano po ZDDS (chl. 113, al. 9 ZDDS)
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "supplyType" TEXT NOT NULL DEFAULT 'DOMESTIC';

-- Index for reporting and filtering by supply type
CREATE INDEX IF NOT EXISTS "Invoice_userId_supplyType_idx" ON "Invoice"("userId", "supplyType");

-- Optional snapshot for goods recipient (person receiving goods), separate from buyer MOL.
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "goodsRecipientSnapshot" jsonb;

-- Proforma invoice core tables
CREATE TABLE IF NOT EXISTS "public"."ProformaInvoice" (
  "id" TEXT NOT NULL,
  "proformaNumber" TEXT NOT NULL,
  "clientId" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "userId" TEXT,
  "issueDate" TIMESTAMP(3) NOT NULL,
  "dueDate" TIMESTAMP(3),
  "status" TEXT NOT NULL DEFAULT 'DRAFT',
  "subtotal" DECIMAL(10,2) NOT NULL,
  "taxAmount" DECIMAL(10,2) NOT NULL,
  "total" DECIMAL(10,2) NOT NULL,
  "notes" TEXT,
  "currency" TEXT NOT NULL DEFAULT 'EUR',
  "paymentMethod" TEXT,
  "accountType" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "sellerSnapshot" JSONB,
  "buyerSnapshot" JSONB,
  "itemsSnapshot" JSONB,
  "createdById" TEXT,
  CONSTRAINT "ProformaInvoice_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "public"."ProformaInvoiceItem" (
  "id" TEXT NOT NULL,
  "proformaInvoiceId" TEXT NOT NULL,
  "productId" TEXT,
  "description" TEXT NOT NULL,
  "quantity" DECIMAL(10,2) NOT NULL,
  "unitPrice" DECIMAL(10,2) NOT NULL,
  "taxRate" DECIMAL(5,2) NOT NULL DEFAULT 0,
  "subtotal" DECIMAL(10,2) NOT NULL,
  "taxAmount" DECIMAL(10,2) NOT NULL,
  "total" DECIMAL(10,2) NOT NULL,
  "unit" TEXT DEFAULT 'бр.',
  CONSTRAINT "ProformaInvoiceItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "public"."ProformaSequence" (
  "id" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "year" INTEGER NOT NULL,
  "sequence" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "userId" TEXT NOT NULL,
  CONSTRAINT "ProformaSequence_pkey" PRIMARY KEY ("id")
);

-- Constraints
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ProformaInvoice_clientId_fkey'
  ) THEN
    ALTER TABLE "public"."ProformaInvoice"
      ADD CONSTRAINT "ProformaInvoice_clientId_fkey"
      FOREIGN KEY ("clientId") REFERENCES "public"."Client"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ProformaInvoice_companyId_fkey'
  ) THEN
    ALTER TABLE "public"."ProformaInvoice"
      ADD CONSTRAINT "ProformaInvoice_companyId_fkey"
      FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ProformaInvoice_userId_fkey'
  ) THEN
    ALTER TABLE "public"."ProformaInvoice"
      ADD CONSTRAINT "ProformaInvoice_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "public"."User"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ProformaInvoiceItem_proformaInvoiceId_fkey'
  ) THEN
    ALTER TABLE "public"."ProformaInvoiceItem"
      ADD CONSTRAINT "ProformaInvoiceItem_proformaInvoiceId_fkey"
      FOREIGN KEY ("proformaInvoiceId") REFERENCES "public"."ProformaInvoice"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ProformaInvoiceItem_productId_fkey'
  ) THEN
    ALTER TABLE "public"."ProformaInvoiceItem"
      ADD CONSTRAINT "ProformaInvoiceItem_productId_fkey"
      FOREIGN KEY ("productId") REFERENCES "public"."Product"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ProformaSequence_companyId_fkey'
  ) THEN
    ALTER TABLE "public"."ProformaSequence"
      ADD CONSTRAINT "ProformaSequence_companyId_fkey"
      FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ProformaSequence_userId_fkey'
  ) THEN
    ALTER TABLE "public"."ProformaSequence"
      ADD CONSTRAINT "ProformaSequence_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "public"."User"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION;
  END IF;
END $$;

-- Unique indexes
CREATE UNIQUE INDEX IF NOT EXISTS "ProformaInvoice_proformaNumber_companyId_key"
  ON "public"."ProformaInvoice"("proformaNumber", "companyId");
CREATE UNIQUE INDEX IF NOT EXISTS "ProformaSequence_companyId_year_key"
  ON "public"."ProformaSequence"("companyId", "year");

-- Supporting indexes
CREATE INDEX IF NOT EXISTS "ProformaInvoice_userId_issueDate_idx"
  ON "public"."ProformaInvoice"("userId", "issueDate" DESC);
CREATE INDEX IF NOT EXISTS "ProformaInvoice_clientId_idx"
  ON "public"."ProformaInvoice"("clientId");
CREATE INDEX IF NOT EXISTS "ProformaInvoice_companyId_idx"
  ON "public"."ProformaInvoice"("companyId");
CREATE INDEX IF NOT EXISTS "ProformaInvoice_paymentMethod_idx"
  ON "public"."ProformaInvoice"("paymentMethod");
CREATE INDEX IF NOT EXISTS "ProformaInvoice_accountType_idx"
  ON "public"."ProformaInvoice"("accountType");
CREATE INDEX IF NOT EXISTS "ProformaInvoiceItem_proformaInvoiceId_idx"
  ON "public"."ProformaInvoiceItem"("proformaInvoiceId");
CREATE INDEX IF NOT EXISTS "ProformaInvoiceItem_productId_idx"
  ON "public"."ProformaInvoiceItem"("productId");
CREATE INDEX IF NOT EXISTS "ProformaSequence_userId_companyId_year_idx"
  ON "public"."ProformaSequence"("userId", "companyId", "year");

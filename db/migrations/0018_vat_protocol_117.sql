-- VatProtocol117: протокол по чл. 117 от ЗДДС
CREATE TABLE IF NOT EXISTS "VatProtocol117" (
    "id" TEXT NOT NULL,
    "protocolNumber" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "issueDate" TIMESTAMP(3) NOT NULL,
    "taxEventDate" TIMESTAMP(3) NOT NULL,
    "scenario" TEXT NOT NULL,
    "supplierInvoiceNumber" TEXT,
    "supplierInvoiceDate" TIMESTAMP(3),
    "placeOfIssue" TEXT,
    "legalBasisNote" TEXT,
    "subtotal" DECIMAL(10,2) NOT NULL,
    "taxAmount" DECIMAL(10,2) NOT NULL,
    "total" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "notes" TEXT,
    "sellerSnapshot" JSONB,
    "buyerSnapshot" JSONB,
    "itemsSnapshot" JSONB,
    "uniqueNapId" TEXT,
    "napStatus" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VatProtocol117_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "VatProtocol117_protocolNumber_key" ON "VatProtocol117"("protocolNumber");
CREATE UNIQUE INDEX IF NOT EXISTS "VatProtocol117_protocolNumber_companyId_key" ON "VatProtocol117"("protocolNumber", "companyId");
CREATE INDEX IF NOT EXISTS "VatProtocol117_userId_issueDate_idx" ON "VatProtocol117"("userId", "issueDate" DESC);

ALTER TABLE "VatProtocol117" DROP CONSTRAINT IF EXISTS "VatProtocol117_companyId_fkey";
ALTER TABLE "VatProtocol117" ADD CONSTRAINT "VatProtocol117_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "VatProtocol117" DROP CONSTRAINT IF EXISTS "VatProtocol117_clientId_fkey";
ALTER TABLE "VatProtocol117" ADD CONSTRAINT "VatProtocol117_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "VatProtocol117" DROP CONSTRAINT IF EXISTS "VatProtocol117_userId_fkey";
ALTER TABLE "VatProtocol117" ADD CONSTRAINT "VatProtocol117_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "VatProtocol117Item" (
    "id" TEXT NOT NULL,
    "vatProtocol117Id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" DECIMAL(10,2) NOT NULL,
    "unitPrice" DECIMAL(10,2) NOT NULL,
    "taxRate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "subtotal" DECIMAL(10,2) NOT NULL,
    "taxAmount" DECIMAL(10,2) NOT NULL,
    "total" DECIMAL(10,2) NOT NULL,
    "unit" TEXT DEFAULT 'бр.',

    CONSTRAINT "VatProtocol117Item_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "VatProtocol117Item_vatProtocol117Id_idx" ON "VatProtocol117Item"("vatProtocol117Id");

ALTER TABLE "VatProtocol117Item" DROP CONSTRAINT IF EXISTS "VatProtocol117Item_vatProtocol117Id_fkey";
ALTER TABLE "VatProtocol117Item" ADD CONSTRAINT "VatProtocol117Item_vatProtocol117Id_fkey" FOREIGN KEY ("vatProtocol117Id") REFERENCES "VatProtocol117"("id") ON DELETE CASCADE ON UPDATE CASCADE;

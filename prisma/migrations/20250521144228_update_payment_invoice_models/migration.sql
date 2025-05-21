-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "paidAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "refundedPaymentId" TEXT,
ADD COLUMN     "status" TEXT,
ADD COLUMN     "transactionId" TEXT;

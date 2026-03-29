-- AlterTable
ALTER TABLE "Client" ADD COLUMN     "taxComplianceSystem" TEXT DEFAULT 'general';

-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "taxComplianceSystem" TEXT DEFAULT 'general';

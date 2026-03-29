-- AlterTable
ALTER TABLE "Client" ADD COLUMN     "bulstatNumber" TEXT,
ADD COLUMN     "mол" TEXT,
ADD COLUMN     "uicType" TEXT DEFAULT 'BULSTAT',
ADD COLUMN     "vatRegistered" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "vatRegistrationNumber" TEXT;

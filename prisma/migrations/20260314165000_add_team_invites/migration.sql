-- CreateTable
CREATE TABLE IF NOT EXISTS "TeamInvite" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'VIEWER',
    "token" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "invitedByUserId" TEXT NOT NULL,
    "invitedUserId" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeamInvite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "TeamInvite_token_key" ON "TeamInvite"("token");
CREATE INDEX IF NOT EXISTS "TeamInvite_companyId_status_idx" ON "TeamInvite"("companyId", "status");
CREATE INDEX IF NOT EXISTS "TeamInvite_email_status_idx" ON "TeamInvite"("email", "status");

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'TeamInvite_companyId_fkey'
  ) THEN
    ALTER TABLE "TeamInvite"
      ADD CONSTRAINT "TeamInvite_companyId_fkey"
      FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'TeamInvite_invitedByUserId_fkey'
  ) THEN
    ALTER TABLE "TeamInvite"
      ADD CONSTRAINT "TeamInvite_invitedByUserId_fkey"
      FOREIGN KEY ("invitedByUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'TeamInvite_invitedUserId_fkey'
  ) THEN
    ALTER TABLE "TeamInvite"
      ADD CONSTRAINT "TeamInvite_invitedUserId_fkey"
      FOREIGN KEY ("invitedUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

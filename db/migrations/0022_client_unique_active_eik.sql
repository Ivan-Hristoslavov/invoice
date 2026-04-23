-- Enforce uniqueness of EIK/BULSTAT per user for active clients.
-- This migration is defensive:
--   1) Normalizes BULSTAT/EIK values by trimming surrounding spaces.
--   2) Resolves existing duplicates by keeping the newest row per
--      (userId, bulstatNumber) and nulling the rest.
--   3) Creates a partial unique index for non-empty values.

-- 1) Normalize values (trim only; API already stores normalized identifiers).
UPDATE "Client"
SET "bulstatNumber" = NULLIF(BTRIM("bulstatNumber"), '')
WHERE "bulstatNumber" IS NOT NULL;

-- 2) Deduplicate existing conflicts.
WITH ranked AS (
  SELECT
    c."id",
    ROW_NUMBER() OVER (
      PARTITION BY c."userId", c."bulstatNumber"
      ORDER BY c."updatedAt" DESC NULLS LAST, c."createdAt" DESC, c."id" DESC
    ) AS rn
  FROM "Client" c
  WHERE c."bulstatNumber" IS NOT NULL
)
UPDATE "Client" c
SET
  "bulstatNumber" = NULL,
  "updatedAt" = NOW()
FROM ranked r
WHERE c."id" = r."id"
  AND r.rn > 1;

-- 3) Enforce uniqueness going forward.
CREATE UNIQUE INDEX IF NOT EXISTS "Client_userId_bulstat_active_key"
  ON "Client" ("userId", "bulstatNumber")
  WHERE "bulstatNumber" IS NOT NULL AND length("bulstatNumber") > 0;

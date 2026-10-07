-- Brings the 20261005112800_init_hr baseline in line with the schema that the
-- live database was later `db push`-ed to:
--   1. Collapse the legacy roles into the canonical ADMIN / MANAGER / SUPERVISOR.
--   2. Add User.sessionVersion (server-side session revocation).
--   3. Replace the free-text employees.reportingManager with a real FK.

-- 1. Canonical roles ---------------------------------------------------------
ALTER TYPE "UserRole" RENAME TO "UserRole_old";
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'MANAGER', 'SUPERVISOR');

ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "users" ALTER COLUMN "role" TYPE "UserRole" USING (
  CASE "role"::text
    WHEN 'PROJECT_MANAGER' THEN 'MANAGER'
    WHEN 'STORE_MANAGER'   THEN 'SUPERVISOR'
    WHEN 'SITE_ENGINEER'   THEN 'SUPERVISOR'
    ELSE "role"::text
  END
)::"UserRole";
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'SUPERVISOR';

DROP TYPE "UserRole_old";

-- 2. Session revocation ------------------------------------------------------
ALTER TABLE "users" ADD COLUMN "sessionVersion" INTEGER NOT NULL DEFAULT 1;

-- 3. Reporting manager FK ----------------------------------------------------
ALTER TABLE "employees" ADD COLUMN "reportingManagerId" TEXT;

-- Carry over values that already reference an employee (by id or employee code);
-- free-text names cannot be resolved reliably and are dropped.
UPDATE "employees" e
SET "reportingManagerId" = m."id"
FROM "employees" m
WHERE e."reportingManager" IS NOT NULL
  AND m."id" <> e."id"
  AND (m."id" = e."reportingManager" OR m."employeeId" = e."reportingManager");

ALTER TABLE "employees" DROP COLUMN "reportingManager";

ALTER TABLE "employees" ADD CONSTRAINT "employees_reportingManagerId_fkey"
  FOREIGN KEY ("reportingManagerId") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

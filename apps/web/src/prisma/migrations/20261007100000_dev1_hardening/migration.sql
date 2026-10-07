-- AlterTable
ALTER TABLE "employee_certifications" ALTER COLUMN "issueDate" SET DATA TYPE DATE,
ALTER COLUMN "expiryDate" SET DATA TYPE DATE;

-- AlterTable
ALTER TABLE "employee_documents" ADD COLUMN     "fileSize" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "mimeType" TEXT,
ADD COLUMN     "storageKey" TEXT,
ADD COLUMN     "uploadedById" TEXT;

-- AlterTable
ALTER TABLE "venture_documents" ADD COLUMN     "storageKey" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "employee_certifications_employeeId_certification_certificat_key" ON "employee_certifications"("employeeId", "certification", "certificateNo");

-- CreateIndex
CREATE UNIQUE INDEX "employee_documents_storageKey_key" ON "employee_documents"("storageKey");

-- CreateIndex
CREATE UNIQUE INDEX "venture_documents_storageKey_key" ON "venture_documents"("storageKey");


-- Normalise legacy access levels to the allowlist the UI and API use.
UPDATE "employee_venture_assignments" SET "accessLevel" = 'FULL_ACCESS'    WHERE "accessLevel" = 'FULL_PROJECT_ACCESS';
UPDATE "employee_venture_assignments" SET "accessLevel" = 'OPERATIONS'     WHERE "accessLevel" = 'OPERATIONS_ACCESS';
UPDATE "employee_venture_assignments" SET "accessLevel" = 'MATERIALS_ONLY' WHERE "accessLevel" = 'MATERIAL_ACCESS';

-- Employee emails are compared case-insensitively; store them normalised.
UPDATE "employees" SET "email" = lower(trim("email")) WHERE "email" IS NOT NULL AND "email" <> lower(trim("email"));
UPDATE "employees" SET "email" = NULL WHERE "email" = '';
UPDATE "employees" SET "phone" = NULL WHERE trim("phone") = '';

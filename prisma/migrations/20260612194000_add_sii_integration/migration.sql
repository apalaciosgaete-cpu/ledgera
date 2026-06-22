-- AlterTable
ALTER TABLE "tax_documents" ADD COLUMN     "track_id" TEXT,
ADD COLUMN     "submission_status" TEXT;

-- CreateTable
CREATE TABLE "sii_credentials" (
    "id" TEXT NOT NULL,
    "environment" TEXT NOT NULL,
    "issuer_rut" TEXT NOT NULL,
    "certificate_name" TEXT NOT NULL,
    "certificate_path" TEXT,
    "certificate_expires" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sii_credentials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sii_cafs" (
    "id" TEXT NOT NULL,
    "document_type" TEXT NOT NULL,
    "folio_start" INTEGER NOT NULL,
    "folio_end" INTEGER NOT NULL,
    "current_folio" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sii_cafs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "sii_credentials_issuer_rut_idx" ON "sii_credentials"("issuer_rut");

-- CreateIndex
CREATE INDEX "sii_credentials_environment_idx" ON "sii_credentials"("environment");

-- CreateIndex
CREATE INDEX "sii_cafs_document_type_idx" ON "sii_cafs"("document_type");

-- CreateIndex
CREATE INDEX "sii_cafs_is_active_idx" ON "sii_cafs"("is_active");

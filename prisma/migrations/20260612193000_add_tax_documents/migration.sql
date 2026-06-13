-- CreateTable
CREATE TABLE "tax_documents" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "payment_id" TEXT,
    "subscription_id" TEXT,
    "document_type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "folio" TEXT,
    "external_track_id" TEXT,
    "issuer_rut" TEXT NOT NULL,
    "issuer_legal_name" TEXT NOT NULL,
    "issuer_business_activity" TEXT NOT NULL,
    "issuer_address" TEXT NOT NULL,
    "issuer_commune" TEXT NOT NULL,
    "issuer_city" TEXT NOT NULL,
    "receiver_rut" TEXT NOT NULL,
    "receiver_legal_name" TEXT NOT NULL,
    "receiver_business_activity" TEXT,
    "receiver_address" TEXT NOT NULL,
    "receiver_commune" TEXT NOT NULL,
    "receiver_city" TEXT NOT NULL,
    "receiver_dte_email" TEXT NOT NULL,
    "net_amount" INTEGER NOT NULL,
    "exempt_amount" INTEGER NOT NULL DEFAULT 0,
    "iva_amount" INTEGER NOT NULL,
    "total_amount" INTEGER NOT NULL,
    "iva_rate" DECIMAL(6,4) NOT NULL DEFAULT 0.19,
    "line_items_json" TEXT NOT NULL,
    "reference_json" TEXT,
    "xml_payload" TEXT,
    "pdf_url" TEXT,
    "external_response" TEXT,
    "rejection_reason" TEXT,
    "sent_at" TIMESTAMP(3),
    "accepted_at" TIMESTAMP(3),
    "rejected_at" TIMESTAMP(3),
    "voided_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tax_documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tax_documents_user_id_idx" ON "tax_documents"("user_id");

-- CreateIndex
CREATE INDEX "tax_documents_status_idx" ON "tax_documents"("status");

-- CreateIndex
CREATE INDEX "tax_documents_document_type_idx" ON "tax_documents"("document_type");

-- CreateIndex
CREATE INDEX "tax_documents_created_at_idx" ON "tax_documents"("created_at");

-- AddForeignKey
ALTER TABLE "tax_documents" ADD CONSTRAINT "tax_documents_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

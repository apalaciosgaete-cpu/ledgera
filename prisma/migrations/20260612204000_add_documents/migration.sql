-- CAPA 5.2.03 — Centro Documental

CREATE TABLE "documents" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "name" TEXT NOT NULL,
    "description" TEXT,
    "file_name" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "storage_key" TEXT NOT NULL,
    "checksum" TEXT,
    "tags" JSONB,
    "related_entity_type" TEXT,
    "related_entity_id" TEXT,
    "uploaded_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "documents_user_id_idx" ON "documents"("user_id");
CREATE INDEX "documents_category_idx" ON "documents"("category");
CREATE INDEX "documents_status_idx" ON "documents"("status");
CREATE INDEX "documents_type_idx" ON "documents"("type");
CREATE INDEX "documents_user_id_status_idx" ON "documents"("user_id", "status");
CREATE INDEX "documents_related_entity_idx" ON "documents"("related_entity_type", "related_entity_id");

ALTER TABLE "documents" ADD CONSTRAINT "documents_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

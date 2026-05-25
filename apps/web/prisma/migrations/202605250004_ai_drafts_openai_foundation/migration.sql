-- AlterEnum
ALTER TYPE "AIDraftStatus" ADD VALUE 'archived';

-- AlterEnum
ALTER TYPE "AuditAction" ADD VALUE 'ai_generate_requested';
ALTER TYPE "AuditAction" ADD VALUE 'ai_generate_succeeded';
ALTER TYPE "AuditAction" ADD VALUE 'ai_generate_failed';
ALTER TYPE "AuditAction" ADD VALUE 'ai_draft_approved';
ALTER TYPE "AuditAction" ADD VALUE 'ai_draft_rejected';
ALTER TYPE "AuditAction" ADD VALUE 'ai_draft_merged';
ALTER TYPE "AuditAction" ADD VALUE 'ai_draft_archived';

-- AlterTable
ALTER TABLE "ai_drafts" ADD COLUMN "reviewed_by_id" TEXT;
ALTER TABLE "ai_drafts" ADD COLUMN "content_json" JSONB;
ALTER TABLE "ai_drafts" ADD COLUMN "content_ru" TEXT;
ALTER TABLE "ai_drafts" ADD COLUMN "content_en" TEXT;
ALTER TABLE "ai_drafts" ADD COLUMN "sources_json" JSONB;
ALTER TABLE "ai_drafts" ADD COLUMN "missing_data" JSONB;
ALTER TABLE "ai_drafts" ADD COLUMN "provider" TEXT NOT NULL DEFAULT 'mock';
ALTER TABLE "ai_drafts" ADD COLUMN "model" TEXT;
ALTER TABLE "ai_drafts" ADD COLUMN "prompt_version" TEXT NOT NULL DEFAULT 'ai-drafts-v1';
ALTER TABLE "ai_drafts" ADD COLUMN "reviewed_at" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "ai_drafts_reviewed_by_id_idx" ON "ai_drafts"("reviewed_by_id");

-- AddForeignKey
ALTER TABLE "ai_drafts" ADD CONSTRAINT "ai_drafts_reviewed_by_id_fkey" FOREIGN KEY ("reviewed_by_id") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "AdminRole" AS ENUM ('admin', 'editor', 'researcher', 'ai_moderator');

-- CreateEnum
CREATE TYPE "DataConfidenceLevel" AS ENUM ('official_confirmed', 'admin_verified', 'multi_source_confirmed', 'estimated', 'unverified', 'conflicting');

-- CreateEnum
CREATE TYPE "PublishableStatus" AS ENUM ('draft', 'in_review', 'approved', 'published', 'rejected', 'archived');

-- CreateEnum
CREATE TYPE "AdminLaunchStatus" AS ENUM ('draft', 'scheduled', 'confirmed', 'live', 'delayed', 'scrubbed', 'success', 'failure', 'partial_success');

-- CreateEnum
CREATE TYPE "AdminTimelineEventType" AS ENUM ('countdown', 'liftoff', 'max_q', 'meco', 'stage_separation', 'ses', 'seco', 'entry_burn', 'landing_burn', 'booster_landing', 'payload_deploy', 'custom');

-- CreateEnum
CREATE TYPE "AdminTimelineEventStatus" AS ENUM ('planned', 'confirmed', 'estimated', 'skipped', 'failed');

-- CreateEnum
CREATE TYPE "SourceKind" AS ENUM ('official_spacex', 'official_youtube', 'nasa', 'faa', 'launch_library', 'spaceflight_now', 'nasaspaceflight', 'next_spaceflight', 'mock_dataset', 'other');

-- CreateEnum
CREATE TYPE "AdminSourceType" AS ENUM ('official', 'api', 'secondary', 'manual');

-- CreateEnum
CREATE TYPE "AdminTrustLevel" AS ENUM ('primary', 'secondary', 'low');

-- CreateEnum
CREATE TYPE "SourceConflictStatus" AS ENUM ('open', 'reviewing', 'resolved');

-- CreateEnum
CREATE TYPE "AIDraftType" AS ENUM ('launch_summary', 'article', 'news_summary', 'faq', 'seo', 'timeline_suggestion', 'source_comparison');

-- CreateEnum
CREATE TYPE "AIDraftStatus" AS ENUM ('generated', 'needs_review', 'approved', 'rejected', 'merged');

-- CreateEnum
CREATE TYPE "AdminEntityType" AS ENUM ('admin_user', 'launch', 'timeline_event', 'source_record', 'source_conflict', 'article', 'news_item', 'faq_item', 'ai_draft', 'settings');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('create', 'update', 'delete', 'submit_for_review', 'approve', 'reject', 'publish', 'archive', 'override', 'sign_in');

-- CreateEnum
CREATE TYPE "FAQGroup" AS ENUM ('basics', 'falcon9', 'starship', 'timeline', 'livestreams', 'accuracy', 'reminders');

-- CreateTable
CREATE TABLE "admin_users" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "name" TEXT NOT NULL,
    "role" "AdminRole" NOT NULL,
    "password_hash" TEXT,
    "is_human" BOOLEAN NOT NULL DEFAULT true,
    "last_active_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "launches" (
    "id" TEXT NOT NULL,
    "source_launch_id" TEXT,
    "slug" TEXT NOT NULL,
    "mission_name" JSONB NOT NULL,
    "content_title" JSONB NOT NULL,
    "content_description" JSONB NOT NULL,
    "seo_title" JSONB NOT NULL,
    "meta_description" JSONB NOT NULL,
    "rocket" JSONB NOT NULL,
    "launch_pad" JSONB NOT NULL,
    "launch_date_time_utc" TIMESTAMP(3) NOT NULL,
    "local_time_display_helper" TEXT NOT NULL,
    "trajectory" JSONB NOT NULL,
    "orbit" TEXT,
    "payload" JSONB NOT NULL,
    "mission_description" JSONB NOT NULL,
    "official_url" TEXT,
    "youtube_url_or_video_id" TEXT,
    "confidence_level" "DataConfidenceLevel" NOT NULL DEFAULT 'estimated',
    "status" "AdminLaunchStatus" NOT NULL DEFAULT 'draft',
    "publish_status" "PublishableStatus" NOT NULL DEFAULT 'draft',
    "is_featured" BOOLEAN NOT NULL DEFAULT false,
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "is_mock" BOOLEAN NOT NULL DEFAULT false,
    "manual_override" BOOLEAN NOT NULL DEFAULT false,
    "ai_generated" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "launches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mission_timeline_events" (
    "id" TEXT NOT NULL,
    "launch_id" TEXT NOT NULL,
    "type" "AdminTimelineEventType" NOT NULL,
    "title" JSONB NOT NULL,
    "description" JSONB NOT NULL,
    "relative_time" TEXT NOT NULL,
    "status" "AdminTimelineEventStatus" NOT NULL DEFAULT 'planned',
    "confidence_level" "DataConfidenceLevel" NOT NULL DEFAULT 'estimated',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "approval_status" "PublishableStatus" NOT NULL DEFAULT 'draft',
    "ai_generated" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mission_timeline_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "source_records" (
    "id" TEXT NOT NULL,
    "launch_id" TEXT,
    "article_id" TEXT,
    "news_item_id" TEXT,
    "faq_item_id" TEXT,
    "kind" "SourceKind" NOT NULL,
    "title" JSONB NOT NULL,
    "publisher" TEXT NOT NULL,
    "url" TEXT,
    "retrieved_at" TIMESTAMP(3),
    "confidence_level" "DataConfidenceLevel" NOT NULL DEFAULT 'estimated',
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "source_type" "AdminSourceType" NOT NULL DEFAULT 'manual',
    "trust_level" "AdminTrustLevel" NOT NULL DEFAULT 'low',
    "last_checked_at" TIMESTAMP(3),
    "conflicting_fields" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "source_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "source_conflicts" (
    "id" TEXT NOT NULL,
    "entity_type" "AdminEntityType" NOT NULL,
    "entity_id" TEXT NOT NULL,
    "field" TEXT NOT NULL,
    "sources" JSONB NOT NULL,
    "summary" TEXT NOT NULL,
    "status" "SourceConflictStatus" NOT NULL DEFAULT 'open',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "source_conflicts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "articles" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" JSONB NOT NULL,
    "body" JSONB NOT NULL,
    "seo_title" JSONB NOT NULL,
    "meta_description" JSONB NOT NULL,
    "category" TEXT NOT NULL,
    "publish_status" "PublishableStatus" NOT NULL DEFAULT 'draft',
    "ai_draft_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "articles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "news_items" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" JSONB NOT NULL,
    "summary" JSONB NOT NULL,
    "source_url" TEXT,
    "source_name" TEXT NOT NULL,
    "publication_date" TIMESTAMP(3) NOT NULL,
    "confidence_level" "DataConfidenceLevel" NOT NULL DEFAULT 'estimated',
    "publish_status" "PublishableStatus" NOT NULL DEFAULT 'draft',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "news_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "faq_items" (
    "id" TEXT NOT NULL,
    "group" "FAQGroup" NOT NULL,
    "question" JSONB NOT NULL,
    "answer" JSONB NOT NULL,
    "publish_status" "PublishableStatus" NOT NULL DEFAULT 'draft',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "faq_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_drafts" (
    "id" TEXT NOT NULL,
    "type" "AIDraftType" NOT NULL,
    "status" "AIDraftStatus" NOT NULL DEFAULT 'generated',
    "created_by_id" TEXT NOT NULL,
    "related_entity_type" "AdminEntityType" NOT NULL,
    "related_entity_id" TEXT NOT NULL,
    "title" JSONB NOT NULL,
    "content" JSONB NOT NULL,
    "citations" JSONB NOT NULL,
    "confidence_notes" JSONB NOT NULL,
    "risk_notes" JSONB NOT NULL,
    "source_comparison" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_drafts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "approval_records" (
    "id" TEXT NOT NULL,
    "entity_type" "AdminEntityType" NOT NULL,
    "entity_id" TEXT NOT NULL,
    "status" "PublishableStatus" NOT NULL,
    "submitted_by_id" TEXT,
    "approved_by_id" TEXT,
    "rejected_by_id" TEXT,
    "submitted_at" TIMESTAMP(3),
    "approved_at" TIMESTAMP(3),
    "rejected_at" TIMESTAMP(3),
    "published_at" TIMESTAMP(3),
    "archived_at" TIMESTAMP(3),
    "comments" TEXT,
    "diff_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "approval_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "actor_id" TEXT,
    "action" "AuditAction" NOT NULL,
    "entity_type" "AdminEntityType" NOT NULL,
    "entity_id" TEXT NOT NULL,
    "before" JSONB,
    "after" JSONB,
    "metadata" JSONB,
    "reason" TEXT,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "admin_users_email_key" ON "admin_users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "launches_source_launch_id_key" ON "launches"("source_launch_id");

-- CreateIndex
CREATE UNIQUE INDEX "launches_slug_key" ON "launches"("slug");

-- CreateIndex
CREATE INDEX "launches_status_idx" ON "launches"("status");

-- CreateIndex
CREATE INDEX "launches_publish_status_idx" ON "launches"("publish_status");

-- CreateIndex
CREATE INDEX "launches_launch_date_time_utc_idx" ON "launches"("launch_date_time_utc");

-- CreateIndex
CREATE INDEX "mission_timeline_events_launch_id_sort_order_idx" ON "mission_timeline_events"("launch_id", "sort_order");

-- CreateIndex
CREATE INDEX "source_records_launch_id_idx" ON "source_records"("launch_id");

-- CreateIndex
CREATE INDEX "source_records_article_id_idx" ON "source_records"("article_id");

-- CreateIndex
CREATE INDEX "source_records_news_item_id_idx" ON "source_records"("news_item_id");

-- CreateIndex
CREATE INDEX "source_records_faq_item_id_idx" ON "source_records"("faq_item_id");

-- CreateIndex
CREATE INDEX "source_records_trust_level_idx" ON "source_records"("trust_level");

-- CreateIndex
CREATE INDEX "source_conflicts_entity_type_entity_id_idx" ON "source_conflicts"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "source_conflicts_status_idx" ON "source_conflicts"("status");

-- CreateIndex
CREATE UNIQUE INDEX "articles_slug_key" ON "articles"("slug");

-- CreateIndex
CREATE INDEX "articles_publish_status_idx" ON "articles"("publish_status");

-- CreateIndex
CREATE INDEX "articles_category_idx" ON "articles"("category");

-- CreateIndex
CREATE UNIQUE INDEX "news_items_slug_key" ON "news_items"("slug");

-- CreateIndex
CREATE INDEX "news_items_publish_status_idx" ON "news_items"("publish_status");

-- CreateIndex
CREATE INDEX "news_items_publication_date_idx" ON "news_items"("publication_date");

-- CreateIndex
CREATE INDEX "faq_items_group_sort_order_idx" ON "faq_items"("group", "sort_order");

-- CreateIndex
CREATE INDEX "faq_items_publish_status_idx" ON "faq_items"("publish_status");

-- CreateIndex
CREATE INDEX "ai_drafts_status_idx" ON "ai_drafts"("status");

-- CreateIndex
CREATE INDEX "ai_drafts_related_entity_type_related_entity_id_idx" ON "ai_drafts"("related_entity_type", "related_entity_id");

-- CreateIndex
CREATE INDEX "approval_records_entity_type_entity_id_idx" ON "approval_records"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "approval_records_status_idx" ON "approval_records"("status");

-- CreateIndex
CREATE INDEX "audit_logs_actor_id_idx" ON "audit_logs"("actor_id");

-- CreateIndex
CREATE INDEX "audit_logs_entity_type_entity_id_idx" ON "audit_logs"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- AddForeignKey
ALTER TABLE "mission_timeline_events" ADD CONSTRAINT "mission_timeline_events_launch_id_fkey" FOREIGN KEY ("launch_id") REFERENCES "launches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "source_records" ADD CONSTRAINT "source_records_launch_id_fkey" FOREIGN KEY ("launch_id") REFERENCES "launches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "source_records" ADD CONSTRAINT "source_records_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "source_records" ADD CONSTRAINT "source_records_news_item_id_fkey" FOREIGN KEY ("news_item_id") REFERENCES "news_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "source_records" ADD CONSTRAINT "source_records_faq_item_id_fkey" FOREIGN KEY ("faq_item_id") REFERENCES "faq_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_drafts" ADD CONSTRAINT "ai_drafts_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "admin_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_records" ADD CONSTRAINT "approval_records_submitted_by_id_fkey" FOREIGN KEY ("submitted_by_id") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_records" ADD CONSTRAINT "approval_records_approved_by_id_fkey" FOREIGN KEY ("approved_by_id") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_records" ADD CONSTRAINT "approval_records_rejected_by_id_fkey" FOREIGN KEY ("rejected_by_id") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

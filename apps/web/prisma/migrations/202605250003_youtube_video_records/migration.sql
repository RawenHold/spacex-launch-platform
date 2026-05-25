-- CreateEnum
CREATE TYPE "VideoProvider" AS ENUM ('youtube');

-- AlterEnum
ALTER TYPE "AdminEntityType" ADD VALUE 'video_record';

-- CreateTable
CREATE TABLE "video_records" (
  "id" TEXT NOT NULL,
  "launch_id" TEXT NOT NULL,
  "provider" "VideoProvider" NOT NULL DEFAULT 'youtube',
  "provider_video_id" TEXT,
  "url" TEXT,
  "title" JSONB NOT NULL,
  "description" JSONB NOT NULL,
  "channel_id" TEXT,
  "channel_title" TEXT,
  "thumbnail_url" TEXT,
  "scheduled_start_time" TIMESTAMP(3),
  "actual_start_time" TIMESTAMP(3),
  "actual_end_time" TIMESTAMP(3),
  "live_broadcast_content" TEXT,
  "duration" TEXT,
  "publish_status" "PublishableStatus" NOT NULL DEFAULT 'draft',
  "confidence_level" "DataConfidenceLevel" NOT NULL DEFAULT 'estimated',
  "source_type" "AdminSourceType" NOT NULL DEFAULT 'manual',
  "confidence_score" INTEGER NOT NULL DEFAULT 0,
  "confidence_notes" TEXT,
  "is_approved" BOOLEAN NOT NULL DEFAULT false,
  "approved_by_id" TEXT,
  "approved_at" TIMESTAMP(3),
  "external_raw_json" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "video_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "video_records_provider_provider_video_id_key" ON "video_records"("provider", "provider_video_id");

-- CreateIndex
CREATE INDEX "video_records_launch_id_idx" ON "video_records"("launch_id");

-- CreateIndex
CREATE INDEX "video_records_publish_status_idx" ON "video_records"("publish_status");

-- CreateIndex
CREATE INDEX "video_records_is_approved_idx" ON "video_records"("is_approved");

-- CreateIndex
CREATE INDEX "video_records_channel_id_idx" ON "video_records"("channel_id");

-- AddForeignKey
ALTER TABLE "video_records" ADD CONSTRAINT "video_records_launch_id_fkey" FOREIGN KEY ("launch_id") REFERENCES "launches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "video_records" ADD CONSTRAINT "video_records_approved_by_id_fkey" FOREIGN KEY ("approved_by_id") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

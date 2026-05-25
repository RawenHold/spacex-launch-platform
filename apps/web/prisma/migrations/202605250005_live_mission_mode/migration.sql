-- CreateEnum
CREATE TYPE "LiveMissionMode" AS ENUM ('planned', 'live', 'replay', 'paused', 'completed', 'scrubbed', 'delayed');

-- CreateEnum
CREATE TYPE "LiveMissionStreamStatus" AS ENUM ('unavailable', 'scheduled', 'live', 'ended', 'replay');

-- CreateEnum
CREATE TYPE "LiveMissionSourceType" AS ENUM ('planned', 'admin_confirmed', 'estimated', 'official_source', 'manual_override');

-- CreateTable
CREATE TABLE "live_mission_states" (
    "id" TEXT NOT NULL,
    "launch_id" TEXT NOT NULL,
    "mode" "LiveMissionMode" NOT NULL DEFAULT 'planned',
    "countdown_target_utc" TIMESTAMP(3) NOT NULL,
    "t0_utc" TIMESTAMP(3),
    "current_mission_time_seconds" INTEGER,
    "active_timeline_event_id" TEXT,
    "current_phase" TEXT,
    "animation_progress" INTEGER NOT NULL DEFAULT 0,
    "stream_status" "LiveMissionStreamStatus" NOT NULL DEFAULT 'unavailable',
    "manual_override_enabled" BOOLEAN NOT NULL DEFAULT false,
    "public_banner_ru" TEXT,
    "public_banner_en" TEXT,
    "internal_notes" TEXT,
    "last_updated_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "live_mission_states_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "live_mission_event_logs" (
    "id" TEXT NOT NULL,
    "launch_id" TEXT NOT NULL,
    "timeline_event_id" TEXT,
    "event_type" TEXT NOT NULL,
    "previous_status" "AdminTimelineEventStatus",
    "new_status" "AdminTimelineEventStatus",
    "mission_time_seconds" INTEGER,
    "note_ru" TEXT,
    "note_en" TEXT,
    "source_type" "LiveMissionSourceType" NOT NULL DEFAULT 'planned',
    "actor_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "live_mission_event_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "live_mission_states_launch_id_key" ON "live_mission_states"("launch_id");

-- CreateIndex
CREATE INDEX "live_mission_states_mode_idx" ON "live_mission_states"("mode");

-- CreateIndex
CREATE INDEX "live_mission_states_stream_status_idx" ON "live_mission_states"("stream_status");

-- CreateIndex
CREATE INDEX "live_mission_states_active_timeline_event_id_idx" ON "live_mission_states"("active_timeline_event_id");

-- CreateIndex
CREATE INDEX "live_mission_event_logs_launch_id_created_at_idx" ON "live_mission_event_logs"("launch_id", "created_at");

-- CreateIndex
CREATE INDEX "live_mission_event_logs_timeline_event_id_idx" ON "live_mission_event_logs"("timeline_event_id");

-- CreateIndex
CREATE INDEX "live_mission_event_logs_source_type_idx" ON "live_mission_event_logs"("source_type");

-- AddForeignKey
ALTER TABLE "live_mission_states" ADD CONSTRAINT "live_mission_states_launch_id_fkey" FOREIGN KEY ("launch_id") REFERENCES "launches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "live_mission_states" ADD CONSTRAINT "live_mission_states_active_timeline_event_id_fkey" FOREIGN KEY ("active_timeline_event_id") REFERENCES "mission_timeline_events"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "live_mission_states" ADD CONSTRAINT "live_mission_states_last_updated_by_id_fkey" FOREIGN KEY ("last_updated_by_id") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "live_mission_event_logs" ADD CONSTRAINT "live_mission_event_logs_launch_id_fkey" FOREIGN KEY ("launch_id") REFERENCES "launches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "live_mission_event_logs" ADD CONSTRAINT "live_mission_event_logs_timeline_event_id_fkey" FOREIGN KEY ("timeline_event_id") REFERENCES "mission_timeline_events"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "live_mission_event_logs" ADD CONSTRAINT "live_mission_event_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

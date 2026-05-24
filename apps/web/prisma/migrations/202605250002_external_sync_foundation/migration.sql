-- CreateEnum
CREATE TYPE "ExternalSyncProvider" AS ENUM ('launch_library');

-- CreateEnum
CREATE TYPE "ExternalSyncRunStatus" AS ENUM ('running', 'success', 'partial', 'failed');

-- CreateEnum
CREATE TYPE "ExternalImportSyncStatus" AS ENUM ('imported', 'updated', 'skipped', 'conflict', 'error');

-- AlterEnum
ALTER TYPE "AdminEntityType" ADD VALUE 'external_sync_run';
ALTER TYPE "AdminEntityType" ADD VALUE 'external_import_record';

-- AlterTable
ALTER TABLE "launches"
  ADD COLUMN "external_provider" "ExternalSyncProvider",
  ADD COLUMN "external_id" TEXT,
  ADD COLUMN "imported_at" TIMESTAMP(3),
  ADD COLUMN "last_synced_at" TIMESTAMP(3),
  ADD COLUMN "sync_status" "ExternalImportSyncStatus",
  ADD COLUMN "sync_hash" TEXT,
  ADD COLUMN "import_batch_id" TEXT,
  ADD COLUMN "external_raw_json" JSONB;

-- CreateTable
CREATE TABLE "external_sync_runs" (
  "id" TEXT NOT NULL,
  "provider" "ExternalSyncProvider" NOT NULL,
  "status" "ExternalSyncRunStatus" NOT NULL DEFAULT 'running',
  "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "finished_at" TIMESTAMP(3),
  "requested_by_id" TEXT,
  "imported_count" INTEGER NOT NULL DEFAULT 0,
  "updated_count" INTEGER NOT NULL DEFAULT 0,
  "skipped_count" INTEGER NOT NULL DEFAULT 0,
  "conflict_count" INTEGER NOT NULL DEFAULT 0,
  "error_count" INTEGER NOT NULL DEFAULT 0,
  "error_message" TEXT,
  "metadata_json" JSONB,

  CONSTRAINT "external_sync_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "external_import_records" (
  "id" TEXT NOT NULL,
  "provider" "ExternalSyncProvider" NOT NULL,
  "external_id" TEXT NOT NULL,
  "entity_type" "AdminEntityType" NOT NULL,
  "entity_id" TEXT,
  "import_batch_id" TEXT NOT NULL,
  "sync_run_id" TEXT,
  "raw_json" JSONB NOT NULL,
  "normalized_json" JSONB NOT NULL,
  "hash" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "external_import_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "launches_external_provider_external_id_idx" ON "launches"("external_provider", "external_id");

-- CreateIndex
CREATE INDEX "launches_import_batch_id_idx" ON "launches"("import_batch_id");

-- CreateIndex
CREATE INDEX "external_sync_runs_provider_status_started_at_idx" ON "external_sync_runs"("provider", "status", "started_at");

-- CreateIndex
CREATE UNIQUE INDEX "external_import_records_provider_external_id_import_batch_id_key" ON "external_import_records"("provider", "external_id", "import_batch_id");

-- CreateIndex
CREATE INDEX "external_import_records_provider_external_id_idx" ON "external_import_records"("provider", "external_id");

-- CreateIndex
CREATE INDEX "external_import_records_entity_type_entity_id_idx" ON "external_import_records"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "external_import_records_import_batch_id_idx" ON "external_import_records"("import_batch_id");

-- AddForeignKey
ALTER TABLE "external_sync_runs" ADD CONSTRAINT "external_sync_runs_requested_by_id_fkey" FOREIGN KEY ("requested_by_id") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "external_import_records" ADD CONSTRAINT "external_import_records_sync_run_id_fkey" FOREIGN KEY ("sync_run_id") REFERENCES "external_sync_runs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

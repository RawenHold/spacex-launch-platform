# Database

## Selected Stack

The backend foundation uses Prisma ORM with PostgreSQL.

This keeps the existing repository abstraction intact and allows the same schema to run on:

- Supabase Postgres
- local PostgreSQL
- Neon
- Prisma Postgres
- any standard PostgreSQL provider supported by Prisma

Supabase Auth is not integrated in this stage because there is no Supabase project configuration in the repository. Supabase can still be used as the PostgreSQL host by setting `DATABASE_URL`.

## Files

- `apps/web/prisma/schema.prisma` - database schema.
- `apps/web/prisma/migrations/202605240001_admin_backend_foundation/migration.sql` - initial SQL migration.
- `apps/web/prisma/migrations/202605250001_admin_stabilization/migration.sql` - admin user status and rate-limit audit event migration.
- `apps/web/prisma/migrations/202605250002_external_sync_foundation/migration.sql` - Launch Library sync run/import record support and import metadata on launches.
- `apps/web/prisma/migrations/202605250003_youtube_video_records/migration.sql` - YouTube video candidate persistence.
- `apps/web/prisma/migrations/202605250004_ai_drafts_openai_foundation/migration.sql` - structured AI draft metadata, review fields, and AI audit events.
- `apps/web/prisma/migrations/202605250005_live_mission_mode/migration.sql` - persistent live mission state and event history.
- `apps/web/prisma/seed.ts` - safe seed script.
- `apps/web/prisma.config.ts` - Prisma CLI config and seed path.
- `apps/web/lib/db.ts` - Prisma Client singleton.
- `apps/web/lib/admin/repository.ts` - persistence repository implementation.

## Models

Implemented persistent models:

- `AdminUser`
- `Launch`
- `MissionTimelineEvent`
- `SourceRecord`
- `SourceConflict`
- `Article`
- `NewsItem`
- `FAQItem`
- `AIDraft`
- `ApprovalRecord`
- `AuditLog`
- `ExternalSyncRun`
- `ExternalImportRecord`
- `VideoRecord`
- `LiveMissionState`
- `LiveMissionEventLog`

The schema stores bilingual fields as JSON with the current shape `{ en, ru }`, while keeping the application types ready for future `es`, `it`, and `fr`.

## Public Read Policy

Public pages read through `apps/web/lib/public/repository.ts`, not directly from components.

Public queries only return:

- launches with `publishStatus = PUBLISHED` and `isPublished = true`
- articles/news/FAQ with `publishStatus = PUBLISHED`

Draft, in-review, rejected, and archived records are not visible publicly.

Mock data is isolated as a development fallback only. If the database has no published rows or is unavailable during local development, the page can show local mock data with a visible development warning. Production returns graceful empty states instead of mock data.

Imported external records remain private because they are inserted as unpublished drafts. Public DB queries do not include imported drafts until an admin explicitly approves and publishes them.

Public video embeds are stricter: launch detail pages only expose `VideoRecord` rows where the parent launch is published, the video belongs to that launch, and the video is approved or published. Draft, rejected, archived, or unreviewed YouTube candidates remain admin-only.

Live Mission Mode is also tied to published launches only on public pages. A public launch can show `LiveMissionState` and `LiveMissionEventLog` rows for mission clock, planned timeline progress, admin-confirmed events, stream state, public banners, and replay mode. These rows never imply official telemetry unless a future official telemetry source is explicitly integrated and labeled.

Repository methods:

- `getPublishedUpcomingLaunches()`
- `getPublishedPastLaunches()`
- `getPublishedLaunchBySlug(slug)`
- `getFeaturedPublishedLaunch()`
- `getPublishedArticles()`
- `getPublishedNews()`
- `getPublishedFAQ()`
- `getLaunchCalendarItems()`

## External Sync Tables

`ExternalSyncRun` stores each manual Launch Library sync run:

- provider
- status
- start/finish timestamps
- requesting admin
- imported/updated/skipped/conflict/error counts
- safe metadata and error message

`ExternalImportRecord` stores raw and normalized payload snapshots for traceability:

- provider
- external id
- entity type/id
- import batch id
- raw JSON
- normalized JSON
- hash

`Launch` also stores import metadata:

- `externalProvider`
- `externalId`
- `importedAt`
- `lastSyncedAt`
- `syncStatus`
- `syncHash`
- `importBatchId`
- `externalRawJson`

## YouTube Video Records

`VideoRecord` stores YouTube livestream/replay candidates:

- provider and provider video id
- canonical URL
- localized title/description
- channel id/title
- thumbnail URL
- scheduled/actual live times
- live/upcoming/completed hint
- publish status and approval fields
- confidence level, score, and notes
- source type
- safe raw API payload snapshot

The table has a unique provider/video id constraint and indexes for launch, publish status, approval state, and channel id. Discovery creates or updates unpublished candidates only. Approval/publish actions are explicit admin workflow events and write `AuditLog` rows.

## AI Draft Persistence

`AIDraft` now stores structured AI output for human review:

- draft type and status
- related entity type/id
- localized preview title/content
- `contentJson` for schema-shaped AI output
- `contentRu` and `contentEn` preview bodies
- citations and `sourcesJson`
- confidence notes, risk notes, and missing data
- provider, model, and prompt version
- reviewedBy/reviewedAt metadata

AI draft statuses include:

- generated
- needs_review
- approved
- rejected
- merged
- archived

AI lifecycle events are represented in `AuditLog`:

- ai_generate_requested
- ai_generate_succeeded
- ai_generate_failed
- ai_draft_approved
- ai_draft_rejected
- ai_draft_merged
- ai_draft_archived

AI-generated content never becomes public by itself. Merge writes only editable draft content, and normal approval/publish workflow remains required.

## Live Mission Mode Tables

`LiveMissionState` stores one durable state row per launch:

- mode: planned, live, replay, paused, completed, scrubbed, or delayed
- countdown target and optional T-0
- current mission time and active timeline event
- current phase and animation progress
- stream status: unavailable, scheduled, live, ended, or replay
- public RU/EN banner and internal notes
- manual override flag and last updater

`LiveMissionEventLog` stores the append-only event history:

- launch and optional timeline event
- previous/new timeline event status
- mission time in seconds
- RU/EN notes
- source type: planned, admin confirmed, estimated, official source, or manual override
- actor and timestamp

The event log preserves live-control history even if timeline events are later edited. Public UI labels planned/admin-confirmed/estimated/replay states clearly and does not claim official real-time telemetry.

## Migrations

Validate the schema:

```bash
cd apps/web
npm run db:validate
```

Apply migrations to a configured database:

```bash
cd apps/web
npm run db:deploy
```

For local iterative development:

```bash
cd apps/web
npm run db:migrate -- --name your_change_name
```

## Seed

Dry-run the seed without touching a database:

```bash
cd apps/web
npm run db:seed:dry-run
```

Seed a configured database:

```bash
cd apps/web
ADMIN_EMAIL="admin@example.com" ADMIN_PASSWORD="change-this-locally" npm run db:seed
```

The seed creates:

- one `AI Moderator` system user
- one optional admin user from `ADMIN_EMAIL`
- sample launches
- sample timeline events
- sample articles
- sample news
- sample FAQ entries
- sample sources
- one sample AI draft

No real password is hardcoded. If `ADMIN_PASSWORD` is omitted, the seeded admin exists but cannot sign in through Credentials auth until a password hash is set.

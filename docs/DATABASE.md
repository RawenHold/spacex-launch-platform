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

The schema stores bilingual fields as JSON with the current shape `{ en, ru }`, while keeping the application types ready for future `es`, `it`, and `fr`.

## Public Read Policy

Public pages read through `apps/web/lib/public/repository.ts`, not directly from components.

Public queries only return:

- launches with `publishStatus = PUBLISHED` and `isPublished = true`
- articles/news/FAQ with `publishStatus = PUBLISHED`

Draft, in-review, rejected, and archived records are not visible publicly.

Mock data is isolated as a development fallback only. If the database has no published rows or is unavailable during local development, the page can show local mock data with a visible development warning. Production returns graceful empty states instead of mock data.

Repository methods:

- `getPublishedUpcomingLaunches()`
- `getPublishedPastLaunches()`
- `getPublishedLaunchBySlug(slug)`
- `getFeaturedPublishedLaunch()`
- `getPublishedArticles()`
- `getPublishedNews()`
- `getPublishedFAQ()`
- `getLaunchCalendarItems()`

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

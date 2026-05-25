# Deployment

These instructions target Vercel or an equivalent Node-compatible platform.

## Project Settings

- Root directory: `apps/web`
- Install command: `npm install`
- Build command: `npm run build`
- Output: Next.js managed output
- Node: use the platform default supported by Next.js 16 or pin a current LTS version

## Required Environment Variables

```text
DATABASE_URL=
AUTH_SECRET=
AUTH_TRUST_HOST=true
NEXT_PUBLIC_SITE_URL=
```

For first admin bootstrap:

```text
ADMIN_EMAIL=
ADMIN_NAME=
ADMIN_PASSWORD=
```

Do not keep temporary bootstrap passwords around longer than needed.

## Optional Environment Variables

```text
DIRECT_URL=
ENABLE_MOCK_FALLBACK=false
RATE_LIMIT_ADAPTER=memory
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
LAUNCH_LIBRARY_BASE_URL=https://ll.thespacedevs.com/2.3.0
LAUNCH_LIBRARY_API_KEY=
ENABLE_EXTERNAL_SYNC=false
YOUTUBE_API_KEY=
YOUTUBE_SPACEX_CHANNEL_ID=
ENABLE_YOUTUBE_SYNC=false
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4.1-mini
ENABLE_AI_DRAFTS=false
ENABLE_LIVE_MISSION_MODE=true
```

Production should keep `ENABLE_MOCK_FALLBACK=false`.

## Database Migration Workflow

Before deploy:

```bash
cd apps/web
npm run db:validate
npm run prisma:generate
```

Deploy migrations:

```bash
cd apps/web
npm run db:deploy
```

Use `prisma migrate deploy` in production, not `prisma migrate dev`.

## First Admin Setup

After migrations:

```bash
cd apps/web
npm run db:seed
```

Confirm:

- `/admin/login` accepts the seeded admin
- `/admin/users` shows at least one active human admin
- AI Moderator exists as a system identity only

## Feature Gates

- `ENABLE_EXTERNAL_SYNC=true` enables manual Launch Library sync.
- `ENABLE_YOUTUBE_SYNC=true` enables manual YouTube discovery.
- `ENABLE_AI_DRAFTS=true` enables admin-triggered AI draft generation.
- `ENABLE_LIVE_MISSION_MODE=false` disables public live panels and admin live-control mutations.
- Imported/synced/AI/video records still require review and approval.

## Security Headers

Security headers are emitted from `next.config.mjs`.

CSP permits YouTube frame embeds and framework-required inline styles/scripts. Review CSP reports after deployment before tightening.

## Post-Deploy Checklist

- Visit `/robots.txt` and verify admin is disallowed.
- Visit `/sitemap.xml` and verify admin routes are absent.
- Confirm `/admin` redirects unauthenticated users to `/admin/login`.
- Confirm disabled users cannot access admin.
- Confirm public pages do not show local mock fallback.
- Confirm external sync, YouTube discovery, AI drafts, and Live Mission controls respect env gates.
- Run a test audit-log-producing admin action on staging.

## Rollback Checklist

- Revert to the previous deployment in Vercel or equivalent.
- Disable feature gates if admin workflows caused the incident.
- Restore database from backup if a migration caused data loss.
- Prefer forward-fix migrations when possible.
- Review `/admin/audit` after service is stable.

## Production Recommendations

- Replace in-memory rate limiting with Redis/Upstash/database/WAF storage.
- Add MFA/SSO for admin users.
- Add Sentry, Axiom, Logtail, or Vercel log drain.
- Enable database PITR and backup retention.
- Add staging deployment rehearsal before public launch.

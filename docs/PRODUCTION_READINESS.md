# Production Readiness

## Current Status

The project is production-oriented but not production-ready yet.

The application has strong foundations: protected admin routes, persistent PostgreSQL models, approval gates, audit logging, source verification, manual external sync, reviewed YouTube video publishing, reviewed AI drafts, and Live Mission Mode labels that avoid claiming official telemetry.

Critical blockers remain before a public production launch.

## Ready

- Next.js App Router build passes.
- Prisma schema validates and generates.
- Public pages read only published/approved content.
- Admin routes are server-protected through Auth.js.
- Role checks are server-side.
- Imported launches/videos and AI drafts are not auto-published.
- Admin audit logs exist.
- Security headers are configured.
- Robots/sitemap basics exist and exclude admin routes.
- Public error boundary and admin error boundary hide stack traces.
- Environment validation fails fast in production for critical runtime secrets.

## Not Ready

- Rate limiting is still in-memory unless a centralized adapter is implemented.
- No MFA/SSO/OAuth provider is configured.
- No production monitoring vendor is connected.
- No backup/restore rehearsal has been completed.
- No staging deployment rehearsal has been documented as passed.
- CSP still allows inline scripts/styles for framework compatibility.
- Live Mission Mode is admin/manual and not official telemetry.

## Critical Blockers

- Configure a real production PostgreSQL database and run migrations with `npm run db:deploy`.
- Configure `AUTH_SECRET` and `NEXT_PUBLIC_SITE_URL`.
- Replace or implement centralized rate limiting before multi-instance production.
- Create and verify first admin credentials securely.
- Configure backups and test restore.

## Security Blockers

- Add MFA, SSO, or OAuth for admin authentication.
- Centralize rate limiting in Redis/Upstash/database/WAF.
- Add monitoring alerts for failed logins, publish overrides, sync conflicts, and live-control overrides.
- Review CSP after deployment and tighten inline allowances if possible.

## Deployment Blockers

- Confirm Vercel or equivalent build settings.
- Confirm migration deployment command and rollback process.
- Confirm environment variables in production and preview environments.
- Confirm admin pages return `X-Robots-Tag: noindex, nofollow`.

## Database Blockers

- Select production Postgres host.
- Confirm pooled vs direct connection behavior.
- Configure backup retention and point-in-time recovery.
- Rehearse restore on staging.

## Launch Checklist

- Run all quality checks from `apps/web`.
- Run `npm run db:deploy` against production.
- Seed or create first admin through a secure one-time process.
- Confirm `/admin/login` works and disabled users cannot access `/admin`.
- Confirm public pages show no mock fallback in production.
- Confirm imported launches are drafts.
- Confirm draft videos are not public.
- Confirm AI drafts cannot publish.
- Confirm Live Mission Mode is labeled as planned/admin-confirmed/estimated/replay.
- Confirm sitemap contains public routes only.
- Confirm robots disallows admin.

## Rollback Checklist

- Identify last known-good deployment.
- Pause external sync, YouTube discovery, AI drafts, and Live Mission controls if needed.
- Revert deployment to last known-good build.
- If migration caused the incident, restore database backup or apply a forward-fix migration.
- Review audit logs for publish, override, sync, video, AI, and live-control actions.
- Document incident notes before re-enabling admin write workflows.

## Performance Review

Current posture:

- Public reads go through `apps/web/lib/public/repository.ts` and are scoped to published content.
- Admin/private data is rendered dynamically and should not be cached publicly.
- Server-only sync, YouTube, AI, and live-control services are not imported into client components.
- YouTube embeds use approved records only and stay isolated in the public embed component.
- 2.5D animation is SVG/CSS based and avoids large animation libraries.

Future improvements:

- Add safe `revalidate` windows for public list pages after publish workflows are stable.
- Add query pagination for very large launch/article/news datasets.
- Add database indexes based on real production query plans.
- Add CDN image handling if approved external imagery is introduced.
- Add monitoring for slow Prisma queries and build-time sitemap generation.

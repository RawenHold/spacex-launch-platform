# Environment

The active app lives in:

```text
apps/web
```

Copy the template before local development:

```bash
cd apps/web
cp .env.example .env
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

## Required For Backend/Admin

```text
DATABASE_URL=
AUTH_SECRET=
AUTH_TRUST_HOST=true
ADMIN_EMAIL=
ADMIN_NAME=
ADMIN_PASSWORD=
```

`DATABASE_URL` must be a PostgreSQL URL.

`AUTH_SECRET` is required by Auth.js. Generate one with:

```bash
npx auth secret
```

`ADMIN_EMAIL` and `ADMIN_PASSWORD` are used only by the seed script. No password is committed.

## Optional

```text
DIRECT_URL=
ENABLE_MOCK_FALLBACK=true
LAUNCH_LIBRARY_BASE_URL=https://ll.thespacedevs.com/2.3.0
LAUNCH_LIBRARY_API_KEY=
ENABLE_EXTERNAL_SYNC=false
```

Some hosted Postgres providers use a pooled connection for runtime and a direct connection for migrations. The current Prisma schema uses `DATABASE_URL`; add `directUrl` later if the selected host requires it.

`ENABLE_MOCK_FALLBACK=false` disables local development fallback to static mock data. Production never uses fallback mock data.

`ENABLE_EXTERNAL_SYNC=true` allows manual Launch Library sync from `/admin/sync`. Keep it false in environments where imports should be disabled.

`LAUNCH_LIBRARY_API_KEY` is optional; Launch Library can be used without a key for basic access, but configured keys must remain server-only.

## Future Placeholders

These are intentionally present but unused in this stage:

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
YOUTUBE_API_KEY=
```

Rules:

- `SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY`, and `YOUTUBE_API_KEY` are server-only.
- Anything prefixed with `NEXT_PUBLIC_` is browser-visible.
- Settings UI must only show status indicators, never secret values.

## Local Validation

```bash
cd apps/web
npm run db:validate
npm run prisma:generate
npm run db:seed:dry-run
npm run sync:dry-run
npm run lint
npm run typecheck
npm run build
```

## Applying The Database

After setting `DATABASE_URL`:

```bash
cd apps/web
npm run db:deploy
npm run db:seed
```

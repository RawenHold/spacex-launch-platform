# Admin Security

## Authentication

Admin authentication uses Auth.js v5 through `next-auth@5.0.0-beta.31` with a Credentials provider.

Implemented files:

- `apps/web/auth.ts`
- `apps/web/app/api/auth/[...nextauth]/route.ts`
- `apps/web/app/admin/login/page.tsx`
- `apps/web/lib/admin/auth.ts`

The protected admin UI lives in the App Router route group:

```text
apps/web/app/admin/(protected)
```

The public login page lives at:

```text
/admin/login
```

## Roles

Persistent roles:

- `admin`
- `editor`
- `researcher`
- `ai_moderator`

Rules:

- Admin can approve, publish, archive, and override.
- Editor can create/edit content and submit for review.
- Researcher can create/update source records and research suggestions.
- AI Moderator is a system actor for draft creation only.
- AI Moderator cannot sign in as a human user.
- AI Moderator cannot approve, publish, delete, or overwrite official data.

Role permissions are centralized in:

```text
apps/web/lib/admin/permissions.ts
```

## Route Protection

`/admin` routes are protected server-side by:

```ts
requireAdminRole(["admin", "editor", "researcher"])
```

This prevents unauthenticated rendering of the protected admin shell. Server actions and API routes also perform role or permission checks before writes.

## Passwords

Credential passwords are verified against `AdminUser.passwordHash`.

Password hashing uses Node's `scrypt` through:

```text
apps/web/lib/admin/password.ts
```

This is acceptable for a production-oriented foundation, but before public deployment the project should add:

- rate limiting
- account lockout or throttling
- password reset flow
- MFA or SSO
- stronger operational monitoring

## Approval And Publishing

Publishable content supports:

- `draft`
- `in_review`
- `approved`
- `published`
- `rejected`
- `archived`

Publishing normally requires prior approval.

If an admin publishes without prior approval, the repository writes an explicit `override` audit log entry.

## Audit Log

Important admin actions write `AuditLog` records:

- create
- update
- delete
- submit_for_review
- approve
- reject
- publish
- archive
- override
- sign_in

Audit logs include actor, action, entity type, entity id, optional before/after JSON snapshots, reason, metadata, and timestamp.

## Secret Handling

Never commit real secrets. Required secrets are documented in:

```text
apps/web/.env.example
```

Settings UI shows only configured/not configured indicators and never renders secret values.

## Risks Before Deployment

Before production deployment:

- Configure `AUTH_SECRET`.
- Use HTTPS only.
- Add rate limiting to `/admin/login` and admin write endpoints.
- Add CSRF review for any non-Auth.js form endpoints.
- Add monitoring and alerting for failed logins and override audit logs.
- Add backup/restore and migration rollback plans.
- Consider Supabase Auth, OAuth, SSO, WebAuthn, or MFA for stronger admin access.

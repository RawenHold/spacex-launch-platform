# Admin Operations

## First Admin

Set these before seeding a new environment:

```text
ADMIN_EMAIL=
ADMIN_NAME=
ADMIN_PASSWORD=
```

Then run:

```bash
cd apps/web
npm run db:seed
```

Use a strong temporary password and rotate it after first sign-in. Never commit real credentials.

## Invite Admin Users

Use `/admin/users` as an admin:

- create an invited user record by email
- assign `admin`, `editor`, or `researcher`
- keep `ai_moderator` as a system identity only
- do not disable the last active human admin

Email invitation delivery is still a placeholder.

## Launch Library Sync

Use `/admin/sync`.

Rules:

- set `ENABLE_EXTERNAL_SYNC=true`
- run manual sync only
- imported launches remain drafts
- conflicts must be reviewed before publishing
- secondary sources never override official/admin-approved records

## Reviewing Imported Launches

Use `/admin/launches` and `/admin/sources`.

- inspect source records and conflicts
- edit draft launch content
- submit for review
- approve only when source confidence is acceptable
- publish only after approval or explicit admin override

## YouTube Videos

Use `/admin/videos` or `/admin/launches/[id]/videos`.

- set `ENABLE_YOUTUBE_SYNC=true` for API discovery
- prefer the official SpaceX channel ID
- review candidates manually
- approve/publish only the correct launch video
- never expose draft/rejected videos publicly

## AI Drafts

Use `/admin/ai-drafts` or AI buttons on edit pages.

- set `ENABLE_AI_DRAFTS=true`
- real OpenAI calls require `OPENAI_API_KEY`
- AI creates drafts only
- AI cannot approve, publish, delete, or resolve conflicts
- merge only into editable draft content

## Live Mission Control

Use `/admin/live-control`.

- set `ENABLE_LIVE_MISSION_MODE=true`
- initialize live state for a selected launch
- update planned/live/replay/delayed/scrubbed/completed mode
- confirm timeline events only when manually verified
- use public banners for delay/scrub notes
- remember public UI is not official telemetry

Emergency actions:

- Delay launch: update T-0/countdown target and add a public banner.
- Scrub launch: set mode to scrubbed and add a public banner.
- Mission result: mark success, failure, or partial success only after source/admin verification.

## Audit Viewer

Use `/admin/audit`.

Review:

- sign-ins
- rate limits
- create/update/delete actions
- approval/publish/archive actions
- override actions
- sync/video/AI/live-control events

Sensitive JSON fields are masked before display.

## What Not To Do

- Do not publish imported records without review.
- Do not publish AI content directly.
- Do not claim official telemetry without an official telemetry source.
- Do not paste secrets into notes, banners, drafts, or source records.
- Do not run production migrations without backup.
- Do not use in-memory rate limiting for multi-instance production.

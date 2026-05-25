# Live Mission Mode

Live Mission Mode combines an approved YouTube livestream/replay, countdown or T+ clock, planned mission timeline, 2.5D launch animation, and admin-confirmed event updates.

It is not official real-time SpaceX telemetry. Until an official telemetry source is integrated, public UI must label state as planned, admin confirmed, estimated, delayed, scrubbed, or replay.

## Data Model

`LiveMissionState` stores one current state row per launch:

- mode: planned, live, replay, paused, completed, scrubbed, delayed
- countdown target and optional T-0
- current mission time, phase, animation progress, and active timeline event
- stream status: unavailable, scheduled, live, ended, replay
- public RU/EN banner
- internal notes and last updater

`LiveMissionEventLog` stores durable event history:

- timeline event status changes
- mission time seconds
- source type: planned, admin_confirmed, estimated, official_source, manual_override
- actor and timestamp

Changing a timeline event later does not erase live history.

## Mission Time Engine

The mission time utilities live in:

```text
apps/web/lib/mission-time
```

They compute:

- countdown to T-0
- T+ mission time
- active and next timeline event
- timeline progress percentage
- animation progress and phase
- replay seek positions

The engine uses stored launch time and planned timeline events. It does not infer or invent live telemetry.

## Public UI

Public launch detail pages show Live Mission Mode for published launches when a timeline, approved video, or live state exists.

The public panel includes:

- approved YouTube embed next to mission state
- countdown/T+ clock
- mission mode badge
- stream status badge
- active and next timeline event
- horizontal timeline markers
- public safety notice
- replay controls after completion/replay mode

Only approved/published `VideoRecord` rows are embedded publicly.

## Admin Workflow

Admin control lives at:

```text
/admin/live-control
```

Admins can:

- initialize live mission state
- set mode
- update countdown target/T-0
- set stream status
- update or clear public banners
- set active timeline event
- mark events confirmed, failed, skipped, or estimated
- mark mission success, failure, or partial success
- scrub or pause a mission

All mutations are server actions with role checks, admin write rate limiting, `AuditLog`, and `LiveMissionEventLog` where relevant.

## Replay Mode

Replay mode uses mission timeline time, not synchronized YouTube Player API control yet.

MVP replay supports:

- play/pause timeline animation
- seek mission time
- jump to next event
- reset replay

Future work can connect these controls to the YouTube IFrame Player API after approved videos are stable.

## Safety Rules

Public UI must never say:

- official telemetry
- real-time telemetry

unless an official, verified telemetry source is integrated.

Allowed labels:

- Planned timeline
- Admin confirmed
- Estimated
- Replay
- Stream live
- Stream scheduled
- Stream ended
- Launch delayed
- Launch scrubbed

## Dry Run

Run the mission-time dry run without database writes:

```bash
cd apps/web
npm run mission:dry-run
```

The script validates countdown/T+ transitions, active event selection, timeline progress, and animation phase computation.

## Known Limitations

- No official telemetry source is integrated.
- No websocket or realtime database subscription is implemented.
- Public clock ticks client-side but does not poll DB in this MVP.
- YouTube replay controls are independent from mission timeline replay.
- Rate limiting is still in-memory and should move to centralized storage for production.

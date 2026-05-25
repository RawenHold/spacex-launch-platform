# YouTube Integration

Stage 7 adds safe YouTube livestream/replay discovery and review. It does not add live telemetry, OpenAI, automatic publishing, or public exposure of unreviewed videos.

## Environment

```text
YOUTUBE_API_KEY=
YOUTUBE_SPACEX_CHANNEL_ID=
ENABLE_YOUTUBE_SYNC=false
```

`YOUTUBE_API_KEY` is read only by server modules under `apps/web/lib/server/youtube`. It must never be exposed to client components.

`YOUTUBE_SPACEX_CHANNEL_ID` should be set to the official SpaceX YouTube channel id. Discovery can still use manual URLs and broader searches without it, but confidence scoring is lower and admin review becomes more important.

`ENABLE_YOUTUBE_SYNC=true` gates manual discovery actions from admin UI and live script runs.

## URL Parsing

The shared utility in `apps/web/lib/youtube.ts` accepts:

- raw 11-character video ids
- `https://www.youtube.com/watch?v=VIDEO_ID`
- `https://youtu.be/VIDEO_ID`
- `https://www.youtube.com/live/VIDEO_ID`
- `https://www.youtube.com/embed/VIDEO_ID`
- URLs with extra query parameters

It returns a provider video id, canonical watch URL, validation state, and friendly error message.

## Discovery Workflow

Discovery runs for one selected launch:

1. Parse `launch.youtubeUrlOrVideoId` as a candidate.
2. Parse Launch Library `externalRawJson.vidURLs` as candidate webcast URLs.
3. If `YOUTUBE_API_KEY` is configured, search YouTube Data API v3 with mission-oriented queries.
4. Prefer the configured SpaceX channel id when available.
5. Enrich candidates through video metadata: snippet, content details, live streaming details, and status.
6. Score candidates and store them as draft/unapproved `VideoRecord` rows.
7. Record conflicts and audit logs.

No candidate is published automatically.

## Confidence Scoring

The score considers:

- configured official channel id match
- channel title that looks official
- mission keyword matches
- rocket keyword match
- optional launch pad keyword match
- scheduled/actual start time proximity to launch date
- live/upcoming broadcast state
- Launch Library webcast/manual URL provenance

Confidence levels are intentionally conservative:

- `official_confirmed`
- `multi_source_confirmed`
- `estimated`
- `unverified`
- `conflicting`

Admins must still verify before publishing.

## Conflict Handling

Conflicts are detected when:

- the launch-level YouTube URL points to a different video id
- an approved/published video already exists for the launch
- the candidate channel differs from the configured official channel id
- the same provider video id belongs to a different launch

Conflicts are stored as open `SourceConflict` records on the launch and summarized in audit logs. Existing approved or published records are never overwritten silently.

## Admin Review

Admin routes:

```text
/admin/videos
/admin/launches/[id]/videos
```

Capabilities:

- list video candidates
- filter by status, launch, provider, confidence, and live state
- run discovery for a launch
- manually add a YouTube URL
- review metadata and conflicts
- approve, reject, publish, or archive records

Researchers can add manual candidates. Approval and publishing remain protected by the approval permission model.

## Public Embed Selection

Public launch pages only embed a video when:

- the parent launch is published
- the `VideoRecord` belongs to that launch
- the video record is approved or published

Draft, rejected, archived, imported, or otherwise unreviewed candidates are never rendered publicly. The embed uses `youtube-nocookie.com` and does not autoplay with sound.

## Scripts

Dry-run without database writes:

```bash
cd apps/web
npm run youtube:dry-run
```

Live discovery for a launch:

```bash
cd apps/web
ENABLE_YOUTUBE_SYNC=true npm run youtube:discover -- --launch-id LAUNCH_ID
```

Admin UI discovery is preferred because it keeps review context closer to the launch record.

## Quota And Limitations

- YouTube search consumes quota; configure channel id and keep discovery manual.
- No automatic scheduled sync exists yet.
- No YouTube IFrame Player API control or live mission telemetry is implemented.
- No OpenAI summarization is implemented in Stage 7.
- Candidate matching is heuristic and intentionally requires admin review.

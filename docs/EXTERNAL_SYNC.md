# External Sync

## Source Hierarchy

Primary truth remains official sources:

- official SpaceX pages
- official SpaceX YouTube
- NASA pages for NASA missions
- FAA pages for regulatory context

Launch Library 2 by The Space Devs is used as a structured API source for manifest discovery and calendar-oriented launch data. It does not automatically override primary official sources.

Prepared secondary source architecture:

- Spaceflight Now
- NASASpaceflight
- Next Spaceflight

Secondary sources must never override primary official records.

## Launch Library Sync

The sync layer lives in:

```text
apps/web/lib/server/sync
```

Files:

- `launch-library.ts` fetches Launch Library 2 data.
- `normalizers.ts` maps external launch records into internal launch drafts.
- `conflicts.ts` compares imported values with existing records.
- `sync-service.ts` persists sync runs, import records, sources, conflicts, and audit logs.
- `types.ts` defines sync-specific shapes.

Default base URL:

```text
https://ll.thespacedevs.com/2.3.0
```

The implementation supports no-key mode. If `LAUNCH_LIBRARY_API_KEY` is configured, the server sends it only from server-side sync code.

## Public Safety

Imported records are never public by default.

Launch imports are created or updated as:

- `publishStatus = draft`
- `isPublished = false`
- `confidenceLevel = estimated`
- `sourceRecords` attached
- `ExternalImportRecord` stored with raw and normalized payloads
- `ExternalSyncRun` stored with run summary

Public pages already filter to `publishStatus = published` and `isPublished = true`, so imported drafts do not appear on the home page, upcoming launches, calendar, past launches, or launch detail routes until an admin approves and publishes them.

## Conflict Detection

Matching order:

1. `externalProvider + externalId`
2. slug
3. mission name plus approximate launch date

Compared fields:

- mission name
- UTC launch date
- rocket
- launch pad
- status
- orbit/trajectory
- official URL
- YouTube/webcast URL placeholder

If an existing record is approved or published, the sync does not overwrite it. Differences create or update `SourceConflict` records for admin review.

## Manual Sync

Admin UI:

```text
/admin/sync
```

Only admins can run sync. The action is rate-limited and audited.

Environment gate:

```text
ENABLE_EXTERNAL_SYNC="true"
```

Local dry-run:

```bash
cd apps/web
npm run sync:dry-run
```

Live CLI sync, still not auto-publishing:

```bash
cd apps/web
npm run sync:launch-library -- --mode upcoming
```

## Known Limitations

- No scheduled/automatic sync yet.
- No YouTube Data API enrichment yet.
- No OpenAI conflict summaries yet.
- Launch Library image metadata is stored as external metadata but not displayed by default.
- Conflict resolution is manual through admin review.
- API rate limits should be monitored before production scheduling.

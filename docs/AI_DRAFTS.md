# AI Drafts

Stage 8 adds OpenAI-assisted admin drafting. AI output is never published directly.

## Environment

```text
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4.1-mini
ENABLE_AI_DRAFTS=false
```

Rules:

- `OPENAI_API_KEY` is server-only.
- `ENABLE_AI_DRAFTS=false` disables real API calls.
- If AI is enabled but no key exists, deterministic mock drafts are generated.
- Admin UI shows enabled/disabled and real/mock mode.

## Service Architecture

Server-only AI modules live in:

```text
apps/web/lib/server/ai
```

Files:

- `openai-client.ts` - OpenAI Responses API request wrapper.
- `prompts.ts` - user prompt assembly from structured DB context and sources.
- `schemas.ts` - Zod validation and JSON Schemas for structured output.
- `safety.ts` - safety prompt and safe metadata helpers.
- `service.ts` - context loading, mock/real generation, validation, persistence, and audit events.
- `types.ts` - shared AI service types.

The implementation uses OpenAI structured JSON output concepts documented by OpenAI:

- https://platform.openai.com/docs/guides/structured-outputs
- https://platform.openai.com/docs/api-reference/responses

## Supported Draft Types

Structured schemas are implemented for:

- Launch summary drafts
- Article drafts
- News summary drafts
- FAQ drafts
- SEO drafts
- Timeline suggestion drafts
- Source comparison drafts

Every AI response is validated server-side. Invalid output is saved as a rejected failed attempt and cannot be merged.

## Safety Rules

The system prompt requires AI to:

- use only provided source records and database context
- avoid invented dates, rockets, payloads, outcomes, quotes, telemetry, or official links
- put missing facts in `missingData`
- put conflicts in risk notes or conflict warnings
- never claim real-time telemetry
- never present estimates as official
- keep RU/EN content semantically aligned
- return schema-valid JSON only

## Admin Workflow

AI generation buttons are available on:

- launch detail pages
- article detail pages
- news detail pages
- FAQ admin page
- source pages
- audit page
- Launch Library sync page

The AI Draft Center lives at:

```text
/admin/ai-drafts
/admin/ai-drafts/[id]
```

Admins can:

- filter drafts
- inspect RU/EN previews
- inspect structured JSON
- review source notes
- review confidence notes
- review risk notes
- approve
- reject
- archive
- merge approved drafts into editable draft content

Approving an AI draft does not publish public content. Publishing still requires the normal approval workflow.

## Merge Policy

Merge is allowed only after draft approval. Merge is blocked for approved or published target records.

Supported merge targets:

- launch summaries into launch draft fields
- launch SEO into launch draft SEO fields
- launch article drafts into new draft article records
- timeline suggestions into draft timeline events
- article drafts into draft article fields
- news summaries into draft news fields
- FAQ drafts into draft FAQ records

Source comparison drafts are review notes only and are not mergeable.

## Audit And Rate Limits

AI requests use the existing admin write limiter.

Audit events:

- `ai_generate_requested`
- `ai_generate_succeeded`
- `ai_generate_failed`
- `ai_draft_approved`
- `ai_draft_rejected`
- `ai_draft_merged`
- `ai_draft_archived`

Audit metadata stores safe task/provider/model/source-count details, not prompts with secrets and never API keys.

## Dry Run

Dry-run performs zero database writes:

```bash
cd apps/web
npm run ai:dry-run
```

Optional task selection:

```bash
cd apps/web
npm run ai:dry-run -- --task source_comparison
```

## Known Limitations

- No streaming UI.
- No background AI queue.
- No automatic source ingestion from arbitrary URLs.
- No AI publishing or approval bypass.
- Mock drafts are deterministic and intended for local workflow testing.
- Real OpenAI calls require `ENABLE_AI_DRAFTS=true` and `OPENAI_API_KEY`.

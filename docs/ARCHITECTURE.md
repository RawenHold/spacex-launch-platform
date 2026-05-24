# SpaceX Project Architecture

## Product Overview

SpaceX is a bilingual RU/EN interactive launch platform. It will present upcoming and past SpaceX launches, mission detail pages, launch calendar, YouTube embeds, countdowns, planned/estimated timelines, cinematic 2.5D launch visualization, articles, news, FAQ, and an admin panel with AI draft creation and explicit approval before publishing.

The site must be source-transparent. If data is planned, estimated, unverified, or conflicting, the UI and admin tools must say so clearly.

## Current Repository Audit

Current path: `C:\Users\SpaceX\Documents\SpaceX`.

Observed structure:

- Root is the cloned `VoltAgent/awesome-design-md` repository content.
- `design-md/` contains DESIGN.md references, including `design-md/spacex/DESIGN.md`.
- `shadcn-ui/` is a nested clone of `shadcn-ui/ui`.
- No root `package.json`.
- No root `app/`, `pages/`, `src/`, `components/`, `components.json`, `tailwind.config.*`, or `vite.config.*` existed before this planning scaffold.
- Root package manager is not defined because the root is not an app yet.

shadcn reference findings:

- `shadcn-ui/package.json` is a pnpm workspace.
- Main shadcn app is `shadcn-ui/apps/v4`, using Next.js App Router, TypeScript, React, Tailwind v4 style CSS variables, and pnpm.
- `shadcn-ui/apps/v4/components.json` uses `new-york`, RSC, TSX, neutral base color, CSS variables, aliases under `@/`, and `lucide` icon library.
- UI source reference exists at `shadcn-ui/apps/v4/registry/new-york-v4/ui`.
- Useful blocks exist under `shadcn-ui/apps/v4/registry/new-york-v4/blocks`, especially dashboard, sidebar, login, and signup examples.

## Architecture Decision

Recommended application architecture for Stage 2:

- Framework: Next.js App Router.
- Language: TypeScript.
- Package manager: pnpm, matching local `shadcn-ui`.
- Styling: Tailwind CSS v4 with CSS variables and shadcn/ui semantic tokens.
- UI system: shadcn/ui `new-york` style, lucide icons, local `shadcn-ui` repository as reference.
- Data layer in v1: typed mock/static data plus source metadata.
- Backend in v2+: Supabase Postgres/Auth/Storage/Edge Functions or equivalent, with RLS and strict admin roles.

Do not initialize the full app inside this step. This repository is currently a design/reference workspace, so Stage 2 should either create a new app folder such as `apps/web` or convert the root intentionally.

## MVP Scope

MVP v1 includes:

- Public home page.
- Upcoming launches.
- Past launches.
- Launch calendar shell.
- Mission detail page.
- YouTube embed support.
- Countdown component.
- Planned/estimated mission timeline.
- Initial 2.5D launch animation component.
- Bilingual RU/EN routing and content shape.
- Admin route skeleton and data model prepared for approvals.

MVP v1 does not need:

- Real-time official telemetry.
- Automated source sync.
- Production CMS.
- Fully automated AI publishing.
- Notification system.

## Proposed Folder Structure

Recommended app structure for Stage 2:

```text
apps/web/
  app/
    [locale]/
      page.tsx
      launches/
        page.tsx
        upcoming/page.tsx
        past/page.tsx
        [slug]/page.tsx
      calendar/page.tsx
      articles/page.tsx
      news/page.tsx
      faq/page.tsx
    admin/
      page.tsx
      launches/page.tsx
      drafts/page.tsx
      sources/page.tsx
      settings/page.tsx
    api/
      launches/route.ts
      youtube/route.ts
  components/
    launch/
    mission/
    animation/
    admin/
    layout/
    ui/
  data/
    mock-launches.ts
  lib/
    i18n/
    sources/
    youtube/
    launch-library/
    confidence/
    utils.ts
  styles/
    globals.css
  types/
    spacex.ts
```

The current scaffold uses root-level `src/` only for safe shared types and data references before the real app exists.

## Route Structure

Public:

- `/` redirects to `/en` or selected locale.
- `/en`, `/ru`.
- `/en/launches`, `/ru/launches`.
- `/en/launches/upcoming`, `/ru/launches/upcoming`.
- `/en/launches/past`, `/ru/launches/past`.
- `/en/launches/[slug]`, `/ru/launches/[slug]`.
- `/en/calendar`, `/ru/calendar`.
- `/en/articles`, `/ru/articles`.
- `/en/news`, `/ru/news`.
- `/en/faq`, `/ru/faq`.

Admin:

- `/admin`.
- `/admin/launches`.
- `/admin/launches/[id]`.
- `/admin/drafts`.
- `/admin/sources`.
- `/admin/articles`.
- `/admin/news`.
- `/admin/settings`.

API route handlers:

- `/api/launches`.
- `/api/launches/[id]`.
- `/api/sync/launch-library`.
- `/api/youtube/videos`.
- `/api/admin/drafts`.
- `/api/admin/approvals`.

## Data Model Proposal

Core entities:

- `Launch`: mission name, slug, status, window, rocket, pad, timeline, videos, source records, confidence.
- `Rocket`: abstract rocket metadata and reusable vehicle family labels.
- `LaunchPad`: location, agency/operator, coordinates, source metadata.
- `MissionTimelineEvent`: event type, planned/estimated/actual time, mission elapsed time, source and confidence.
- `SourceRecord`: source type, URL, publisher, fetched time, claim type, confidence, notes.
- `VideoRecord`: YouTube video ID, channel, live/upcoming/completed state, source.
- `Article`, `NewsItem`, `FAQItem`.
- `AdminUser`: role, locale, status.
- `AIDraft`: target entity, generated fields, citations, conflict summary, review state.
- `ApprovalStatus`: draft, pending review, approved, rejected, published, archived.
- `DataConfidenceLevel`: official confirmed, admin verified, multi-source confirmed, estimated, unverified, conflicting.
- `Locale`: `en`, `ru`, later `es`, `it`, `fr`.

## Component Hierarchy

Public shell:

- `RootLayout`
- `LocaleLayout`
- `PublicHeader`
- `MissionHero`
- `LaunchStatusStrip`
- `LaunchCard`
- `LaunchCountdown`
- `MissionTimeline`
- `LaunchAnimation2D5`
- `SourceConfidenceBadge`
- `YouTubeEmbed`
- `ArticleCard`
- `FAQAccordion`
- `PublicFooter`

Admin shell:

- `AdminLayout`
- `AdminSidebar`
- `AdminTopStatusBar`
- `LaunchDataTable`
- `SourceConflictPanel`
- `AIDraftQueue`
- `DraftDiffViewer`
- `ApprovalControls`
- `SourceRecordDrawer`

Use shadcn/ui primitives for the base composition and create project components as wrappers.

## API Integration Plan

Primary sources:

- Official SpaceX pages.
- Official SpaceX YouTube channel.
- NASA pages for NASA-related missions.
- FAA pages for regulatory information.

Structured/API sources:

- The Space Devs Launch Library 2 API for launch and calendar data.
- YouTube IFrame Player API for embeds and playback control.
- YouTube Data API only if configured via environment variables.

Secondary sources:

- Spaceflight Now.
- NASASpaceflight.
- Next Spaceflight.

Rules:

- Secondary sources never override primary official sources.
- Store all source records when conflict exists.
- Show admin warnings for conflicts.
- AI may summarize conflicts but must not silently choose a winner.
- Deprecated or unofficial SpaceX APIs are low-trust unless manually verified.

## Admin Architecture

Admin should be implemented as a protected route group. In v1 it can be a shell with mock data. In v2 it should use Supabase Auth or equivalent for:

- Admin login.
- Role-based authorization.
- RLS-protected content tables.
- Audit logs.
- Draft approval workflow.

Suggested roles:

- `viewer`: read admin data only.
- `editor`: create and edit drafts.
- `verifier`: mark sources as admin verified.
- `publisher`: approve and publish.
- `owner`: manage roles and settings.

## AI Draft Workflow

AI assistant behavior:

1. Admin selects target: launch, article, news item, FAQ, or timeline.
2. AI receives source records and current draft state.
3. AI creates a draft only.
4. Draft includes generated content, cited sources, confidence labels, and conflict notes.
5. Admin reviews diff and source list.
6. Admin approves, rejects, or requests changes.
7. Only approved content can be published.

Hard rule: AI cannot publish directly.

## Approval Workflow

Status flow:

```text
draft -> pending_review -> approved -> published
draft -> pending_review -> rejected
published -> archived
```

Every state transition should record:

- Actor.
- Timestamp.
- Entity.
- Previous state.
- Next state.
- Optional reason.
- Source confidence snapshot.

## Source Verification Model

Confidence labels:

- `official_confirmed`: primary official source directly confirms the claim.
- `admin_verified`: admin manually verified the claim.
- `multi_source_confirmed`: multiple credible sources agree.
- `estimated`: plausible but not official or confirmed.
- `unverified`: single or weak source.
- `conflicting`: stored sources disagree.

Display rules:

- Public mission facts always show confidence where accuracy matters.
- Timeline events show planned/estimated/actual labels.
- Admin shows raw source records and conflict warnings.
- Conflicting records block publish unless an authorized admin resolves or explicitly publishes with warning.

## Environment Variables

Likely variables for v2/v3:

```text
NEXT_PUBLIC_SITE_URL=
NEXT_PUBLIC_DEFAULT_LOCALE=en
NEXT_PUBLIC_SUPPORTED_LOCALES=en,ru

LAUNCH_LIBRARY_BASE_URL=https://ll.thespacedevs.com/2.3.0
YOUTUBE_API_KEY=
YOUTUBE_SPACEX_CHANNEL_ID=

NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=

OPENAI_API_KEY=
AI_DRAFT_MODEL=
ADMIN_SESSION_SECRET=
```

Security note: never expose service role or secret keys to the browser. In Next.js, any `NEXT_PUBLIC_` variable is public.

## Security Considerations

- Admin routes require authentication and authorization.
- Publish operations require server-side role checks.
- Supabase tables in exposed schemas must use RLS.
- Store admin roles in trusted app metadata or database tables, not user-editable metadata.
- Service role keys stay server-only.
- Source sync jobs must validate and normalize external data.
- YouTube embeds should use safe iframe attributes.
- AI draft prompts must include source data and must be logged for auditability where appropriate.
- Content publishing requires CSRF/session protection appropriate to the auth strategy.

Before implementing Supabase features, verify current Supabase docs and changelog because auth, SSR helpers, CLI, and security recommendations change over time.

## v2 Roadmap

- Automated Launch Library sync.
- YouTube video discovery.
- Source record ingestion and conflict detection.
- Supabase-backed CMS tables.
- AI draft generation for articles/news/FAQ/timeline summaries.
- Approval workflow UI.
- Admin audit log.

## v3 Roadmap

- Live mission mode.
- Admin live control room.
- Replay mode for past missions.
- Notifications.
- Stronger 2.5D/3D animation.
- Multi-source verification dashboard.
- Event-by-event live annotations with explicit confidence state.

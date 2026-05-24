# SpaceX MVP Roadmap

## Stage 1: Foundation

Goal: understand the workspace and create a safe product foundation before building UI.

Tasks:

- Audit repository structure.
- Identify framework, language, package manager, routing, styling, and shadcn setup.
- Find SpaceX and related DESIGN.md files.
- Read and adapt SpaceX design guidance.
- Create design system reference.
- Create architecture reference.
- Create MVP roadmap.
- Add shared type definitions.
- Add design tokens.
- Add mock launch data.
- Add confidence/source helper.

Exit criteria:

- `docs/DESIGN_SYSTEM.md` exists.
- `docs/ARCHITECTURE.md` exists.
- `docs/MVP_ROADMAP.md` exists.
- Core domain types exist.
- Mock data shape exists.
- No full UI has been implemented.

## Stage 2: Public Launch Experience

Goal: build the first usable public website experience with mock/static data.

Tasks:

- Create the actual app structure, preferably `apps/web` with Next.js App Router, TypeScript, pnpm, Tailwind v4, and shadcn/ui.
- Configure bilingual routing for `en` and `ru`.
- Add base layout and public navigation.
- Build home page.
- Build upcoming launches page.
- Build past launches page.
- Build launch detail page.
- Build launch calendar page.
- Add YouTube embed component.
- Add countdown component.
- Add mission timeline component.
- Add source confidence badges.
- Add initial cinematic 2.5D launch animation component.
- Add responsive behavior so mobile does not break.
- Add mock data-backed rendering.

Suggested shadcn/ui components:

- `Button`, `Badge`, `Card`, `Tabs`, `Accordion`, `Tooltip`, `HoverCard`, `Separator`, `Skeleton`, `Progress`, `AspectRatio`, `NavigationMenu`.

Exit criteria:

- Public pages render in EN/RU.
- Launch detail page shows mission facts, countdown or result, YouTube embed, timeline, and source confidence.
- Timeline clearly labels planned/estimated/actual values.
- 2.5D animation has reduced-motion support.
- Build, lint, and typecheck pass.

## Stage 3: Admin, AI Drafts, And Verification

Goal: prepare protected operational workflows without letting AI publish directly.

Tasks:

- Add `/admin` route group.
- Add authentication architecture.
- Define roles: viewer, editor, verifier, publisher, owner.
- Add admin shell with sidebar and status strip.
- Add launch CRUD screens.
- Add source record management.
- Add source conflict warnings.
- Add AI draft queue.
- Add AI draft creation flow.
- Add draft diff/review UI.
- Add approval workflow.
- Add data sync placeholders.
- Add audit log model.
- Add quality checks for source confidence before publishing.

Suggested shadcn/ui components:

- `Sidebar`, `Table`, `Card`, `Sheet`, `Dialog`, `AlertDialog`, `Alert`, `Badge`, `DropdownMenu`, `Command`, `Form`, `Field`, `Input`, `Textarea`, `Select`, `Switch`, `Tabs`, `ScrollArea`, `DataTable` pattern.

Exit criteria:

- Admin can create/edit mock launch records.
- AI can create drafts only.
- Publishing requires explicit approval.
- Conflicting source data is visible and blocks normal publish.
- Security model is documented and ready for Supabase implementation.

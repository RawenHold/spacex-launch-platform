# SpaceX Project Design System

This file adapts the local `design-md/spacex/DESIGN.md` reference into an original product direction for this project. The intent is SpaceX-inspired, not SpaceX-copied: no protected logos, proprietary layouts, official media, or trademark-heavy brand imitation unless explicitly provided and legally allowed.

## Visual Direction

The product should feel like a cinematic launch platform crossed with a mission-control console. Public pages use a mostly black canvas, white industrial typography, sparse chrome, full-bleed launch atmosphere, and precise technical data. Admin pages should be denser, quieter, and operational.

Core principles:

- Dark-first interface with high contrast.
- Full-bleed launch atmosphere on public hero surfaces.
- Data and source transparency visible near mission facts.
- Minimal decoration. Use vector trajectories, grid lines, coordinate marks, timeline rails, and telemetry-like labels as the technical layer.
- Custom rocket visuals may resemble Falcon 9 or Starship silhouettes in an abstract/vector way, but must not copy official assets.
- Do not present estimated data as official telemetry.

## Color System

Base colors are adapted from the local SpaceX design reference, with extra semantic states for data confidence and admin workflow.

| Token | Hex | Use |
| --- | --- | --- |
| `canvas-black` | `#000000` | Primary public background |
| `canvas-raised` | `#08090b` | Raised mission-control surfaces |
| `canvas-panel` | `#101216` | Admin panels, dense data areas |
| `text-primary` | `#ffffff` | Primary text on dark |
| `text-secondary` | `#d8dce3` | Secondary text |
| `text-muted` | `#8d96a6` | Muted labels and metadata |
| `hairline` | `#30343c` | Borders, dividers, timeline rails |
| `panel-hairline` | `#1b2028` | Subtle panel separators |
| `signal-blue` | `#8ab4ff` | Links, active focus, verified technical affordances |
| `signal-green` | `#41d392` | Official/Admin verified/success |
| `signal-amber` | `#f6c15b` | Estimated/conflicting warning |
| `signal-red` | `#ff6b6b` | Destructive/error/unverified risk |
| `orbital-cyan` | `#7de7ff` | Trajectory and map/orbit accents |

shadcn/ui implementation should map these through semantic CSS variables rather than raw Tailwind colors. Use `bg-background`, `text-foreground`, `border-border`, `bg-card`, `text-muted-foreground`, and project-specific tokens for confidence levels.

## Typography

Use an industrial sans direction inspired by DIN typography. Prefer legally available fonts.

Recommended stack:

- Display: `D-DIN`, `DIN 2014`, `Arial Narrow`, `Inter Tight`, `Arial`, sans-serif.
- UI/body: `Inter`, `Geist`, `Arial`, sans-serif.
- Technical numeric labels: `Geist Mono`, `IBM Plex Mono`, ui-monospace.

Rules:

- Public hero and mission titles: uppercase, condensed, bold, positive letter spacing.
- Admin headings: smaller, sentence case is allowed where clarity beats cinema.
- Telemetry labels: compact uppercase with mono numerals.
- Do not scale font size directly with viewport width. Use breakpoint steps.
- Russian text must not be forced into unreadable uppercase in long passages. Use uppercase only for short labels, mission names, and technical badges.

Suggested scale:

| Token | Size | Weight | Line Height | Use |
| --- | --- | --- | --- | --- |
| `display-hero` | 72-80px desktop, 40-48px mobile | 700 | 0.95-1.05 | First-viewport mission/product title |
| `display-section` | 44-56px desktop, 32-40px mobile | 700 | 1.05-1.15 | Public section titles |
| `heading-panel` | 20-28px | 600-700 | 1.2 | Cards, admin sections |
| `body` | 16px | 400 | 1.5-1.7 | Main text |
| `label` | 11-13px | 600-700 | 1.1 | Uppercase metadata |
| `mono-data` | 12-15px | 400-600 | 1.3 | Countdown, event time, source state |

## Spacing And Grid

- Base spacing unit: 8px.
- Public pages use wide cinematic sections, but launch data must stay in readable constrained columns.
- Mission-control surfaces use dense grids with 16px and 24px gutters.
- Desktop content width: 1200-1440px.
- Admin shell: left navigation, top status strip, main workspace, optional right details panel.
- Avoid nested cards. Use cards only for repeated items, modals, and genuinely framed tools.

## Motion

Motion should feel like aerospace instrumentation, not generic page animation.

- Countdown ticks: subtle, deterministic, no bounce.
- Timeline events: reveal in mission order with short fades or line sweeps.
- Launch animation: 2.5D parallax, rocket plume, stage separation, booster return, payload/orbit line.
- Respect `prefers-reduced-motion`: freeze decorative motion and provide still states.
- Use motion to communicate phase changes, not as decoration.
- Never imply live telemetry when the animation is driven by planned or estimated data.

## Component Rules

Use shadcn/ui where it fits the product surface:

- Navigation: `NavigationMenu`, `Breadcrumb`, `Tabs`, `Sidebar`.
- Actions: `Button`, `ButtonGroup`, `DropdownMenu`.
- Data status: `Badge`, `Alert`, `Tooltip`, `HoverCard`.
- Mission/admin data: `Card`, `Table`, `Chart`, `Progress`, `Separator`, `ScrollArea`.
- Forms: `Field`, `FieldGroup`, `Input`, `Textarea`, `Select`, `Switch`, `Checkbox`, `RadioGroup`, `ToggleGroup`.
- Overlays: `Dialog` for focused tasks, `Sheet` for side details, `AlertDialog` for destructive actions.
- Loading/empty: `Skeleton`, `Spinner`, `Empty`.

shadcn rules to preserve:

- Use semantic colors and CSS variables, not raw color utility overrides.
- Use `gap-*`, not `space-x-*` or `space-y-*`.
- Use full `CardHeader`, `CardContent`, `CardFooter` composition.
- Dialog, Sheet, and Drawer must have accessible titles.
- Use `Badge` for statuses instead of custom spans.
- Icons should come from the configured icon library. Local shadcn reference uses `lucide`.

## Mission-Control UI Patterns

Mission-control panels should prioritize fast scanning:

- Top strip: current time, selected launch, source freshness, confidence state.
- Left navigation: Launches, Calendar, Missions, Articles, News, Sources, AI Drafts, Settings.
- Main panel: tables, timelines, review queues, source conflicts.
- Right panel: selected source records, confidence rationale, audit trail.
- Use compact labels, mono timestamps, and visible state transitions.

## Launch Card Pattern

Each launch card should include:

- Mission name.
- Rocket and launch pad.
- Planned/actual launch time with timezone clarity.
- Confidence badge.
- Launch status.
- Primary source link when available.
- YouTube/live state when available.
- CTA to mission page.

Card behavior:

- Upcoming launch card may include countdown.
- Past launch card emphasizes result, media, and timeline replay.
- Estimated dates must show `Estimated`, not just a date.

## Timeline Pattern

Timeline events include Liftoff, Max Q, MECO, Stage Separation, SES, SECO, Landing Burn, Booster Landing, and Payload Deployment where applicable.

Rules:

- Every event has `planned`, `estimated`, `actual`, or `unknown` timing.
- Planned events use relative mission elapsed time when exact UTC time is not official.
- Conflicting event times show an admin warning before public publishing.
- Public pages show confidence and source transparency without overwhelming the user.
- Live mode in later phases must separate planned timeline from observed updates.

## Admin Dashboard Pattern

Admin should feel operational rather than cinematic:

- Dense but readable tables.
- Clear review queues for AI drafts and source conflicts.
- Diff views for AI-created content.
- Explicit publish controls with approval state.
- No AI draft is public by default.
- Destructive or publishing actions require confirmation.

## Accessibility

- Maintain strong contrast on dark surfaces.
- Keep focus rings visible.
- Do not rely on color alone for confidence or approval states.
- Provide text alternatives for custom launch animation states.
- YouTube embeds need titles and fallback links.
- Countdown must have sensible ARIA behavior and should not spam screen readers every second.
- Touch targets should be at least 44px.

## Responsive Behavior

Mobile is secondary, but must not break:

- Navigation collapses below tablet widths.
- Hero typography steps down at breakpoints.
- Launch cards become a single column.
- Mission timeline becomes vertical.
- Admin tables can use horizontal scroll or card summaries on narrow screens.
- Animation should crop around the vehicle/trajectory focal point.

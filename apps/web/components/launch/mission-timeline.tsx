import { Badge } from "@/components/ui/badge"
import { localize } from "@/lib/i18n/config"
import type { Dictionary } from "@/lib/i18n/get-dictionary"
import type { Locale, MissionTimelineEvent } from "@/types/space"

export function MissionTimeline({
  events,
  locale,
  dictionary,
  activeIndex = 0,
  compact = false,
}: {
  events: MissionTimelineEvent[]
  locale: Locale
  dictionary: Dictionary
  activeIndex?: number
  compact?: boolean
}) {
  return (
    <div
      className={
        compact
          ? "flex flex-col gap-3"
          : "grid gap-3 lg:grid-cols-[repeat(auto-fit,minmax(145px,1fr))]"
      }
    >
      {events.map((event, index) => {
        const isActive = index === activeIndex
        return (
          <article
            key={event.id}
            className={
              isActive
                ? "relative rounded-lg border border-signal-blue bg-signal-blue/10 p-4"
                : "relative rounded-lg border border-border/70 bg-card/70 p-4"
            }
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-xs font-black text-foreground">{event.relativeTime}</span>
              <Badge variant={event.status === "confirmed" ? "success" : "warning"}>
                {dictionary.timelineStatus[event.status]}
              </Badge>
            </div>
            <h3 className="mt-4 text-sm font-black uppercase tracking-[0.1em] text-foreground">
              {localize(event.title, locale)}
            </h3>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              {localize(event.description, locale)}
            </p>
            <span
              className={
                isActive
                  ? "absolute -bottom-1 left-4 h-1 w-12 rounded-full bg-signal-blue"
                  : "absolute -bottom-px left-4 h-px w-10 bg-border"
              }
              aria-hidden="true"
            />
          </article>
        )
      })}
    </div>
  )
}

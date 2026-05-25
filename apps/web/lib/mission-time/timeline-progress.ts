import { parseRelativeMissionTime } from "@/lib/mission-time/mission-clock"
import type { TimelineProgressSnapshot } from "@/lib/mission-time/types"
import type { MissionTimelineEvent } from "@/types/space"

export function sortTimelineEventsByMissionTime(events: MissionTimelineEvent[]) {
  return [...events].sort((a, b) => {
    const byTime = parseRelativeMissionTime(a.relativeTime) - parseRelativeMissionTime(b.relativeTime)
    return byTime || a.title.en.localeCompare(b.title.en)
  })
}

export function computeTimelineProgress(
  events: MissionTimelineEvent[],
  missionTimeSeconds: number
): TimelineProgressSnapshot {
  const sorted = sortTimelineEventsByMissionTime(events)

  if (sorted.length === 0) {
    return {
      events: sorted,
      activeIndex: -1,
      progressPercent: 0,
    }
  }

  let activeIndex = 0
  for (let index = 0; index < sorted.length; index += 1) {
    if (parseRelativeMissionTime(sorted[index].relativeTime) <= missionTimeSeconds) {
      activeIndex = index
    }
  }

  const firstTime = parseRelativeMissionTime(sorted[0].relativeTime)
  const lastTime = parseRelativeMissionTime(sorted[sorted.length - 1].relativeTime)
  const span = Math.max(1, lastTime - firstTime)
  const progressPercent = Math.max(
    0,
    Math.min(100, ((missionTimeSeconds - firstTime) / span) * 100)
  )

  return {
    events: sorted,
    activeEvent: sorted[activeIndex],
    nextEvent: sorted.find((event) => parseRelativeMissionTime(event.relativeTime) > missionTimeSeconds),
    activeIndex,
    progressPercent,
  }
}

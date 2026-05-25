import {
  computeMissionClock,
  formatMissionTime,
} from "../lib/mission-time/mission-clock"
import { computeAnimationProgress } from "../lib/mission-time/animation-progress"
import { computeTimelineProgress } from "../lib/mission-time/timeline-progress"
import type { MissionTimelineEvent } from "../types/space"

const fixtureTimeline: MissionTimelineEvent[] = [
  {
    id: "liftoff",
    type: "liftoff",
    title: { en: "Liftoff", ru: "Liftoff" },
    description: { en: "Vehicle clears the pad.", ru: "Vehicle clears the pad." },
    relativeTime: "T+00:00",
    status: "confirmed",
    confidenceLevel: "admin_verified",
  },
  {
    id: "max-q",
    type: "max_q",
    title: { en: "Max Q", ru: "Max Q" },
    description: { en: "Maximum aerodynamic pressure.", ru: "Maximum aerodynamic pressure." },
    relativeTime: "T+01:12",
    status: "planned",
    confidenceLevel: "estimated",
  },
  {
    id: "meco",
    type: "meco",
    title: { en: "MECO", ru: "MECO" },
    description: { en: "Main engine cutoff.", ru: "Main engine cutoff." },
    relativeTime: "T+02:28",
    status: "planned",
    confidenceLevel: "estimated",
  },
  {
    id: "stage-separation",
    type: "stage_separation",
    title: { en: "Stage separation", ru: "Stage separation" },
    description: { en: "Booster separates from upper stage.", ru: "Booster separates from upper stage." },
    relativeTime: "T+02:36",
    status: "planned",
    confidenceLevel: "estimated",
  },
  {
    id: "landing",
    type: "booster_landing",
    title: { en: "Booster landing", ru: "Booster landing" },
    description: { en: "Illustrative booster landing marker.", ru: "Illustrative booster landing marker." },
    relativeTime: "T+08:22",
    status: "planned",
    confidenceLevel: "estimated",
  },
  {
    id: "payload",
    type: "payload_deployment",
    title: { en: "Payload deploy", ru: "Payload deploy" },
    description: { en: "Payload deploy marker.", ru: "Payload deploy marker." },
    relativeTime: "T+54:30",
    status: "planned",
    confidenceLevel: "estimated",
  },
]

const t0 = new Date("2026-05-25T12:00:00.000Z")
const samples = [
  new Date(t0.getTime() - 10 * 60 * 1000),
  new Date(t0.getTime() + 75 * 1000),
  new Date(t0.getTime() + 8 * 60 * 1000),
  new Date(t0.getTime() + 55 * 60 * 1000),
]

const output = samples.map((now) => {
  const clock = computeMissionClock({
    countdownTargetUtc: t0,
    t0Utc: t0,
    mode: now.getTime() > t0.getTime() ? "live" : "planned",
    now,
  })
  const timeline = computeTimelineProgress(fixtureTimeline, clock.missionTimeSeconds)
  const animation = computeAnimationProgress(
    fixtureTimeline,
    clock.missionTimeSeconds,
    now.getTime() > t0.getTime() ? "live" : "planned"
  )

  return {
    nowUtc: now.toISOString(),
    clock: clock.label,
    missionTimeSeconds: clock.missionTimeSeconds,
    activeEvent: timeline.activeEvent?.title.en ?? null,
    nextEvent: timeline.nextEvent?.title.en ?? null,
    timelineProgressPercent: Math.round(timeline.progressPercent),
    animationPhase: animation.phase,
    animationProgressPercent: Math.round(animation.progressPercent),
    humanReadable: formatMissionTime(clock.missionTimeSeconds),
  }
})

console.log(JSON.stringify({ dryRun: true, writes: 0, samples: output }, null, 2))

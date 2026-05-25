import type { MissionTimelineEvent } from "@/types/space"

export type LiveMissionMode =
  | "planned"
  | "live"
  | "replay"
  | "paused"
  | "completed"
  | "scrubbed"
  | "delayed"

export type LiveMissionStreamStatus =
  | "unavailable"
  | "scheduled"
  | "live"
  | "ended"
  | "replay"

export type LiveMissionSourceType =
  | "planned"
  | "admin_confirmed"
  | "estimated"
  | "official_source"
  | "manual_override"

export interface MissionClockInput {
  countdownTargetUtc: string | Date
  t0Utc?: string | Date | null
  mode?: LiveMissionMode
  now?: Date
  replayMissionTimeSeconds?: number | null
}

export interface MissionClockSnapshot {
  missionTimeSeconds: number
  countdownSeconds: number
  isBeforeT0: boolean
  isAfterT0: boolean
  label: string
  targetUtc: string
  t0Utc?: string
}

export interface TimelineProgressSnapshot {
  events: MissionTimelineEvent[]
  activeEvent?: MissionTimelineEvent
  nextEvent?: MissionTimelineEvent
  activeIndex: number
  progressPercent: number
}

export interface AnimationProgressSnapshot {
  progressPercent: number
  phase:
    | "prelaunch"
    | "ignition"
    | "liftoff"
    | "ascent"
    | "max_q"
    | "meco"
    | "stage_separation"
    | "second_engine_start"
    | "seco"
    | "entry_burn"
    | "landing_burn"
    | "booster_landing"
    | "payload_deploy"
    | "completed"
    | "scrubbed"
    | "delayed"
    | "replay"
    | "custom"
  sourceLabel: "planned" | "admin_confirmed" | "estimated" | "replay"
}

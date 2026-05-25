import { parseRelativeMissionTime } from "@/lib/mission-time/mission-clock"
import type {
  AnimationProgressSnapshot,
  LiveMissionMode,
} from "@/lib/mission-time/types"
import type { MissionTimelineEvent, TimelineEventType } from "@/types/space"

const milestoneProgress: Partial<Record<TimelineEventType, number>> = {
  liftoff: 14,
  max_q: 30,
  meco: 44,
  stage_separation: 54,
  ses: 62,
  seco: 72,
  landing_burn: 84,
  booster_landing: 92,
  payload_deployment: 100,
}

function phaseFromEventType(
  type?: TimelineEventType
): AnimationProgressSnapshot["phase"] {
  if (!type) return "prelaunch"
  if (type === "payload_deployment") return "payload_deploy"
  if (type === "ses") return "second_engine_start"
  return type
}

function fallbackProgress(missionTimeSeconds: number) {
  if (missionTimeSeconds < -10) return 4
  if (missionTimeSeconds < 0) return 9
  return Math.max(12, Math.min(100, 12 + missionTimeSeconds / 5))
}

export function computeAnimationProgress(
  events: MissionTimelineEvent[],
  missionTimeSeconds: number,
  mode: LiveMissionMode = "planned"
): AnimationProgressSnapshot {
  if (mode === "scrubbed") {
    return { progressPercent: 0, phase: "scrubbed", sourceLabel: "planned" }
  }

  if (mode === "delayed" || mode === "paused") {
    return { progressPercent: Math.max(0, fallbackProgress(missionTimeSeconds)), phase: "delayed", sourceLabel: "estimated" }
  }

  const milestones = events
    .map((event) => ({
      event,
      time: parseRelativeMissionTime(event.relativeTime),
      progress: milestoneProgress[event.type],
    }))
    .filter(
      (
        item
      ): item is {
        event: MissionTimelineEvent
        time: number
        progress: number
      } => typeof item.progress === "number"
    )
    .sort((a, b) => a.time - b.time)

  if (milestones.length === 0) {
    const progressPercent = fallbackProgress(missionTimeSeconds)
    return {
      progressPercent,
      phase: missionTimeSeconds >= 0 ? "liftoff" : missionTimeSeconds > -10 ? "ignition" : "prelaunch",
      sourceLabel: mode === "replay" ? "replay" : "estimated",
    }
  }

  const previous =
    [...milestones].reverse().find((item) => item.time <= missionTimeSeconds) ?? milestones[0]
  const next = milestones.find((item) => item.time > missionTimeSeconds)

  if (!next) {
    const completed = mode === "completed" || previous.progress >= 100
    return {
      progressPercent: Math.min(100, Math.max(previous.progress, fallbackProgress(missionTimeSeconds))),
      phase: completed ? "completed" : phaseFromEventType(previous.event.type),
      sourceLabel: mode === "replay" ? "replay" : previous.event.status === "confirmed" ? "admin_confirmed" : "planned",
    }
  }

  const timeSpan = Math.max(1, next.time - previous.time)
  const localProgress = Math.max(0, Math.min(1, (missionTimeSeconds - previous.time) / timeSpan))
  const progressPercent =
    previous.progress + (next.progress - previous.progress) * localProgress
  const currentPhase =
    missionTimeSeconds < 0 && previous.event.type === "liftoff"
      ? missionTimeSeconds > -10
        ? "ignition"
        : "prelaunch"
      : phaseFromEventType(previous.event.type)

  return {
    progressPercent: Math.max(0, Math.min(100, progressPercent)),
    phase: currentPhase,
    sourceLabel: mode === "replay" ? "replay" : previous.event.status === "confirmed" ? "admin_confirmed" : "planned",
  }
}

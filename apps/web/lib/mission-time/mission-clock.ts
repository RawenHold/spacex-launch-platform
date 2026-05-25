import type { MissionClockInput, MissionClockSnapshot } from "@/lib/mission-time/types"

function asDate(value: string | Date | null | undefined): Date | undefined {
  if (!value) return undefined
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? undefined : date
}

function pad(value: number) {
  return String(Math.abs(value)).padStart(2, "0")
}

export function parseRelativeMissionTime(relativeTime: string): number {
  const match = relativeTime.trim().match(/^T([+-])(\d{2,3}):(\d{2})(?::(\d{2}))?$/i)
  if (!match) {
    return 0
  }

  const sign = match[1] === "-" ? -1 : 1
  const first = Number(match[2])
  const second = Number(match[3])
  const third = match[4] ? Number(match[4]) : undefined
  const totalSeconds =
    typeof third === "number" ? first * 3600 + second * 60 + third : first * 60 + second

  return sign * totalSeconds
}

export function formatMissionTime(totalSeconds: number): string {
  const rounded = Math.round(totalSeconds)
  const sign = rounded < 0 ? "-" : "+"
  const absolute = Math.abs(rounded)
  const hours = Math.floor(absolute / 3600)
  const minutes = Math.floor((absolute % 3600) / 60)
  const seconds = absolute % 60

  if (hours > 0) {
    return `T${sign}${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
  }

  return `T${sign}${pad(minutes)}:${pad(seconds)}`
}

export function computeMissionClock(input: MissionClockInput): MissionClockSnapshot {
  const now = input.now ?? new Date()
  const target = asDate(input.countdownTargetUtc) ?? now
  const explicitT0 = asDate(input.t0Utc)
  const t0 = explicitT0 ?? target
  const mode = input.mode ?? "planned"

  const replayMissionTimeSeconds =
    mode === "replay" && typeof input.replayMissionTimeSeconds === "number"
      ? input.replayMissionTimeSeconds
      : undefined

  const missionTimeSeconds =
    typeof replayMissionTimeSeconds === "number"
      ? replayMissionTimeSeconds
      : Math.round((now.getTime() - t0.getTime()) / 1000)

  const countdownSeconds = Math.max(0, Math.round((target.getTime() - now.getTime()) / 1000))
  const isBeforeT0 = missionTimeSeconds < 0

  return {
    missionTimeSeconds,
    countdownSeconds,
    isBeforeT0,
    isAfterT0: !isBeforeT0,
    label: formatMissionTime(missionTimeSeconds),
    targetUtc: target.toISOString(),
    t0Utc: t0.toISOString(),
  }
}

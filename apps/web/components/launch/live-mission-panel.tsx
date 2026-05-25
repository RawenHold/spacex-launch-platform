"use client"

import { useEffect, useMemo, useState } from "react"
import { PauseIcon, PlayIcon, RotateCcwIcon, StepForwardIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  computeMissionClock,
  formatMissionTime,
  parseRelativeMissionTime,
} from "@/lib/mission-time/mission-clock"
import { computeTimelineProgress } from "@/lib/mission-time/timeline-progress"
import { computeAnimationProgress } from "@/lib/mission-time/animation-progress"
import { cn } from "@/lib/utils"
import { localize } from "@/lib/i18n/config"
import type { Launch, Locale, LiveMissionMode, LiveMissionStreamStatus } from "@/types/space"

const labels = {
  en: {
    eyebrow: "Live Mission Mode",
    planned: "Planned timeline",
    live: "Live manual mode",
    replay: "Replay",
    paused: "Paused",
    completed: "Completed",
    scrubbed: "Launch scrubbed",
    delayed: "Launch delayed",
    noTelemetry:
      "This panel follows the planned timeline and admin confirmations. It is not official real-time SpaceX telemetry.",
    activeEvent: "Active event",
    nextEvent: "Next event",
    stream: "Stream",
    source: "Source state",
    adminConfirmed: "Admin confirmed",
    estimated: "Estimated",
    plannedState: "Planned",
    skipped: "Skipped",
    failed: "Failed",
    play: "Play replay",
    pause: "Pause replay",
    reset: "Reset replay",
    jump: "Jump to next event",
  },
  ru: {
    eyebrow: "Live Mission Mode",
    planned: "Плановый таймлайн",
    live: "Ручной live-режим",
    replay: "Replay",
    paused: "Пауза",
    completed: "Завершено",
    scrubbed: "Пуск отменен",
    delayed: "Пуск задержан",
    noTelemetry:
      "Панель следует плановому таймлайну и подтверждениям администратора. Это не официальная телеметрия SpaceX в реальном времени.",
    activeEvent: "Активное событие",
    nextEvent: "Следующее событие",
    stream: "Стрим",
    source: "Статус данных",
    adminConfirmed: "Подтверждено админом",
    estimated: "Оценочно",
    plannedState: "План",
    skipped: "Пропущено",
    failed: "Ошибка",
    play: "Запустить replay",
    pause: "Пауза replay",
    reset: "Сбросить replay",
    jump: "К следующему событию",
  },
} as const

const modeVariant: Record<LiveMissionMode, "default" | "secondary" | "warning" | "danger" | "success"> = {
  planned: "secondary",
  live: "danger",
  replay: "default",
  paused: "warning",
  completed: "success",
  scrubbed: "danger",
  delayed: "warning",
}

function getModeLabel(mode: LiveMissionMode, locale: Locale) {
  return labels[locale === "ru" ? "ru" : "en"][mode]
}

function getStreamLabel(status: LiveMissionStreamStatus) {
  const map: Record<LiveMissionStreamStatus, string> = {
    unavailable: "Stream unavailable",
    scheduled: "Stream scheduled",
    live: "Stream live",
    ended: "Stream ended",
    replay: "Replay available",
  }

  return map[status]
}

function statusLabel(status: string, locale: Locale) {
  const copy = labels[locale === "ru" ? "ru" : "en"]
  if (status === "confirmed") return copy.adminConfirmed
  if (status === "estimated") return copy.estimated
  if (status === "skipped") return copy.skipped
  if (status === "failed") return copy.failed
  return copy.plannedState
}

function useMissionNow(mode: LiveMissionMode) {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    if (!["planned", "live", "delayed", "paused"].includes(mode)) return
    const timer = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(timer)
  }, [mode])

  return now
}

export function MissionClock({ label }: { label: string }) {
  return <span className="font-mono text-4xl font-black tracking-[0.08em] text-foreground">{label}</span>
}

export function MissionPhaseBadge({
  mode,
  locale,
}: {
  mode: LiveMissionMode
  locale: Locale
}) {
  return <Badge variant={modeVariant[mode]}>{getModeLabel(mode, locale)}</Badge>
}

export function StreamStatusBadge({ status }: { status: LiveMissionStreamStatus }) {
  const variant = status === "live" ? "danger" : status === "ended" || status === "replay" ? "success" : "secondary"
  return <Badge variant={variant}>{getStreamLabel(status)}</Badge>
}

export function PublicMissionNotice({ mode, locale }: { mode: LiveMissionMode; locale: Locale }) {
  const copy = labels[locale === "ru" ? "ru" : "en"]
  return (
    <div className={cn(
      "rounded-lg border p-4 text-sm leading-6",
      mode === "scrubbed"
        ? "border-signal-red/50 bg-signal-red/10 text-signal-red"
        : mode === "delayed"
          ? "border-signal-amber/50 bg-signal-amber/10 text-signal-amber"
          : "border-signal-blue/40 bg-signal-blue/10 text-signal-blue"
    )}>
      {copy.noTelemetry}
    </div>
  )
}

export function MissionProgressBar({ progress }: { progress: number }) {
  return (
    <div className="h-2 overflow-hidden rounded-full bg-muted">
      <div
        className="h-full rounded-full bg-orbital-cyan transition-[width] duration-500"
        style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
      />
    </div>
  )
}

export function MissionEventMarker({
  active,
  label,
  time,
  status,
}: {
  active: boolean
  label: string
  time: string
  status: string
}) {
  return (
    <div className={cn("min-w-[160px] rounded-lg border p-3", active ? "border-orbital-cyan bg-orbital-cyan/10" : "border-border/70 bg-card/50")}>
      <p className="font-mono text-xs font-black text-signal-blue">{time}</p>
      <p className="mt-2 text-xs font-black uppercase tracking-[0.08em] text-foreground">{label}</p>
      <p className="mt-2 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">{status}</p>
    </div>
  )
}

export function LiveMissionTimeline({
  launch,
  missionTimeSeconds,
  locale,
}: {
  launch: Launch
  missionTimeSeconds: number
  locale: Locale
}) {
  const progress = useMemo(
    () => computeTimelineProgress(launch.timeline, missionTimeSeconds),
    [launch.timeline, missionTimeSeconds]
  )

  return (
    <div className="overflow-x-auto pb-2">
      <div className="flex gap-3">
        {progress.events.map((event, index) => (
          <MissionEventMarker
            key={event.id}
            active={index === progress.activeIndex}
            label={localize(event.title, locale)}
            time={event.relativeTime}
            status={statusLabel(event.status, locale)}
          />
        ))}
      </div>
    </div>
  )
}

export function MissionReplayControls({
  duration,
  missionTimeSeconds,
  playing,
  locale,
  onPlayToggle,
  onSeek,
  onJump,
  onReset,
}: {
  duration: number
  missionTimeSeconds: number
  playing: boolean
  locale: Locale
  onPlayToggle: () => void
  onSeek: (value: number) => void
  onJump: () => void
  onReset: () => void
}) {
  const copy = labels[locale === "ru" ? "ru" : "en"]

  return (
    <div className="rounded-lg border border-border/70 bg-background/50 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" size="sm" variant="outline" onClick={onPlayToggle}>
          {playing ? <PauseIcon data-icon aria-hidden="true" /> : <PlayIcon data-icon aria-hidden="true" />}
          {playing ? copy.pause : copy.play}
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={onJump}>
          <StepForwardIcon data-icon aria-hidden="true" />
          {copy.jump}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onReset}>
          <RotateCcwIcon data-icon aria-hidden="true" />
          {copy.reset}
        </Button>
        <span className="ml-auto font-mono text-xs text-muted-foreground">
          {formatMissionTime(missionTimeSeconds)}
        </span>
      </div>
      <input
        className="mt-4 w-full accent-cyan-300"
        type="range"
        min={0}
        max={Math.max(60, duration)}
        value={Math.max(0, Math.min(duration, missionTimeSeconds))}
        onChange={(event) => onSeek(Number(event.target.value))}
      />
    </div>
  )
}

export function LiveMissionPanel({ launch, locale }: { launch: Launch; locale: Locale }) {
  const initialMode = launch.liveMission?.mode ?? (launch.status === "success" ? "completed" : "planned")
  const [replayPlaying, setReplayPlaying] = useState(false)
  const [replayMissionTimeSeconds, setReplayMissionTimeSeconds] = useState(0)
  const now = useMissionNow(initialMode)
  const state = launch.liveMission
  const mode = state?.mode ?? initialMode
  const streamStatus = state?.streamStatus ?? (launch.videos[0]?.state === "live" ? "live" : "unavailable")
  const clock = computeMissionClock({
    countdownTargetUtc: state?.countdownTargetUtc ?? launch.netUtc,
    t0Utc: state?.t0Utc ?? launch.netUtc,
    mode,
    now,
    replayMissionTimeSeconds: mode === "replay" || mode === "completed" ? replayMissionTimeSeconds : undefined,
  })
  const timelineProgress = computeTimelineProgress(launch.timeline, clock.missionTimeSeconds)
  const animationProgress = computeAnimationProgress(launch.timeline, clock.missionTimeSeconds, mode)
  const copy = labels[locale === "ru" ? "ru" : "en"]
  const replayDuration = Math.max(
    600,
    ...launch.timeline.map((event) => Math.max(0, parseRelativeMissionTime(event.relativeTime) + 120))
  )

  useEffect(() => {
    if (!replayPlaying) return
    const timer = window.setInterval(() => {
      setReplayMissionTimeSeconds((value) => (value >= replayDuration ? replayDuration : value + 1))
    }, 1000)
    return () => window.clearInterval(timer)
  }, [replayDuration, replayPlaying])

  function jumpToNextEvent() {
    const next =
      timelineProgress.nextEvent ??
      launch.timeline.find((event) => parseRelativeMissionTime(event.relativeTime) >= 0)
    if (next) {
      setReplayMissionTimeSeconds(Math.max(0, parseRelativeMissionTime(next.relativeTime)))
    }
  }

  return (
    <section className="mission-panel rounded-xl p-5">
      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="flex flex-col gap-5">
          <div className="flex flex-wrap gap-2">
            <MissionPhaseBadge mode={mode} locale={locale} />
            <StreamStatusBadge status={streamStatus} />
            <Badge variant={animationProgress.sourceLabel === "admin_confirmed" ? "success" : "warning"}>
              {copy.source}: {animationProgress.sourceLabel.replaceAll("_", " ")}
            </Badge>
          </div>
          <div>
            <p className="mission-eyebrow">{copy.eyebrow}</p>
            <div className="mt-3">
              <MissionClock label={clock.label} />
            </div>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {timelineProgress.activeEvent
                ? `${copy.activeEvent}: ${localize(timelineProgress.activeEvent.title, locale)}`
                : copy.planned}
            </p>
            {timelineProgress.nextEvent ? (
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                {copy.nextEvent}: {timelineProgress.nextEvent.relativeTime} ·{" "}
                {localize(timelineProgress.nextEvent.title, locale)}
              </p>
            ) : null}
          </div>
          <MissionProgressBar progress={timelineProgress.progressPercent} />
          {state?.publicBanner ? (
            <div className="rounded-lg border border-signal-amber/50 bg-signal-amber/10 p-4 text-sm leading-6 text-signal-amber">
              {localize(state.publicBanner, locale)}
            </div>
          ) : null}
          <PublicMissionNotice mode={mode} locale={locale} />
          {mode === "replay" || mode === "completed" ? (
            <MissionReplayControls
              duration={replayDuration}
              missionTimeSeconds={clock.missionTimeSeconds}
              playing={replayPlaying}
              locale={locale}
              onPlayToggle={() => setReplayPlaying((value) => !value)}
              onSeek={setReplayMissionTimeSeconds}
              onJump={jumpToNextEvent}
              onReset={() => {
                setReplayPlaying(false)
                setReplayMissionTimeSeconds(0)
              }}
            />
          ) : null}
        </div>

        <div className="flex flex-col gap-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-border/70 bg-card/50 p-4">
              <p className="mission-eyebrow">{copy.stream}</p>
              <p className="mt-2 text-sm text-foreground">{getStreamLabel(streamStatus)}</p>
            </div>
            <div className="rounded-lg border border-border/70 bg-card/50 p-4">
              <p className="mission-eyebrow">Animation</p>
              <p className="mt-2 font-mono text-sm text-foreground">
                {Math.round(animationProgress.progressPercent)}%
              </p>
            </div>
            <div className="rounded-lg border border-border/70 bg-card/50 p-4">
              <p className="mission-eyebrow">Phase</p>
              <p className="mt-2 text-sm text-foreground">{animationProgress.phase.replaceAll("_", " ")}</p>
            </div>
          </div>
          <LiveMissionTimeline
            launch={launch}
            missionTimeSeconds={clock.missionTimeSeconds}
            locale={locale}
          />
        </div>
      </div>
    </section>
  )
}

"use client"

import { useEffect, useMemo, useState, useSyncExternalStore } from "react"

import { computeAnimationProgress } from "@/lib/mission-time/animation-progress"
import { cn } from "@/lib/utils"
import type { LiveMissionMode, MissionTimelineEvent } from "@/types/space"

function useReducedMotion() {
  return useSyncExternalStore(
    (callback) => {
      if (typeof window === "undefined") {
        return () => undefined
      }
      const query = window.matchMedia("(prefers-reduced-motion: reduce)")
      const listener = () => callback()
      query.addEventListener("change", listener)
      return () => query.removeEventListener("change", listener)
    },
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false
  )
}

export function LaunchAnimation2D({
  title,
  description,
  vehicle = "falcon",
  demo = false,
  progress = 42,
  missionTimeSeconds,
  timelineEvents = [],
  missionMode = "planned",
  activePhase,
  replayMode = false,
  className,
}: {
  title: string
  description: string
  vehicle?: "falcon" | "starship"
  demo?: boolean
  progress?: number
  missionTimeSeconds?: number
  timelineEvents?: MissionTimelineEvent[]
  missionMode?: LiveMissionMode
  activePhase?: string
  replayMode?: boolean
  className?: string
}) {
  const reducedMotion = useReducedMotion()
  const computedAnimation = useMemo(() => {
    if (typeof missionTimeSeconds !== "number") {
      return { progressPercent: progress, phase: activePhase ?? "demo" }
    }

    return computeAnimationProgress(timelineEvents, missionTimeSeconds, missionMode)
  }, [activePhase, missionMode, missionTimeSeconds, progress, timelineEvents])
  const computedProgress = computedAnimation.progressPercent
  const [demoProgress, setDemoProgress] = useState(computedProgress)

  useEffect(() => {
    if (!demo || reducedMotion) {
      return
    }
    const timer = window.setInterval(() => {
      setDemoProgress((value) => (value >= 100 ? 0 : value + 1.4))
    }, 140)
    return () => window.clearInterval(timer)
  }, [demo, reducedMotion])

  const phaseProgress = reducedMotion ? computedProgress : demo ? demoProgress : computedProgress
  const phaseLabel = activePhase ?? computedAnimation.phase

  const rocketTransform = useMemo(() => {
    const y = 210 - phaseProgress * 2.4
    const x = phaseProgress > 55 ? 58 + (phaseProgress - 55) * 1.7 : 58 + phaseProgress * 0.35
    return `translate(${x} ${Math.max(-40, y)})`
  }, [phaseProgress])

  const boosterTransform = useMemo(() => {
    const split = Math.max(0, phaseProgress - 45)
    const x = 70 - split * 0.8
    const y = 110 + split * 1.8
    return `translate(${x} ${Math.min(255, y)}) rotate(${Math.min(180, split * 4)})`
  }, [phaseProgress])

  const showSeparation = phaseProgress > 45
  const showPayload = phaseProgress > 72
  const showLanding = phaseProgress > 68

  return (
    <section className={cn("mission-panel overflow-hidden rounded-xl", className)}>
      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.3fr]">
        <div className="flex flex-col justify-between gap-6 p-6">
          <div className="flex flex-col gap-3">
            <p className="mission-eyebrow">Vector flight profile</p>
            <h2 className="text-3xl font-black uppercase tracking-[0.08em] text-foreground">
              {title}
            </h2>
            <p className="text-sm leading-6 text-muted-foreground">{description}</p>
          </div>
          <div className="rounded-lg border border-border/70 bg-background/50 p-4">
            <div className="flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              <span>{replayMode ? "Replay profile" : demo ? "Demo progress" : "Mission profile"}</span>
              <span>{Math.round(phaseProgress)}%</span>
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-orbital-cyan transition-[width]"
                style={{ width: `${phaseProgress}%` }}
              />
            </div>
            <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              Phase: {String(phaseLabel).replaceAll("_", " ")}
            </p>
          </div>
        </div>

        <div className="relative min-h-[440px] overflow-hidden bg-black">
          <div className="absolute inset-0 starfield opacity-70" aria-hidden="true" />
          <div className="absolute inset-0 technical-grid opacity-20" aria-hidden="true" />
          <svg
            role="img"
            aria-label={title}
            viewBox="0 0 760 460"
            className="absolute inset-0 size-full"
          >
            <defs>
              <linearGradient id="horizon" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#7de7ff" stopOpacity="0.26" />
                <stop offset="55%" stopColor="#101216" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#000000" stopOpacity="1" />
              </linearGradient>
              <linearGradient id="plume" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
                <stop offset="55%" stopColor="#f6c15b" stopOpacity="0.75" />
                <stop offset="100%" stopColor="#ff6b6b" stopOpacity="0" />
              </linearGradient>
            </defs>

            <rect width="760" height="460" fill="url(#horizon)" opacity="0.55" />
            <path d="M0 380 C160 320 280 330 420 366 C560 402 650 392 760 352 L760 460 L0 460 Z" fill="#071018" />
            <path d="M24 378 C190 330 312 344 452 372 C560 394 666 382 760 356" fill="none" stroke="#7de7ff" strokeOpacity="0.22" strokeWidth="2" />
            <path d="M150 332 C300 210 472 144 690 92" fill="none" stroke="#7de7ff" strokeDasharray="8 12" strokeOpacity="0.65" strokeWidth="2">
              <animate attributeName="stroke-dashoffset" from="0" to="-200" dur="6s" repeatCount={reducedMotion ? "1" : "indefinite"} />
            </path>

            <g transform="translate(115 310)">
              <rect x="0" y="35" width="150" height="10" fill="#30343c" />
              <path d="M20 35 L55 0 L92 35" fill="none" stroke="#8d96a6" strokeWidth="3" />
              <path d="M92 35 L122 8 L144 35" fill="none" stroke="#8d96a6" strokeWidth="3" />
              <rect x="62" y="-12" width="12" height="47" fill="#8d96a6" opacity="0.55" />
            </g>

            <g transform={rocketTransform} className="transition-transform duration-300 ease-linear">
              <g transform="translate(245 -10)">
                {vehicle === "starship" ? (
                  <>
                    <path d="M26 0 C54 22 58 66 58 140 L58 200 L0 200 L0 140 C0 66 4 22 26 0 Z" fill="#d8dce3" />
                    <path d="M0 130 L-18 188 L0 176 Z" fill="#8d96a6" />
                    <path d="M58 130 L76 188 L58 176 Z" fill="#8d96a6" />
                    <rect x="9" y="76" width="40" height="4" fill="#101216" opacity="0.8" />
                  </>
                ) : (
                  <>
                    <path d="M25 0 C44 22 50 60 50 128 L50 205 L0 205 L0 128 C0 60 6 22 25 0 Z" fill="#f4f6fb" />
                    <rect x="7" y="86" width="36" height="6" fill="#101216" opacity="0.85" />
                    <rect x="5" y="138" width="40" height="7" fill="#101216" opacity="0.78" />
                    <path d="M0 154 L-15 202 L0 190 Z" fill="#8d96a6" />
                    <path d="M50 154 L65 202 L50 190 Z" fill="#8d96a6" />
                  </>
                )}
                {!showSeparation ? (
                  <path d="M8 204 C18 248 32 248 43 204 Z" fill="url(#plume)" opacity="0.9">
                    <animateTransform
                      attributeName="transform"
                      type="scale"
                      values="1 .72;1 1;1 .72"
                      dur="0.9s"
                      repeatCount={reducedMotion ? "1" : "indefinite"}
                    />
                  </path>
                ) : null}
              </g>
            </g>

            {showSeparation ? (
              <g transform={boosterTransform} className="transition-transform duration-300 ease-linear">
                <rect x="245" y="10" width="38" height="100" rx="16" fill="#b9c0cc" />
                {showLanding ? <path d="M252 108 C260 150 276 150 284 108 Z" fill="url(#plume)" opacity="0.85" /> : null}
              </g>
            ) : null}

            {showPayload ? (
              <g transform="translate(590 102)">
                <circle r="8" fill="#7de7ff" />
                <path d="M-44 6 C-10 -10 28 -8 58 8" fill="none" stroke="#7de7ff" strokeWidth="2" strokeOpacity="0.8" />
                <text x="-72" y="36" fill="#d8dce3" fontSize="13" fontFamily="monospace">
                  PAYLOAD / ORBIT
                </text>
              </g>
            ) : null}

            <g transform="translate(490 382)">
              <rect x="-70" y="0" width="140" height="8" fill="#30343c" />
              <path d="M-52 0 C-28 -24 28 -24 52 0" fill="none" stroke="#8ab4ff" strokeOpacity="0.45" strokeWidth="2" />
              <text x="-76" y="32" fill="#8d96a6" fontSize="12" fontFamily="monospace">
                LANDING TARGET
              </text>
            </g>
          </svg>
        </div>
      </div>
    </section>
  )
}

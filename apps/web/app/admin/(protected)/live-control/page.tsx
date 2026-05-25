import Link from "next/link"
import {
  AlertTriangle,
  CheckCircle2,
  Flame,
  PauseCircle,
  Radio,
  ShieldAlert,
  XCircle,
} from "lucide-react"

import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { AdminSourceConfidenceBadge } from "@/components/admin/admin-source-confidence-badge"
import { AdminStatusBadge } from "@/components/admin/admin-status-badge"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { buttonVariants } from "@/components/ui/button"
import {
  clearLiveMissionBannerAction,
  completeLiveMissionAction,
  initializeLiveMissionAction,
  setLiveMissionActiveEventAction,
  updateLiveMissionBannerAction,
  updateLiveMissionModeAction,
  updateLiveMissionStreamStatusAction,
  updateLiveMissionTimingAction,
  updateLiveTimelineEventStatusAction,
} from "@/lib/admin/actions"
import { requireAdminUser } from "@/lib/admin/auth"
import { getLiveMissionAdminData } from "@/lib/server/live-mission/service"
import { formatMissionTime } from "@/lib/mission-time/mission-clock"
import { computeMissionClock } from "@/lib/mission-time/mission-clock"
import { parseRelativeMissionTime } from "@/lib/mission-time/mission-clock"

const modeOptions = ["planned", "live", "replay", "paused", "completed", "scrubbed", "delayed"] as const
const streamOptions = ["unavailable", "scheduled", "live", "ended", "replay"] as const

function dateTimeInputValue(value?: string) {
  if (!value) return ""
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  return date.toISOString().slice(0, 16)
}

function SelectField({
  name,
  defaultValue,
  options,
  disabled,
}: {
  name: string
  defaultValue?: string
  options: readonly string[]
  disabled?: boolean
}) {
  return (
    <select
      name={name}
      defaultValue={defaultValue}
      disabled={disabled}
      className="h-10 rounded-lg border border-border bg-background/80 px-3 text-sm text-foreground"
    >
      {options.map((option) => (
        <option key={option} value={option}>
          {option.replaceAll("_", " ")}
        </option>
      ))}
    </select>
  )
}

export default async function AdminLiveControlPage({
  searchParams,
}: {
  searchParams?: Promise<{ launchId?: string }>
}) {
  const user = await requireAdminUser()
  const query = await searchParams
  const data = await getLiveMissionAdminData(query?.launchId)
  const launch = data.selectedLaunch
  const state = data.state
  const canControl = user.role === "admin"
  const clock = launch
    ? computeMissionClock({
        countdownTargetUtc: state?.countdownTargetUtc ?? launch.launchDateTimeUtc,
        t0Utc: state?.t0Utc ?? launch.launchDateTimeUtc,
        mode: state?.mode ?? "planned",
      })
    : undefined

  return (
    <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-8">
      <AdminPageHeader
        eyebrow="Live Mission Control"
        title="Manual mission control room"
        description="Control planned/live/replay mission state with durable event logs, audit logs, and public safety labels. This surface does not represent official SpaceX telemetry."
      />

      <section className="rounded-lg border border-signal-amber/50 bg-signal-amber/10 p-5 text-signal-amber">
        <div className="flex gap-3">
          <ShieldAlert data-icon className="mt-1 size-5 shrink-0" aria-hidden="true" />
          <p className="text-sm leading-6">
            This is a manual control interface. Public pages must label these updates as
            planned, estimated, admin confirmed, or replay unless an official telemetry
            source is integrated later.
          </p>
        </div>
      </section>

      <section className="mission-panel rounded-lg p-5">
        <form className="flex flex-wrap items-end gap-3">
          <label className="flex min-w-[260px] flex-1 flex-col gap-2">
            <span className="mission-eyebrow">Selected launch</span>
            <select
              name="launchId"
              defaultValue={launch?.id}
              className="h-11 rounded-lg border border-border bg-background/80 px-3 text-sm text-foreground"
            >
              {data.launches.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.missionName.en} · {item.status}
                </option>
              ))}
            </select>
          </label>
          <Button type="submit" variant="outline">
            Load mission
          </Button>
          {launch ? (
            <Link
              className={buttonVariants({ variant: "ghost" })}
              href={`/admin/launches/${launch.id}`}
            >
              Open launch edit
            </Link>
          ) : null}
        </form>
      </section>

      {launch ? (
        <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="mission-panel rounded-lg p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="mission-eyebrow">Active mission</p>
                <h3 className="mt-3 text-2xl font-black uppercase tracking-[0.08em] text-foreground">
                  {launch.missionName.en}
                </h3>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  {launch.rocket.name} from {launch.launchPad.name}
                </p>
              </div>
              <Flame data-icon className="size-5 text-signal-red" aria-hidden="true" />
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <AdminStatusBadge status={launch.status} />
              <AdminSourceConfidenceBadge confidenceLevel={launch.confidenceLevel} />
              <Badge variant={state?.manualOverrideEnabled ? "warning" : "secondary"}>
                {state?.manualOverrideEnabled ? "manual override" : "planned"}
              </Badge>
              <Badge variant={state?.streamStatus === "live" ? "danger" : "info"}>
                stream: {state?.streamStatus ?? "unavailable"}
              </Badge>
            </div>
            <div className="mt-6 rounded-lg border border-border/70 bg-background/50 p-4">
              <p className="mission-eyebrow">Mission clock</p>
              <p className="mt-3 font-mono text-4xl font-black tracking-[0.08em]">
                {clock?.label ?? "T-00:00"}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Target: {state?.countdownTargetUtc ?? launch.launchDateTimeUtc}
              </p>
            </div>
            {state?.publicBanner ? (
              <div className="mt-4 rounded-lg border border-signal-amber/50 bg-signal-amber/10 p-4 text-sm text-signal-amber">
                {state.publicBanner.en}
              </div>
            ) : null}
          </div>

          <div className="mission-panel rounded-lg p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="mission-eyebrow">Manual controls</p>
                <h3 className="mt-2 text-xl font-black uppercase tracking-[0.08em]">
                  {canControl ? "Server-protected controls" : "Read-only access"}
                </h3>
              </div>
              {canControl ? (
                <Radio data-icon className="size-5 text-signal-blue" aria-hidden="true" />
              ) : (
                <ShieldAlert data-icon className="size-5 text-signal-amber" aria-hidden="true" />
              )}
            </div>

            {!state ? (
              <form action={initializeLiveMissionAction} className="mt-5">
                <input type="hidden" name="launchId" value={launch.id} />
                <Button type="submit" disabled={!canControl}>
                  Initialize live mission state
                </Button>
              </form>
            ) : (
              <div className="mt-5 grid gap-4 lg:grid-cols-2">
                <form action={updateLiveMissionModeAction} className="flex flex-col gap-2">
                  <input type="hidden" name="launchId" value={launch.id} />
                  <span className="mission-eyebrow">Mission mode</span>
                  <div className="flex gap-2">
                    <SelectField
                      name="mode"
                      defaultValue={state.mode}
                      options={modeOptions}
                      disabled={!canControl}
                    />
                    <Button type="submit" size="sm" disabled={!canControl}>
                      Update
                    </Button>
                  </div>
                </form>

                <form action={updateLiveMissionStreamStatusAction} className="flex flex-col gap-2">
                  <input type="hidden" name="launchId" value={launch.id} />
                  <span className="mission-eyebrow">Stream status</span>
                  <div className="flex gap-2">
                    <SelectField
                      name="streamStatus"
                      defaultValue={state.streamStatus}
                      options={streamOptions}
                      disabled={!canControl}
                    />
                    <Button type="submit" size="sm" disabled={!canControl}>
                      Update
                    </Button>
                  </div>
                </form>

                <form action={updateLiveMissionTimingAction} className="flex flex-col gap-2 lg:col-span-2">
                  <input type="hidden" name="launchId" value={launch.id} />
                  <span className="mission-eyebrow">Delay / T-0 target</span>
                  <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                    <input
                      name="countdownTargetUtc"
                      type="datetime-local"
                      defaultValue={dateTimeInputValue(state.countdownTargetUtc)}
                      disabled={!canControl}
                      className="h-10 rounded-lg border border-border bg-background/80 px-3 text-sm"
                    />
                    <input
                      name="t0Utc"
                      type="datetime-local"
                      defaultValue={dateTimeInputValue(state.t0Utc ?? state.countdownTargetUtc)}
                      disabled={!canControl}
                      className="h-10 rounded-lg border border-border bg-background/80 px-3 text-sm"
                    />
                    <Button type="submit" size="sm" variant="outline" disabled={!canControl}>
                      Delay
                    </Button>
                  </div>
                  <input
                    name="internalNotes"
                    placeholder="Internal delay note"
                    disabled={!canControl}
                    className="h-10 rounded-lg border border-border bg-background/80 px-3 text-sm"
                  />
                </form>

                <form action={updateLiveMissionBannerAction} className="flex flex-col gap-2 lg:col-span-2">
                  <input type="hidden" name="launchId" value={launch.id} />
                  <span className="mission-eyebrow">Public banner</span>
                  <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto_auto]">
                    <input
                      name="publicBannerEn"
                      defaultValue={state.publicBanner?.en}
                      placeholder="English public banner"
                      disabled={!canControl}
                      className="h-10 rounded-lg border border-border bg-background/80 px-3 text-sm"
                    />
                    <input
                      name="publicBannerRu"
                      defaultValue={state.publicBanner?.ru}
                      placeholder="Russian public banner"
                      disabled={!canControl}
                      className="h-10 rounded-lg border border-border bg-background/80 px-3 text-sm"
                    />
                    <Button type="submit" size="sm" disabled={!canControl}>
                      Save
                    </Button>
                    <Button
                      formAction={clearLiveMissionBannerAction}
                      type="submit"
                      size="sm"
                      variant="ghost"
                      disabled={!canControl}
                    >
                      Clear
                    </Button>
                  </div>
                </form>

                <div className="flex flex-wrap gap-2 lg:col-span-2">
                  {(["success", "failure", "partial_success"] as const).map((result) => (
                    <form key={result} action={completeLiveMissionAction}>
                      <input type="hidden" name="launchId" value={launch.id} />
                      <input type="hidden" name="result" value={result} />
                      <Button
                        type="submit"
                        size="sm"
                        variant={result === "success" ? "outline" : "danger"}
                        disabled={!canControl}
                      >
                        {result === "success" ? (
                          <CheckCircle2 data-icon aria-hidden="true" />
                        ) : (
                          <XCircle data-icon aria-hidden="true" />
                        )}
                        Mark {result.replaceAll("_", " ")}
                      </Button>
                    </form>
                  ))}
                  <form action={updateLiveMissionModeAction}>
                    <input type="hidden" name="launchId" value={launch.id} />
                    <input type="hidden" name="mode" value="scrubbed" />
                    <Button type="submit" size="sm" variant="danger" disabled={!canControl}>
                      <AlertTriangle data-icon aria-hidden="true" />
                      Scrub launch
                    </Button>
                  </form>
                  <form action={updateLiveMissionModeAction}>
                    <input type="hidden" name="launchId" value={launch.id} />
                    <input type="hidden" name="mode" value="paused" />
                    <Button type="submit" size="sm" variant="outline" disabled={!canControl}>
                      <PauseCircle data-icon aria-hidden="true" />
                      Pause
                    </Button>
                  </form>
                </div>
              </div>
            )}
          </div>
        </section>
      ) : null}

      {launch ? (
        <section className="mission-panel rounded-lg p-5">
          <p className="mission-eyebrow">Approved stream records</p>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {data.approvedVideos.length > 0 ? (
              data.approvedVideos.map((video) => (
                <article key={video.id} className="rounded-lg border border-border/70 bg-card/60 p-4">
                  <h4 className="text-sm font-black uppercase tracking-[0.08em]">
                    {video.title.en || video.providerVideoId || "Approved YouTube video"}
                  </h4>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {video.channelTitle ?? "YouTube"} · {video.liveBroadcastContent ?? "unknown"}
                  </p>
                </article>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No approved stream/replay video yet.</p>
            )}
          </div>
        </section>
      ) : null}

      {launch ? (
        <section className="mission-panel rounded-lg p-5">
          <p className="mission-eyebrow">Mission timeline controls</p>
          <h3 className="mt-2 text-xl font-black uppercase tracking-[0.08em]">
            Planned events and admin confirmations
          </h3>
          <div className="mt-6 grid gap-3 lg:grid-cols-[repeat(auto-fit,minmax(220px,1fr))]">
            {data.timeline.map((event) => (
              <article key={event.id} className="rounded-lg border border-border/70 bg-card/60 p-4">
                <p className="font-mono text-xs font-black text-signal-blue">
                  {event.relativeTime} · {formatMissionTime(parseRelativeMissionTime(event.relativeTime))}
                </p>
                <h4 className="mt-3 text-sm font-black uppercase tracking-[0.08em]">
                  {event.title.en}
                </h4>
                <Badge className="mt-3" variant={event.status === "confirmed" ? "success" : event.status === "failed" ? "danger" : "warning"}>
                  {event.status}
                </Badge>
                <div className="mt-4 flex flex-wrap gap-2">
                  <form action={setLiveMissionActiveEventAction}>
                    <input type="hidden" name="launchId" value={launch.id} />
                    <input type="hidden" name="timelineEventId" value={event.id} />
                    <Button type="submit" size="sm" variant="outline" disabled={!canControl || !state}>
                      Set active
                    </Button>
                  </form>
                  {(["confirmed", "failed", "skipped", "estimated"] as const).map((status) => (
                    <form key={status} action={updateLiveTimelineEventStatusAction}>
                      <input type="hidden" name="launchId" value={launch.id} />
                      <input type="hidden" name="timelineEventId" value={event.id} />
                      <input type="hidden" name="status" value={status} />
                      <Button
                        type="submit"
                        size="sm"
                        variant={status === "failed" ? "danger" : "ghost"}
                        disabled={!canControl || !state}
                      >
                        {status}
                      </Button>
                    </form>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {launch ? (
        <section className="mission-panel rounded-lg p-5">
          <p className="mission-eyebrow">Live event history</p>
          <div className="mt-4 grid gap-3">
            {data.eventLogs.length > 0 ? (
              data.eventLogs.map((entry) => (
                <article key={entry.id} className="rounded-lg border border-border/70 bg-card/60 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={entry.sourceType === "admin_confirmed" ? "success" : "warning"}>
                      {entry.sourceType.replaceAll("_", " ")}
                    </Badge>
                    <span className="font-mono text-xs text-muted-foreground">
                      {new Date(entry.createdAt).toISOString()}
                    </span>
                  </div>
                  <p className="mt-3 text-sm font-black uppercase tracking-[0.08em]">
                    {entry.eventType.replaceAll("_", " ")}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Actor: {entry.actorEmail ?? entry.actorName ?? "system"} · Mission time:{" "}
                    {typeof entry.missionTimeSeconds === "number"
                      ? formatMissionTime(entry.missionTimeSeconds)
                      : "n/a"}
                  </p>
                </article>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No live mission event log entries yet.</p>
            )}
          </div>
        </section>
      ) : null}
    </div>
  )
}

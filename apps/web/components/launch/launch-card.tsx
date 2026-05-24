import Link from "next/link"
import { InfoIcon, PlayIcon } from "lucide-react"

import { AddReminderButton } from "@/components/launch/add-reminder-button"
import { ConfidenceBadge } from "@/components/launch/confidence-badge"
import { StatusBadge } from "@/components/launch/status-badge"
import { buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { formatUtcDateTime } from "@/lib/format"
import { localize } from "@/lib/i18n/config"
import type { Dictionary } from "@/lib/i18n/get-dictionary"
import type { Launch, Locale } from "@/types/space"

export function LaunchCard({
  launch,
  locale,
  dictionary,
  mode = "upcoming",
}: {
  launch: Launch
  locale: Locale
  dictionary: Dictionary
  mode?: "upcoming" | "past" | "compact"
}) {
  const hasWatch = launch.videos.length > 0
  const href = `/${locale}/launches/${launch.slug}`

  return (
    <Card className="group relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-orbital-cyan via-signal-blue to-transparent opacity-70" />
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={launch.status} label={dictionary.launchStatus[launch.status]} />
          <ConfidenceBadge
            confidence={launch.confidenceLevel}
            label={dictionary.confidence[launch.confidenceLevel]}
          />
          {launch.isMock ? <span className="mission-eyebrow">{dictionary.common.mockNotice}</span> : null}
        </div>
        <CardTitle>{localize(launch.missionName, locale)}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm leading-6 text-muted-foreground">{localize(launch.summary, locale)}</p>
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="mission-eyebrow">{dictionary.common.utc}</dt>
            <dd className="mt-1 font-mono text-foreground">{formatUtcDateTime(launch.netUtc, locale)}</dd>
          </div>
          <div>
            <dt className="mission-eyebrow">{dictionary.common.localTime}</dt>
            <dd className="mt-1 font-mono text-muted-foreground">{dictionary.common.localPlaceholder}</dd>
          </div>
          <div>
            <dt className="mission-eyebrow">{dictionary.common.rocket}</dt>
            <dd className="mt-1 text-foreground">{launch.rocket.name}</dd>
          </div>
          <div>
            <dt className="mission-eyebrow">{dictionary.common.launchPad}</dt>
            <dd className="mt-1 text-foreground">{launch.launchPad.name}</dd>
          </div>
        </dl>
        {mode === "past" && launch.result ? (
          <p className="rounded-lg border border-border/70 bg-background/50 p-3 text-sm leading-6 text-muted-foreground">
            <span className="font-semibold text-foreground">{dictionary.common.result}: </span>
            {localize(launch.result, locale)}
          </p>
        ) : null}
      </CardContent>
      <CardFooter>
        {hasWatch ? (
          <a
            className={buttonVariants({ variant: "secondary", size: "sm" })}
            href={launch.videos[0]?.url ?? href}
            target={launch.videos[0]?.url ? "_blank" : undefined}
            rel={launch.videos[0]?.url ? "noreferrer" : undefined}
          >
            <PlayIcon data-icon="inline-start" />
            {mode === "past" ? "Replay" : dictionary.common.watchOnline}
          </a>
        ) : null}
        <Link className={buttonVariants({ variant: "outline", size: "sm" })} href={href}>
          <InfoIcon data-icon="inline-start" />
          {dictionary.common.moreInformation}
        </Link>
        {mode !== "past" ? (
          <AddReminderButton
            label={dictionary.common.addReminder}
            addedLabel={dictionary.common.reminderAdded}
          />
        ) : null}
      </CardFooter>
    </Card>
  )
}

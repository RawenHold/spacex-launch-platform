import type { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ExternalLinkIcon } from "lucide-react"

import { ConfidenceBadge } from "@/components/launch/confidence-badge"
import { Countdown } from "@/components/launch/countdown"
import { LaunchAnimation2D } from "@/components/launch/launch-animation-2d"
import { MissionTimeline } from "@/components/launch/mission-timeline"
import { SourceList } from "@/components/launch/source-list"
import { StatusBadge } from "@/components/launch/status-badge"
import { YouTubeEmbed } from "@/components/launch/youtube-embed"
import { SectionHeader } from "@/components/shared/section-header"
import { Alert } from "@/components/ui/alert"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { launches, timelineExplainers } from "@/data/mock-data"
import { formatUtcDateTime } from "@/lib/format"
import { localize } from "@/lib/i18n/config"
import { getDictionary } from "@/lib/i18n/get-dictionary"
import { getLaunchBySlug } from "@/lib/launches"
import { isRiskyConfidence } from "@/lib/source-confidence"
import type { Locale, TimelineEventType } from "@/types/space"

export function generateStaticParams() {
  return launches.flatMap((launch) => [
    { locale: "en", slug: launch.slug },
    { locale: "ru", slug: launch.slug },
  ])
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale; slug: string }>
}): Promise<Metadata> {
  const { locale, slug } = await params
  const dictionary = getDictionary(locale)
  const launch = getLaunchBySlug(slug)

  if (!launch) {
    return {
      title: dictionary.common.missionDetails,
    }
  }

  return {
    title: localize(launch.missionName, locale),
    description: localize(launch.summary, locale),
  }
}

function getActiveTimelineIndex(netUtc: string, eventCount: number) {
  const launchTime = new Date(netUtc).getTime()
  const now = Date.now()
  if (now < launchTime) {
    return 0
  }
  const elapsedMinutes = (now - launchTime) / 60000
  return Math.min(eventCount - 1, Math.max(0, Math.floor(elapsedMinutes / 8)))
}

const explainerByType: Record<TimelineEventType, { en: string; ru: string }> = {
  liftoff: {
    en: "The rocket leaves the pad and begins powered ascent.",
    ru: "Ракета покидает стартовый стол и начинает активный участок подъема.",
  },
  max_q: {
    en: "Max Q is the moment of highest aerodynamic pressure.",
    ru: "Max Q — момент максимального аэродинамического давления.",
  },
  meco: {
    en: "MECO is main engine cutoff before first-stage separation.",
    ru: "MECO — отключение маршевых двигателей перед отделением первой ступени.",
  },
  stage_separation: {
    en: "The booster separates from the upper stage or ship.",
    ru: "Ускоритель отделяется от верхней ступени или корабля.",
  },
  ses: {
    en: "SES means second engine start for the next ascent phase.",
    ru: "SES — запуск двигателя второй ступени для следующего этапа выведения.",
  },
  seco: {
    en: "SECO is second engine cutoff after the ascent burn.",
    ru: "SECO — отключение двигателя второй ступени после участка выведения.",
  },
  landing_burn: {
    en: "Landing burn slows the booster for touchdown.",
    ru: "Посадочный импульс замедляет ускоритель перед касанием.",
  },
  booster_landing: {
    en: "The booster targets a pad or droneship recovery zone.",
    ru: "Ускоритель выходит на посадочную площадку или морскую платформу.",
  },
  payload_deployment: {
    en: "Payload deployment marks spacecraft or satellite release.",
    ru: "Отделение полезной нагрузки означает выпуск аппарата или спутников.",
  },
  custom: {
    en: "Custom mission-specific timeline event.",
    ru: "Специальное событие конкретной миссии.",
  },
}

export default async function LaunchDetailPage({
  params,
}: {
  params: Promise<{ locale: Locale; slug: string }>
}) {
  const { locale, slug } = await params
  const dictionary = getDictionary(locale)
  const launch = getLaunchBySlug(slug)

  if (!launch) {
    notFound()
  }

  const activeIndex = getActiveTimelineIndex(launch.netUtc, launch.timeline.length)
  const video = launch.videos[0]

  return (
    <>
      <section className="relative overflow-hidden border-b border-border/70">
        <div className="absolute inset-0 starfield opacity-50" aria-hidden="true" />
        <div className="absolute inset-0 technical-grid opacity-30" aria-hidden="true" />
        <div className="mission-container relative grid min-h-[70vh] gap-10 py-16 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div className="flex flex-col gap-6">
            <div className="flex flex-wrap gap-2">
              <StatusBadge status={launch.status} label={dictionary.launchStatus[launch.status]} />
              <ConfidenceBadge
                confidence={launch.confidenceLevel}
                label={dictionary.confidence[launch.confidenceLevel]}
              />
            </div>
            <div className="flex flex-col gap-4">
              <p className="mission-eyebrow">{dictionary.common.missionDetails}</p>
              <h1 className="mission-title">{localize(launch.missionName, locale)}</h1>
              <p className="max-w-3xl text-base leading-8 text-muted-foreground">
                {localize(launch.details, locale)}
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Card>
                <CardHeader>
                  <p className="mission-eyebrow">{dictionary.common.utc}</p>
                  <CardTitle>{formatUtcDateTime(launch.netUtc, locale)}</CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader>
                  <p className="mission-eyebrow">{dictionary.countdown.label}</p>
                </CardHeader>
                <CardContent>
                  <Countdown targetUtc={launch.netUtc} labels={dictionary.countdown} />
                </CardContent>
              </Card>
            </div>
          </div>
          <LaunchAnimation2D
            title={dictionary.detail.animationTitle}
            description={dictionary.detail.animationDescription}
            vehicle={launch.category === "starship" ? "starship" : "falcon"}
            demo
          />
        </div>
      </section>

      <section className="mission-container grid gap-6 py-14 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="flex flex-col gap-6">
          {isRiskyConfidence(launch.confidenceLevel) ? (
            <Alert>{dictionary.detail.dataWarning}</Alert>
          ) : null}
          <Card>
            <CardHeader>
              <CardTitle>{dictionary.common.sourceTransparency}</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-4 sm:grid-cols-2">
                <div>
                  <dt className="mission-eyebrow">{dictionary.common.rocket}</dt>
                  <dd className="mt-1 text-foreground">{launch.rocket.name}</dd>
                </div>
                <div>
                  <dt className="mission-eyebrow">{dictionary.common.launchPad}</dt>
                  <dd className="mt-1 text-foreground">{launch.launchPad.name}</dd>
                </div>
                <div>
                  <dt className="mission-eyebrow">{dictionary.common.orbit}</dt>
                  <dd className="mt-1 text-foreground">{localize(launch.orbit, locale)}</dd>
                </div>
                <div>
                  <dt className="mission-eyebrow">{dictionary.common.payload}</dt>
                  <dd className="mt-1 text-foreground">{localize(launch.payload, locale)}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="mission-eyebrow">{dictionary.common.trajectory}</dt>
                  <dd className="mt-1 text-foreground">{localize(launch.trajectory, locale)}</dd>
                </div>
              </dl>
              {launch.officialLink ? (
                <Link className={buttonVariants({ variant: "outline" })} href={launch.officialLink}>
                  {dictionary.common.officialLink}
                  <ExternalLinkIcon data-icon="inline-end" />
                </Link>
              ) : null}
            </CardContent>
          </Card>
          <SourceList sources={launch.sourceRecords} locale={locale} dictionary={dictionary} />
        </div>

        <div className="flex flex-col gap-6">
          <YouTubeEmbed video={video} labels={dictionary.youtube} />
          <Card>
            <CardHeader>
              <CardTitle>{dictionary.home.timelinePreview}</CardTitle>
            </CardHeader>
            <CardContent>
              <MissionTimeline
                events={launch.timeline}
                locale={locale}
                dictionary={dictionary}
                activeIndex={activeIndex}
              />
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="mission-container flex flex-col gap-6 py-14">
        <SectionHeader title={dictionary.detail.educational} />
        <div className="grid gap-5 lg:grid-cols-5">
          {timelineExplainers.map((type) => (
            <Card key={type}>
              <CardHeader>
                <p className="mission-eyebrow">{type.replaceAll("_", " ")}</p>
                <CardTitle className="text-lg">
                  {localize(explainerByType[type], locale).split(".")[0]}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-6 text-muted-foreground">
                  {localize(explainerByType[type], locale)}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </>
  )
}

"use client"

import { useMemo, useState } from "react"
import { DownloadIcon, LinkIcon } from "lucide-react"

import { AddReminderButton } from "@/components/launch/add-reminder-button"
import { ConfidenceBadge } from "@/components/launch/confidence-badge"
import { StatusBadge } from "@/components/launch/status-badge"
import { FilterBar, type FilterGroup } from "@/components/shared/filter-bar"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatDate, formatMonth, formatUtcDateTime } from "@/lib/format"
import { localize } from "@/lib/i18n/config"
import type { Dictionary } from "@/lib/i18n/get-dictionary"
import type { Launch, Locale } from "@/types/space"

export function CalendarBoard({
  launches,
  locale,
  dictionary,
}: {
  launches: Launch[]
  locale: Locale
  dictionary: Dictionary
}) {
  const [filters, setFilters] = useState({ rocket: "all", status: "all" })

  const groups = useMemo<FilterGroup[]>(() => {
    const all = { value: "all", label: dictionary.common.all }
    return [
      {
        id: "rocket",
        label: dictionary.filters.rocket,
        options: [
          all,
          ...Array.from(new Set(launches.map((launch) => launch.rocket.name))).map((rocket) => ({
            value: rocket,
            label: rocket,
          })),
        ],
      },
      {
        id: "status",
        label: dictionary.filters.status,
        options: [
          all,
          ...Array.from(new Set(launches.map((launch) => launch.status))).map((status) => ({
            value: status,
            label: dictionary.launchStatus[status],
          })),
        ],
      },
    ]
  }, [dictionary, launches])

  const visible = launches.filter(
    (launch) =>
      (filters.rocket === "all" || launch.rocket.name === filters.rocket) &&
      (filters.status === "all" || launch.status === filters.status)
  )

  const grouped = visible.reduce<Record<string, Launch[]>>((acc, launch) => {
    const key = launch.netUtc.slice(0, 10)
    acc[key] = [...(acc[key] ?? []), launch]
    return acc
  }, {})

  return (
    <div className="flex flex-col gap-6">
      <FilterBar
        groups={groups}
        values={filters}
        resetLabel={dictionary.common.reset}
        onChange={(id, value) => setFilters((current) => ({ ...current, [id]: value }))}
        onReset={() => setFilters({ rocket: "all", status: "all" })}
      />
      <div className="flex flex-col gap-5">
        {Object.entries(grouped).map(([date, dateLaunches]) => (
          <section key={date} className="grid gap-4 lg:grid-cols-[220px_1fr]">
            <div>
              <p className="mission-eyebrow">{formatMonth(date, locale)}</p>
              <h2 className="mt-2 text-2xl font-black uppercase tracking-[0.08em]">
                {formatDate(date, locale)}
              </h2>
            </div>
            <div className="grid gap-4">
              {dateLaunches.map((launch) => (
                <Card key={launch.id}>
                  <CardHeader>
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge status={launch.status} label={dictionary.launchStatus[launch.status]} />
                      <ConfidenceBadge
                        confidence={launch.confidenceLevel}
                        label={dictionary.confidence[launch.confidenceLevel]}
                      />
                    </div>
                    <CardTitle>{localize(launch.missionName, locale)}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-3 md:grid-cols-3">
                      <p className="text-sm text-muted-foreground">
                        <span className="block mission-eyebrow">{dictionary.common.utc}</span>
                        {formatUtcDateTime(launch.netUtc, locale)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        <span className="block mission-eyebrow">{dictionary.common.rocket}</span>
                        {launch.rocket.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        <span className="block mission-eyebrow">{dictionary.common.launchPad}</span>
                        {launch.launchPad.name}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <AddReminderButton
                        label={dictionary.common.addReminder}
                        addedLabel={dictionary.common.reminderAdded}
                      />
                      <button className={buttonVariants({ variant: "outline", size: "sm" })} type="button">
                        <DownloadIcon data-icon="inline-start" />
                        {dictionary.common.exportIcs}
                      </button>
                      <button className={buttonVariants({ variant: "outline", size: "sm" })} type="button">
                        <LinkIcon data-icon="inline-start" />
                        {dictionary.common.googleCalendar}
                      </button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}

"use client"

import { useMemo, useState } from "react"

import { LaunchCard } from "@/components/launch/launch-card"
import { FilterBar, type FilterGroup } from "@/components/shared/filter-bar"
import type { Dictionary } from "@/lib/i18n/get-dictionary"
import type { Launch, Locale } from "@/types/space"

const initialFilters = {
  rocket: "all",
  pad: "all",
  missionType: "all",
  status: "all",
  category: "all",
}

export function LaunchesBoard({
  launches,
  locale,
  dictionary,
  mode,
  includeCategory = false,
}: {
  launches: Launch[]
  locale: Locale
  dictionary: Dictionary
  mode: "upcoming" | "past"
  includeCategory?: boolean
}) {
  const [filters, setFilters] = useState(initialFilters)

  const groups = useMemo<FilterGroup[]>(() => {
    const all = { value: "all", label: dictionary.common.all }
    const rockets = Array.from(new Set(launches.map((launch) => launch.rocket.name)))
    const pads = Array.from(new Set(launches.map((launch) => launch.launchPad.name)))
    const missionTypes = Array.from(new Set(launches.map((launch) => launch.missionType)))
    const statuses = Array.from(new Set(launches.map((launch) => launch.status)))
    const categories = Array.from(new Set(launches.map((launch) => launch.category)))

    const base: FilterGroup[] = [
      {
        id: "rocket",
        label: dictionary.filters.rocket,
        options: [all, ...rockets.map((rocket) => ({ value: rocket, label: rocket }))],
      },
      {
        id: "pad",
        label: dictionary.filters.pad,
        options: [all, ...pads.map((pad) => ({ value: pad, label: pad }))],
      },
      {
        id: "missionType",
        label: dictionary.filters.missionType,
        options: [
          all,
          ...missionTypes.map((missionType) => ({
            value: missionType,
            label: dictionary.missionTypes[missionType],
          })),
        ],
      },
      {
        id: "status",
        label: dictionary.filters.status,
        options: [
          all,
          ...statuses.map((status) => ({
            value: status,
            label: dictionary.launchStatus[status],
          })),
        ],
      },
    ]

    if (includeCategory) {
      base.push({
        id: "category",
        label: dictionary.filters.category,
        options: [
          all,
          ...categories.map((category) => ({
            value: category,
            label: dictionary.categories[category],
          })),
        ],
      })
    }

    return base
  }, [dictionary, includeCategory, launches])

  const visibleLaunches = launches.filter((launch) => {
    return (
      (filters.rocket === "all" || launch.rocket.name === filters.rocket) &&
      (filters.pad === "all" || launch.launchPad.name === filters.pad) &&
      (filters.missionType === "all" || launch.missionType === filters.missionType) &&
      (filters.status === "all" || launch.status === filters.status) &&
      (filters.category === "all" || launch.category === filters.category)
    )
  })

  return (
    <div className="flex flex-col gap-6">
      <FilterBar
        groups={groups}
        values={filters}
        resetLabel={dictionary.common.reset}
        onChange={(id, value) => setFilters((current) => ({ ...current, [id]: value }))}
        onReset={() => setFilters(initialFilters)}
      />
      <div className="grid gap-5 lg:grid-cols-2">
        {visibleLaunches.map((launch) => (
          <LaunchCard
            key={launch.id}
            launch={launch}
            locale={locale}
            dictionary={dictionary}
            mode={mode}
          />
        ))}
      </div>
    </div>
  )
}

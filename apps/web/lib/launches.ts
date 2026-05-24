import { launches } from "@/data/mock-data"
import { getLaunchSortTime } from "@/lib/format"

export function getUpcomingLaunches() {
  const now = Date.now()
  return launches
    .filter((launch) => getLaunchSortTime(launch) >= now)
    .sort((a, b) => getLaunchSortTime(a) - getLaunchSortTime(b))
}

export function getPastLaunches() {
  const now = Date.now()
  return launches
    .filter((launch) => getLaunchSortTime(launch) < now)
    .sort((a, b) => getLaunchSortTime(b) - getLaunchSortTime(a))
}

export function getLaunchBySlug(slug: string) {
  return launches.find((launch) => launch.slug === slug)
}

export function getNextLaunch() {
  return getUpcomingLaunches()[0] ?? launches[0]
}

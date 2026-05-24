import type { Locale } from "@/types/space"

export function formatUtcDateTime(value: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(new Date(value))
}

export function formatDate(value: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(new Date(value))
}

export function formatMonth(value: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale, {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value))
}

export function getLaunchSortTime(value: { netUtc: string }): number {
  return new Date(value.netUtc).getTime()
}

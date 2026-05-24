import type { Locale } from "@/types/space"

function safeLocale(locale: string): "en" | "ru" {
  return locale === "ru" ? "ru" : "en"
}

function safeDate(value: string): Date {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? new Date(0) : date
}

export function formatUtcDateTime(value: string, locale: Locale | string): string {
  return new Intl.DateTimeFormat(safeLocale(locale), {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(safeDate(value))
}

export function formatDate(value: string, locale: Locale | string): string {
  return new Intl.DateTimeFormat(safeLocale(locale), {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(safeDate(value))
}

export function formatMonth(value: string, locale: Locale | string): string {
  return new Intl.DateTimeFormat(safeLocale(locale), {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(safeDate(value))
}

export function getLaunchSortTime(value: { netUtc: string }): number {
  return new Date(value.netUtc).getTime()
}

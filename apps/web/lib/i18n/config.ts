import type { Locale, LocalizedText } from "@/types/space"

export const supportedLocales = ["en", "ru"] as const satisfies Locale[]
export const futureLocales = ["es", "it", "fr"] as const satisfies Locale[]
export const defaultLocale: Locale = "en"

export function isLocale(value: string): value is Locale {
  return [...supportedLocales, ...futureLocales].includes(value as Locale)
}

export function isActiveLocale(value: string): value is (typeof supportedLocales)[number] {
  return supportedLocales.includes(value as (typeof supportedLocales)[number])
}

export function localize(text: LocalizedText, locale: Locale): string {
  return text[locale] ?? text.en
}

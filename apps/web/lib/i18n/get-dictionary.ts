import type { Locale } from "@/types/space"

import { en } from "@/messages/en"
import { ru } from "@/messages/ru"

const dictionaries = {
  en,
  ru,
  es: en,
  it: en,
  fr: en,
} as const

export type Dictionary = typeof en

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale] ?? dictionaries.en
}

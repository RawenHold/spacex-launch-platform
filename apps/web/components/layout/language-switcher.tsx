"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { supportedLocales } from "@/lib/i18n/config"
import type { Locale } from "@/types/space"

function getLocalePath(pathname: string, nextLocale: Locale) {
  const segments = pathname.split("/").filter(Boolean)
  if (segments.length === 0) {
    return `/${nextLocale}`
  }
  segments[0] = nextLocale
  return `/${segments.join("/")}`
}

export function LanguageSwitcher({ locale }: { locale: Locale }) {
  const pathname = usePathname()

  return (
    <div className="flex rounded-full border border-border/70 bg-background/40 p-1" aria-label="Language">
      {supportedLocales.map((item) => (
        <Link
          key={item}
          href={getLocalePath(pathname, item)}
          className={
            item === locale
              ? "rounded-full bg-primary px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-primary-foreground"
              : "rounded-full px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground transition hover:text-foreground"
          }
        >
          {item}
        </Link>
      ))}
    </div>
  )
}

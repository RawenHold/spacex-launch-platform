import Link from "next/link"

import { LanguageSwitcher } from "@/components/layout/language-switcher"
import { getDictionary } from "@/lib/i18n/get-dictionary"
import type { Locale } from "@/types/space"

const navItems = [
  ["upcoming", "/launches/upcoming"],
  ["past", "/launches/past"],
  ["calendar", "/calendar"],
  ["articles", "/articles"],
  ["news", "/news"],
  ["faq", "/faq"],
] as const

export function SiteHeader({
  locale,
}: {
  locale: Locale
}) {
  const dictionary = getDictionary(locale)

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/75 backdrop-blur-xl">
      <div className="mission-container flex min-h-16 items-center justify-between gap-4 py-3">
        <Link href={`/${locale}`} className="flex items-center gap-3" aria-label="SpaceX MVP home">
          <span className="grid size-8 place-items-center rounded-full border border-foreground/70 font-mono text-xs font-black">
            SX
          </span>
          <span className="hidden font-black uppercase tracking-[0.18em] sm:inline">
            SpaceX
          </span>
        </Link>

        <nav className="hidden items-center gap-5 lg:flex" aria-label="Primary navigation">
          {navItems.map(([key, href]) => (
            <Link
              key={key}
              href={`/${locale}${href}`}
              className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground transition hover:text-foreground"
            >
              {dictionary.nav[key]}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <LanguageSwitcher locale={locale} />
        </div>
      </div>
      <nav
        className="mission-container flex gap-4 overflow-x-auto border-t border-border/40 py-3 lg:hidden"
        aria-label="Mobile navigation"
      >
        {navItems.map(([key, href]) => (
          <Link
            key={key}
            href={`/${locale}${href}`}
            className="shrink-0 font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground"
          >
            {dictionary.nav[key]}
          </Link>
        ))}
      </nav>
    </header>
  )
}

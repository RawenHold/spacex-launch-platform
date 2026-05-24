import Link from "next/link"

import { Separator } from "@/components/ui/separator"
import { getDictionary } from "@/lib/i18n/get-dictionary"
import type { Locale } from "@/types/space"

export function SiteFooter({ locale }: { locale: Locale }) {
  const dictionary = getDictionary(locale)

  return (
    <footer className="border-t border-border/70 bg-background">
      <div className="mission-container flex flex-col gap-8 py-10">
        <div className="grid gap-8 md:grid-cols-[1.2fr_1fr]">
          <div className="flex max-w-2xl flex-col gap-4">
            <p className="mission-eyebrow">SpaceX MVP</p>
            <p className="text-sm leading-7 text-muted-foreground">{dictionary.footer.description}</p>
            <p className="text-xs leading-6 text-muted-foreground">{dictionary.footer.disclaimer}</p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm md:justify-self-end">
            <Link href={`/${locale}/launches/upcoming`} className="text-muted-foreground hover:text-foreground">
              {dictionary.nav.upcoming}
            </Link>
            <Link href={`/${locale}/launches/past`} className="text-muted-foreground hover:text-foreground">
              {dictionary.nav.past}
            </Link>
            <Link href={`/${locale}/calendar`} className="text-muted-foreground hover:text-foreground">
              {dictionary.nav.calendar}
            </Link>
            <Link href={`/${locale}/faq`} className="text-muted-foreground hover:text-foreground">
              {dictionary.nav.faq}
            </Link>
          </div>
        </div>
        <Separator />
        <div className="flex flex-col gap-2 font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>Mock public launch platform</span>
          <span>RU / EN ready. ES / IT / FR reserved.</span>
        </div>
      </div>
    </footer>
  )
}

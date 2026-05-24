import { ExternalLinkIcon } from "lucide-react"

import { ConfidenceBadge } from "@/components/launch/confidence-badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatDate } from "@/lib/format"
import { localize } from "@/lib/i18n/config"
import type { Dictionary } from "@/lib/i18n/get-dictionary"
import type { Locale, NewsItem } from "@/types/space"

export function NewsCard({
  item,
  locale,
  dictionary,
}: {
  item: NewsItem
  locale: Locale
  dictionary: Dictionary
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <ConfidenceBadge
            confidence={item.confidenceLevel}
            label={dictionary.confidence[item.confidenceLevel]}
          />
          <span className="mission-eyebrow">{formatDate(item.publishedAt, locale)}</span>
        </div>
        <CardTitle>{localize(item.title, locale)}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm leading-6 text-muted-foreground">{localize(item.summary, locale)}</p>
        {item.sourceUrl ? (
          <a
            href={item.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 text-sm font-semibold text-foreground hover:underline"
          >
            {item.sourceLabel}
            <ExternalLinkIcon className="size-4" aria-hidden="true" />
          </a>
        ) : (
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
            {item.sourceLabel}
          </span>
        )}
      </CardContent>
    </Card>
  )
}

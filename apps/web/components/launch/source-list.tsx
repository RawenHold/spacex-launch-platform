import { ExternalLinkIcon } from "lucide-react"

import { ConfidenceBadge } from "@/components/launch/confidence-badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { localize } from "@/lib/i18n/config"
import type { Dictionary } from "@/lib/i18n/get-dictionary"
import type { Locale, SourceRecord } from "@/types/space"

export function SourceList({
  sources,
  locale,
  dictionary,
}: {
  sources: SourceRecord[]
  locale: Locale
  dictionary: Dictionary
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{dictionary.common.sourceList}</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="flex flex-col gap-4">
          {sources.map((source) => (
            <li key={source.id} className="flex flex-col gap-2 rounded-lg border border-border/60 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <ConfidenceBadge
                  confidence={source.confidenceLevel}
                  label={dictionary.confidence[source.confidenceLevel]}
                />
                <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                  {source.publisher}
                </span>
              </div>
              {source.url ? (
                <a
                  href={source.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-foreground hover:underline"
                >
                  {localize(source.title, locale)}
                  <ExternalLinkIcon className="size-4" aria-hidden="true" />
                </a>
              ) : (
                <p className="text-sm font-semibold text-foreground">{localize(source.title, locale)}</p>
              )}
              {source.notes ? (
                <p className="text-sm leading-6 text-muted-foreground">{localize(source.notes, locale)}</p>
              ) : null}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

import Link from "next/link"
import { ClockIcon } from "lucide-react"

import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { formatDate } from "@/lib/format"
import { localize } from "@/lib/i18n/config"
import type { Dictionary } from "@/lib/i18n/get-dictionary"
import type { Article, Locale } from "@/types/space"

export function ArticleCard({
  article,
  locale,
  dictionary,
}: {
  article: Article
  locale: Locale
  dictionary: Dictionary
}) {
  return (
    <Card>
      <CardHeader>
        <p className="mission-eyebrow">{article.category}</p>
        <CardTitle>{localize(article.title, locale)}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm leading-6 text-muted-foreground">{localize(article.excerpt, locale)}</p>
        <div className="flex flex-wrap gap-4 font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
          <span>{formatDate(article.publishedAt, locale)}</span>
          <span className="inline-flex items-center gap-1">
            <ClockIcon className="size-3" aria-hidden="true" />
            {article.readingMinutes} min
          </span>
        </div>
      </CardContent>
      <CardFooter>
        <Link className={buttonVariants({ variant: "outline", size: "sm" })} href={`/${locale}/articles`}>
          {dictionary.common.readMore}
        </Link>
      </CardFooter>
    </Card>
  )
}

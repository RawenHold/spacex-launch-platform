"use client"

import { useMemo, useState } from "react"

import { ArticleCard } from "@/components/content/article-card"
import { FilterBar, type FilterGroup } from "@/components/shared/filter-bar"
import type { Dictionary } from "@/lib/i18n/get-dictionary"
import type { Article, Locale } from "@/types/space"

export function ArticlesBoard({
  articles,
  locale,
  dictionary,
}: {
  articles: Article[]
  locale: Locale
  dictionary: Dictionary
}) {
  const [category, setCategory] = useState("all")

  const groups = useMemo<FilterGroup[]>(() => {
    const categories = Array.from(new Set(articles.map((article) => article.category)))
    return [
      {
        id: "category",
        label: dictionary.filters.category,
        options: [
          { value: "all", label: dictionary.common.all },
          ...categories.map((value) => ({ value, label: value })),
        ],
      },
    ]
  }, [articles, dictionary])

  const visible = articles.filter((article) => category === "all" || article.category === category)

  return (
    <div className="flex flex-col gap-6">
      <FilterBar
        groups={groups}
        values={{ category }}
        resetLabel={dictionary.common.reset}
        onChange={(_, value) => setCategory(value)}
        onReset={() => setCategory("all")}
      />
      <div className="grid gap-5 lg:grid-cols-3">
        {visible.map((article) => (
          <ArticleCard key={article.id} article={article} locale={locale} dictionary={dictionary} />
        ))}
      </div>
    </div>
  )
}

import type { Metadata } from "next"

import { ArticlesBoard } from "@/components/content/articles-board"
import { DevDataWarning, EmptyState } from "@/components/shared/data-state"
import { PageHero } from "@/components/shared/page-hero"
import { getDictionary } from "@/lib/i18n/get-dictionary"
import { getPublishedArticles } from "@/lib/public/repository"
import type { Locale } from "@/types/space"

export const dynamic = "force-dynamic"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>
}): Promise<Metadata> {
  const { locale } = await params
  const dictionary = getDictionary(locale)
  return {
    title: dictionary.meta.articlesTitle,
    description: dictionary.pages.articles.subtitle,
  }
}

export default async function ArticlesPage({
  params,
}: {
  params: Promise<{ locale: Locale }>
}) {
  const { locale } = await params
  const dictionary = getDictionary(locale)
  const result = await getPublishedArticles()
  const articles = result.items

  return (
    <>
      <PageHero
        eyebrow={dictionary.pages.articles.eyebrow}
        title={dictionary.pages.articles.title}
        subtitle={dictionary.pages.articles.subtitle}
      />
      <section className="mission-container py-14">
        {result.source === "mock_fallback" ? <DevDataWarning /> : null}
        {articles.length > 0 ? (
          <ArticlesBoard articles={articles} locale={locale} dictionary={dictionary} />
        ) : (
          <EmptyState
            title="No published articles"
            description="Approved and published article records from PostgreSQL will appear here."
          />
        )}
      </section>
    </>
  )
}

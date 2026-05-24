import type { Metadata } from "next"

import { FAQAccordion } from "@/components/content/faq-accordion"
import { DevDataWarning, EmptyState } from "@/components/shared/data-state"
import { PageHero } from "@/components/shared/page-hero"
import { getDictionary } from "@/lib/i18n/get-dictionary"
import { getPublishedFAQ } from "@/lib/public/repository"
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
    title: dictionary.meta.faqTitle,
    description: dictionary.pages.faq.subtitle,
  }
}

export default async function FAQPage({
  params,
}: {
  params: Promise<{ locale: Locale }>
}) {
  const { locale } = await params
  const dictionary = getDictionary(locale)
  const result = await getPublishedFAQ()
  const faqs = result.items

  return (
    <>
      <PageHero
        eyebrow={dictionary.pages.faq.eyebrow}
        title={dictionary.pages.faq.title}
        subtitle={dictionary.pages.faq.subtitle}
      />
      <section className="mission-container py-14">
        {result.source === "mock_fallback" ? <DevDataWarning /> : null}
        {faqs.length > 0 ? (
          <FAQAccordion items={faqs} locale={locale} dictionary={dictionary} />
        ) : (
          <EmptyState
            title="No published FAQ entries"
            description="Approved FAQ entries from PostgreSQL will appear here after publication."
          />
        )}
      </section>
    </>
  )
}

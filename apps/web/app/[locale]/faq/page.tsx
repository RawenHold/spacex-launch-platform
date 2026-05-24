import type { Metadata } from "next"

import { FAQAccordion } from "@/components/content/faq-accordion"
import { PageHero } from "@/components/shared/page-hero"
import { faqs } from "@/data/mock-data"
import { getDictionary } from "@/lib/i18n/get-dictionary"
import type { Locale } from "@/types/space"

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

  return (
    <>
      <PageHero
        eyebrow={dictionary.pages.faq.eyebrow}
        title={dictionary.pages.faq.title}
        subtitle={dictionary.pages.faq.subtitle}
      />
      <section className="mission-container py-14">
        <FAQAccordion items={faqs} locale={locale} dictionary={dictionary} />
      </section>
    </>
  )
}

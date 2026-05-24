import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { localize } from "@/lib/i18n/config"
import type { Dictionary } from "@/lib/i18n/get-dictionary"
import type { FAQItem, Locale } from "@/types/space"

export function FAQAccordion({
  items,
  locale,
  dictionary,
}: {
  items: FAQItem[]
  locale: Locale
  dictionary: Dictionary
}) {
  const grouped = items.reduce<Record<FAQItem["group"], FAQItem[]>>(
    (acc, item) => {
      acc[item.group] = [...(acc[item.group] ?? []), item]
      return acc
    },
    {
      basics: [],
      falcon9: [],
      starship: [],
      timeline: [],
      livestreams: [],
      accuracy: [],
      reminders: [],
    }
  )

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {Object.entries(grouped).map(([group, groupItems]) => {
        if (groupItems.length === 0) {
          return null
        }

        return (
          <section key={group} className="mission-panel rounded-xl p-5">
            <h2 className="mission-eyebrow mb-2">{dictionary.faqGroups[group as FAQItem["group"]]}</h2>
            <Accordion>
              {groupItems.map((item) => (
                <AccordionItem key={item.id}>
                  <AccordionTrigger>{localize(item.question, locale)}</AccordionTrigger>
                  <AccordionContent>{localize(item.answer, locale)}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </section>
        )
      })}
    </div>
  )
}

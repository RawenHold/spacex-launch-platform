import { notFound } from "next/navigation"

import { SiteFooter } from "@/components/layout/site-footer"
import { SiteHeader } from "@/components/layout/site-header"
import { isActiveLocale, supportedLocales } from "@/lib/i18n/config"
import type { Locale } from "@/types/space"

export function generateStaticParams() {
  return supportedLocales.map((locale) => ({ locale }))
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  if (!isActiveLocale(locale)) {
    notFound()
  }

  return (
    <div data-locale={locale} className="min-h-screen bg-background text-foreground">
      <SiteHeader locale={locale as Locale} />
      <main>{children}</main>
      <SiteFooter locale={locale as Locale} />
    </div>
  )
}

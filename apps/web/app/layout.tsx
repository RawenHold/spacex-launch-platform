import type { Metadata } from "next"

import "./globals.css"

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://spacex.example"

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "SpaceX Launch Platform",
    template: "%s | SpaceX Launch Platform",
  },
  description:
    "A bilingual mock MVP for a SpaceX-focused launch platform with mission timelines, countdowns, livestream embeds, and source transparency.",
  icons: {
    icon: "/favicon.ico",
  },
  alternates: {
    canonical: "/",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body>{children}</body>
    </html>
  )
}

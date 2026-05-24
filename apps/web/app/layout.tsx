import type { Metadata } from "next"

import "./globals.css"

export const metadata: Metadata = {
  metadataBase: new URL("https://spacex.example"),
  title: {
    default: "SpaceX Launch Platform",
    template: "%s | SpaceX Launch Platform",
  },
  description:
    "A bilingual mock MVP for a SpaceX-focused launch platform with mission timelines, countdowns, livestream embeds, and source transparency.",
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

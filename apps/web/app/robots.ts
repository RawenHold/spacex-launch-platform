import type { MetadataRoute } from "next"

function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://spacex.example"
}

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/"],
        disallow: ["/admin", "/admin/", "/api/admin", "/api/admin/"],
      },
    ],
    sitemap: `${siteUrl()}/sitemap.xml`,
  }
}

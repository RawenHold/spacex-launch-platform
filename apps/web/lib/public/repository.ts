import type { Prisma } from "@prisma/client"

import {
  articles as mockArticles,
  faqs as mockFAQs,
  launches as mockLaunches,
  newsItems as mockNews,
} from "@/data/mock-data"
import { getLaunchSortTime } from "@/lib/format"
import { localizedFromJson, sourceFromDb } from "@/lib/admin/prisma-mappers"
import { prisma } from "@/lib/db"
import { extractYouTubeId } from "@/lib/youtube"
import type {
  Article,
  FAQItem,
  Launch,
  LaunchCategory,
  LaunchStatus,
  MissionTimelineEvent,
  MissionType,
  NewsItem,
  VideoRecord,
} from "@/types/space"

export type PublicDataSource = "database" | "mock_fallback" | "empty"

export interface PublicRepositoryResult<T> {
  items: T
  source: PublicDataSource
  error?: string
}

type LaunchWithRelations = Prisma.LaunchGetPayload<{
  include: {
    sourceRecords: true
    timelineEvents: true
    videoRecords: true
  }
}>

type ArticleWithRelations = Prisma.ArticleGetPayload<{
  include: { sources: true }
}>

type NewsWithRelations = Prisma.NewsItemGetPayload<{
  include: { sources: true }
}>

type FAQWithRelations = Prisma.FAQItemGetPayload<{
  include: { sources: true }
}>

const publishedLaunchWhere = {
  publishStatus: "PUBLISHED",
  isPublished: true,
} as const

const publishedContentWhere = {
  publishStatus: "PUBLISHED",
} as const

function devFallbackEnabled() {
  return process.env.NODE_ENV !== "production" && process.env.ENABLE_MOCK_FALLBACK !== "false"
}

function maybeFallback<T>(fallback: T, error?: unknown): PublicRepositoryResult<T> {
  if (devFallbackEnabled()) {
    return {
      items: fallback,
      source: "mock_fallback",
      error: error instanceof Error ? error.message : undefined,
    }
  }

  return { items: Array.isArray(fallback) ? ([] as T) : (null as T), source: "empty" }
}

function publishedUpcomingMockLaunches() {
  const now = Date.now()
  return mockLaunches
    .filter((launch) => getLaunchSortTime(launch) >= now)
    .sort((a, b) => getLaunchSortTime(a) - getLaunchSortTime(b))
}

function publishedPastMockLaunches() {
  const now = Date.now()
  return mockLaunches
    .filter((launch) => getLaunchSortTime(launch) < now)
    .sort((a, b) => getLaunchSortTime(b) - getLaunchSortTime(a))
}

function inferLaunchCategory(rocketName: string, missionName: string): LaunchCategory {
  const haystack = `${rocketName} ${missionName}`.toLowerCase()

  if (haystack.includes("starship")) return "starship"
  if (haystack.includes("falcon heavy")) return "falcon_heavy"
  if (haystack.includes("dragon") || haystack.includes("crew")) return "dragon_crew"
  if (haystack.includes("starlink")) return "starlink"
  if (haystack.includes("falcon 9")) return "falcon_9"

  return "other"
}

function inferMissionType(category: LaunchCategory, missionName: string): MissionType {
  const name = missionName.toLowerCase()

  if (category === "dragon_crew" || name.includes("crew")) return "crew"
  if (name.includes("cargo") || name.includes("crs")) return "cargo"
  if (category === "starship" || name.includes("test")) return "test_flight"
  if (category === "starlink" || name.includes("satellite")) return "communications"
  if (name.includes("rideshare")) return "rideshare"
  if (name.includes("science")) return "science"

  return "other"
}

function mapLaunchStatus(status: LaunchWithRelations["status"]): LaunchStatus {
  const map: Record<string, LaunchStatus> = {
    DRAFT: "unknown",
    SCHEDULED: "tbd",
    CONFIRMED: "go",
    LIVE: "go",
    DELAYED: "hold",
    SCRUBBED: "scrubbed",
    SUCCESS: "success",
    FAILURE: "failure",
    PARTIAL_SUCCESS: "partial_failure",
  }

  return map[status] ?? "unknown"
}

function mapTimelineType(type: string): MissionTimelineEvent["type"] {
  if (type === "PAYLOAD_DEPLOY") return "payload_deployment"
  if (
    [
      "LIFTOFF",
      "MAX_Q",
      "MECO",
      "STAGE_SEPARATION",
      "SES",
      "SECO",
      "LANDING_BURN",
      "BOOSTER_LANDING",
    ].includes(type)
  ) {
    return type.toLowerCase() as MissionTimelineEvent["type"]
  }

  return "custom"
}

function mapTimelineEvent(event: LaunchWithRelations["timelineEvents"][number]): MissionTimelineEvent {
  return {
    id: event.id,
    type: mapTimelineType(event.type),
    title: localizedFromJson(event.title),
    description: localizedFromJson(event.description),
    relativeTime: event.relativeTime,
    status: event.status.toLowerCase() as MissionTimelineEvent["status"],
    confidenceLevel: event.confidenceLevel.toLowerCase() as MissionTimelineEvent["confidenceLevel"],
  }
}

function publicVideoState(video: LaunchWithRelations["videoRecords"][number]): VideoRecord["state"] {
  if (video.liveBroadcastContent === "live") return "live"
  if (video.liveBroadcastContent === "upcoming") return "upcoming"
  if (video.actualEndTime || video.liveBroadcastContent === "none") return "completed"
  return "unavailable"
}

function videosFromLaunch(launch: LaunchWithRelations): VideoRecord[] {
  return launch.videoRecords
    .filter(
      (video) =>
        video.isApproved &&
        (video.publishStatus === "APPROVED" || video.publishStatus === "PUBLISHED")
    )
    .map((video) => ({
      id: video.id,
      provider: "youtube",
      title: localizedFromJson(video.title),
      providerVideoId: video.providerVideoId ?? undefined,
      videoId: video.providerVideoId ?? extractYouTubeId(video.url ?? undefined),
      url: video.url ?? undefined,
      state: publicVideoState(video),
      sourceLabel: {
        en: video.channelTitle ?? "Approved YouTube video",
        ru: video.channelTitle ?? "Approved YouTube video",
      },
      isPlaceholder: false,
    }))
}

function launchFromDb(launch: LaunchWithRelations): Launch {
  const missionName = localizedFromJson(launch.missionName)
  const rocket = launch.rocket as Launch["rocket"]
  const category = rocket.family ?? inferLaunchCategory(rocket.name, missionName.en)

  return {
    id: launch.id,
    slug: launch.slug,
    missionName,
    summary: localizedFromJson(launch.contentDescription),
    details: localizedFromJson(launch.missionDescription),
    status: mapLaunchStatus(launch.status),
    category,
    missionType: inferMissionType(category, missionName.en),
    rocket: {
      id: rocket.id ?? rocket.name.toLowerCase().replaceAll(" ", "-"),
      name: rocket.name,
      family: category,
      variant: rocket.variant,
    },
    launchPad: launch.launchPad as Launch["launchPad"],
    netUtc: launch.launchDateTimeUtc.toISOString(),
    orbit: { en: launch.orbit ?? "TBD", ru: launch.orbit ?? "TBD" },
    trajectory: localizedFromJson(launch.trajectory),
    payload: localizedFromJson(launch.payload),
    officialLink: launch.officialUrl ?? undefined,
    videos: videosFromLaunch(launch),
    timeline: launch.timelineEvents
      .sort((a, b) => a.sortOrder - b.sortOrder || a.relativeTime.localeCompare(b.relativeTime))
      .map(mapTimelineEvent),
    sourceRecords: launch.sourceRecords.map((source) => {
      const mapped = sourceFromDb(source)
      return {
        ...mapped,
        notes: mapped.notes ? { en: mapped.notes, ru: mapped.notes } : undefined,
      }
    }),
    confidenceLevel: launch.confidenceLevel.toLowerCase() as Launch["confidenceLevel"],
    isMock: launch.isMock,
    tags: [category, rocket.name.toLowerCase().replaceAll(" ", "-")],
  }
}

function articleFromDb(article: ArticleWithRelations): Article {
  const body = localizedFromJson(article.body)

  return {
    id: article.id,
    slug: article.slug,
    title: localizedFromJson(article.title),
    excerpt: localizedFromJson(article.metaDescription) ?? body,
    category: article.category,
    readingMinutes: Math.max(1, Math.ceil(body.en.split(/\s+/).length / 220)),
    publishedAt: article.updatedAt.toISOString(),
    isMock: false,
  }
}

function newsFromDb(item: NewsWithRelations): NewsItem {
  return {
    id: item.id,
    slug: item.slug,
    title: localizedFromJson(item.title),
    summary: localizedFromJson(item.summary),
    sourceLabel: item.sourceName,
    sourceUrl: item.sourceUrl ?? undefined,
    publishedAt: item.publicationDate.toISOString(),
    confidenceLevel: item.confidenceLevel.toLowerCase() as NewsItem["confidenceLevel"],
    isMock: false,
  }
}

function faqFromDb(item: FAQWithRelations): FAQItem {
  return {
    id: item.id,
    group: item.group.toLowerCase() as FAQItem["group"],
    question: localizedFromJson(item.question),
    answer: localizedFromJson(item.answer),
    isMock: false,
  }
}

async function withListFallback<T>(
  query: () => Promise<T[]>,
  fallback: T[]
): Promise<PublicRepositoryResult<T[]>> {
  try {
    const items = await query()

    if (items.length > 0) {
      return { items, source: "database" }
    }

    return maybeFallback(fallback)
  } catch (error) {
    return maybeFallback(fallback, error)
  }
}

export async function getPublishedUpcomingLaunches() {
  const now = new Date()

  return withListFallback(
    async () => {
      const launches = await prisma.launch.findMany({
        where: {
          ...publishedLaunchWhere,
          launchDateTimeUtc: { gte: now },
        },
        include: { sourceRecords: true, timelineEvents: true, videoRecords: true },
        orderBy: { launchDateTimeUtc: "asc" },
      })

      return launches.map(launchFromDb)
    },
    publishedUpcomingMockLaunches()
  )
}

export async function getPublishedPastLaunches() {
  const now = new Date()

  return withListFallback(
    async () => {
      const launches = await prisma.launch.findMany({
        where: {
          ...publishedLaunchWhere,
          launchDateTimeUtc: { lt: now },
        },
        include: { sourceRecords: true, timelineEvents: true, videoRecords: true },
        orderBy: { launchDateTimeUtc: "desc" },
      })

      return launches.map(launchFromDb)
    },
    publishedPastMockLaunches()
  )
}

export async function getPublishedLaunchBySlug(slug: string): Promise<PublicRepositoryResult<Launch | null>> {
  try {
    const launch = await prisma.launch.findFirst({
      where: {
        ...publishedLaunchWhere,
        slug,
      },
      include: { sourceRecords: true, timelineEvents: true, videoRecords: true },
    })

    if (launch) {
      return { items: launchFromDb(launch), source: "database" }
    }

    if (devFallbackEnabled()) {
      return {
        items: mockLaunches.find((item) => item.slug === slug) ?? null,
        source: "mock_fallback",
      }
    }

    return { items: null, source: "empty" }
  } catch (error) {
    if (devFallbackEnabled()) {
      return {
        items: mockLaunches.find((item) => item.slug === slug) ?? null,
        source: "mock_fallback",
        error: error instanceof Error ? error.message : undefined,
      }
    }

    return { items: null, source: "empty" }
  }
}

export async function getFeaturedPublishedLaunch(): Promise<PublicRepositoryResult<Launch | null>> {
  try {
    const launch = await prisma.launch.findFirst({
      where: publishedLaunchWhere,
      include: { sourceRecords: true, timelineEvents: true, videoRecords: true },
      orderBy: [{ isFeatured: "desc" }, { launchDateTimeUtc: "asc" }],
    })

    if (launch) {
      return { items: launchFromDb(launch), source: "database" }
    }

    return maybeFallback(publishedUpcomingMockLaunches()[0] ?? mockLaunches[0] ?? null)
  } catch (error) {
    return maybeFallback(publishedUpcomingMockLaunches()[0] ?? mockLaunches[0] ?? null, error)
  }
}

export async function getPublishedArticles() {
  return withListFallback(
    async () => {
      const articles = await prisma.article.findMany({
        where: publishedContentWhere,
        include: { sources: true },
        orderBy: { updatedAt: "desc" },
      })

      return articles.map(articleFromDb)
    },
    mockArticles
  )
}

export async function getPublishedNews() {
  return withListFallback(
    async () => {
      const news = await prisma.newsItem.findMany({
        where: publishedContentWhere,
        include: { sources: true },
        orderBy: { publicationDate: "desc" },
      })

      return news.map(newsFromDb)
    },
    mockNews
  )
}

export async function getPublishedFAQ() {
  return withListFallback(
    async () => {
      const faqs = await prisma.fAQItem.findMany({
        where: publishedContentWhere,
        include: { sources: true },
        orderBy: [{ group: "asc" }, { sortOrder: "asc" }],
      })

      return faqs.map(faqFromDb)
    },
    mockFAQs
  )
}

export async function getLaunchCalendarItems() {
  return getPublishedUpcomingLaunches()
}

export async function getPublicHomeData() {
  try {
    const [featured, upcoming, past, articles, news, faqs] = await Promise.all([
      prisma.launch.findFirst({
        where: publishedLaunchWhere,
        include: { sourceRecords: true, timelineEvents: true, videoRecords: true },
        orderBy: [{ isFeatured: "desc" }, { launchDateTimeUtc: "asc" }],
      }),
      prisma.launch.findMany({
        where: { ...publishedLaunchWhere, launchDateTimeUtc: { gte: new Date() } },
        include: { sourceRecords: true, timelineEvents: true, videoRecords: true },
        orderBy: { launchDateTimeUtc: "asc" },
        take: 3,
      }),
      prisma.launch.findMany({
        where: { ...publishedLaunchWhere, launchDateTimeUtc: { lt: new Date() } },
        include: { sourceRecords: true, timelineEvents: true, videoRecords: true },
        orderBy: { launchDateTimeUtc: "desc" },
        take: 3,
      }),
      prisma.article.findMany({
        where: publishedContentWhere,
        include: { sources: true },
        orderBy: { updatedAt: "desc" },
        take: 2,
      }),
      prisma.newsItem.findMany({
        where: publishedContentWhere,
        include: { sources: true },
        orderBy: { publicationDate: "desc" },
        take: 3,
      }),
      prisma.fAQItem.findMany({
        where: publishedContentWhere,
        include: { sources: true },
        orderBy: [{ group: "asc" }, { sortOrder: "asc" }],
        take: 4,
      }),
    ])

    const hasAnyDbData =
      Boolean(featured) ||
      upcoming.length > 0 ||
      past.length > 0 ||
      articles.length > 0 ||
      news.length > 0 ||
      faqs.length > 0

    if (!hasAnyDbData) {
      return {
        source: devFallbackEnabled() ? "mock_fallback" : "empty",
        featured: devFallbackEnabled() ? publishedUpcomingMockLaunches()[0] ?? mockLaunches[0] ?? null : null,
        upcoming: devFallbackEnabled() ? publishedUpcomingMockLaunches().slice(0, 3) : [],
        past: devFallbackEnabled() ? publishedPastMockLaunches().slice(0, 3) : [],
        articles: devFallbackEnabled() ? mockArticles.slice(0, 2) : [],
        news: devFallbackEnabled() ? mockNews.slice(0, 3) : [],
        faqs: devFallbackEnabled() ? mockFAQs.slice(0, 4) : [],
      } as const
    }

    return {
      source: "database",
      featured: featured ? launchFromDb(featured) : upcoming[0] ? launchFromDb(upcoming[0]) : null,
      upcoming: upcoming.map(launchFromDb),
      past: past.map(launchFromDb),
      articles: articles.map(articleFromDb),
      news: news.map(newsFromDb),
      faqs: faqs.map(faqFromDb),
    } as const
  } catch {
    return {
      source: devFallbackEnabled() ? "mock_fallback" : "empty",
      featured: devFallbackEnabled() ? publishedUpcomingMockLaunches()[0] ?? mockLaunches[0] ?? null : null,
      upcoming: devFallbackEnabled() ? publishedUpcomingMockLaunches().slice(0, 3) : [],
      past: devFallbackEnabled() ? publishedPastMockLaunches().slice(0, 3) : [],
      articles: devFallbackEnabled() ? mockArticles.slice(0, 2) : [],
      news: devFallbackEnabled() ? mockNews.slice(0, 3) : [],
      faqs: devFallbackEnabled() ? mockFAQs.slice(0, 4) : [],
    } as const
  }
}

import "dotenv/config";
import { PrismaClient } from "@prisma/client"

import { hashPassword } from "../lib/admin/password"

const prisma = new PrismaClient()
const dryRun = process.argv.includes("--dry-run")

const localized = (en: string, ru = en) => ({ en, ru })

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase()
  const adminName = process.env.ADMIN_NAME ?? "Dev Admin"
  const adminPassword = process.env.ADMIN_PASSWORD

  const summary = {
    adminEmail: adminEmail ?? "not set",
    adminPasswordConfigured: Boolean(adminPassword),
    launches: 3,
    timelineEvents: 6,
    articles: 1,
    news: 1,
    faqs: 3,
    sources: 3,
    aiDrafts: 1,
  }

  if (dryRun) {
    console.log(JSON.stringify({ dryRun: true, summary }, null, 2))
    return
  }

  const aiModerator = await prisma.adminUser.upsert({
    where: { id: "ai-moderator" },
      update: { name: "AI Moderator", role: "AI_MODERATOR", status: "ACTIVE", isHuman: false },
    create: {
      id: "ai-moderator",
      name: "AI Moderator",
      role: "AI_MODERATOR",
      status: "ACTIVE",
      isHuman: false,
    },
  })

  let admin = null

  if (adminEmail) {
    admin = await prisma.adminUser.upsert({
      where: { email: adminEmail },
      update: {
        name: adminName,
        role: "ADMIN",
        status: "ACTIVE",
        passwordHash: adminPassword ? hashPassword(adminPassword) : undefined,
      },
      create: {
        email: adminEmail,
        name: adminName,
        role: "ADMIN",
        status: "ACTIVE",
        isHuman: true,
        passwordHash: adminPassword ? hashPassword(adminPassword) : undefined,
      },
    })
  }

  const launches = [
    {
      id: "seed-launch-falcon9-starlink",
      slug: "seed-falcon9-starlink",
      missionName: localized("Falcon 9 Starlink seed mission", "Falcon 9 Starlink seed mission"),
      rocket: { id: "falcon-9", name: "Falcon 9", family: "falcon_9" },
      launchPad: {
        id: "scl-40",
        name: "SLC-40",
        location: localized("Cape Canaveral Space Force Station", "Cape Canaveral Space Force Station"),
      },
      launchDateTimeUtc: new Date("2026-07-10T02:14:00.000Z"),
      status: "SCHEDULED" as const,
      confidenceLevel: "ESTIMATED" as const,
    },
    {
      id: "seed-launch-starship-test",
      slug: "seed-starship-test",
      missionName: localized("Starship test seed mission", "Starship test seed mission"),
      rocket: { id: "starship", name: "Starship", family: "starship" },
      launchPad: {
        id: "starbase",
        name: "Starbase",
        location: localized("Boca Chica, Texas", "Boca Chica, Texas"),
      },
      launchDateTimeUtc: new Date("2026-08-21T13:30:00.000Z"),
      status: "SCHEDULED" as const,
      confidenceLevel: "ESTIMATED" as const,
    },
    {
      id: "seed-launch-crew-dragon",
      slug: "seed-crew-dragon",
      missionName: localized("Crew Dragon seed mission", "Crew Dragon seed mission"),
      rocket: { id: "falcon-9", name: "Falcon 9 / Dragon", family: "dragon_crew" },
      launchPad: {
        id: "lc-39a",
        name: "LC-39A",
        location: localized("Kennedy Space Center", "Kennedy Space Center"),
      },
      launchDateTimeUtc: new Date("2026-09-14T18:45:00.000Z"),
      status: "DELAYED" as const,
      confidenceLevel: "ESTIMATED" as const,
    },
  ]

  for (const launch of launches) {
    await prisma.launch.upsert({
      where: { id: launch.id },
      update: {
        slug: launch.slug,
        missionName: launch.missionName,
        launchDateTimeUtc: launch.launchDateTimeUtc,
        status: launch.status,
        confidenceLevel: launch.confidenceLevel,
      },
      create: {
        id: launch.id,
        sourceLaunchId: launch.id,
        slug: launch.slug,
        missionName: launch.missionName,
        contentTitle: launch.missionName,
        contentDescription: localized("Seed launch draft. Not official data."),
        seoTitle: launch.missionName,
        metaDescription: localized("Seed launch metadata. Not official data."),
        rocket: launch.rocket,
        launchPad: launch.launchPad,
        launchDateTimeUtc: launch.launchDateTimeUtc,
        localTimeDisplayHelper: "Render viewer-local time from UTC.",
        trajectory: localized("Seed trajectory placeholder."),
        payload: localized("Seed payload placeholder."),
        missionDescription: localized("Seed mission description. Not official data."),
        confidenceLevel: launch.confidenceLevel,
        status: launch.status,
        publishStatus: "DRAFT",
        isMock: true,
      },
    })
  }

  const timelineEvents = [
    ["seed-event-f9-liftoff", "seed-launch-falcon9-starlink", "LIFTOFF", "T+00:00", "Liftoff"],
    ["seed-event-f9-maxq", "seed-launch-falcon9-starlink", "MAX_Q", "T+01:12", "Max Q"],
    ["seed-event-starship-liftoff", "seed-launch-starship-test", "LIFTOFF", "T+00:00", "Liftoff"],
    ["seed-event-starship-sep", "seed-launch-starship-test", "STAGE_SEPARATION", "T+02:45", "Stage separation"],
    ["seed-event-crew-liftoff", "seed-launch-crew-dragon", "LIFTOFF", "T+00:00", "Liftoff"],
    ["seed-event-crew-seco", "seed-launch-crew-dragon", "SECO", "T+08:40", "SECO"],
  ] as const

  for (const [id, launchId, type, relativeTime, title] of timelineEvents) {
    await prisma.missionTimelineEvent.upsert({
      where: { id },
      update: { relativeTime, type },
      create: {
        id,
        launchId,
        type,
        relativeTime,
        title: localized(title),
        description: localized(`${title} seed event. Planned/estimated only.`),
        status: "ESTIMATED",
        confidenceLevel: "ESTIMATED",
      },
    })
  }

  await prisma.article.upsert({
    where: { slug: "seed-launch-timeline-guide" },
    update: { title: localized("Seed launch timeline guide") },
    create: {
      id: "seed-article-timeline",
      slug: "seed-launch-timeline-guide",
      title: localized("Seed launch timeline guide"),
      body: localized("Seed article body. Editorial review required."),
      seoTitle: localized("Seed launch timeline guide"),
      metaDescription: localized("Seed article metadata."),
      category: "mission-guide",
    },
  })

  await prisma.newsItem.upsert({
    where: { slug: "seed-admin-news" },
    update: { title: localized("Seed admin news") },
    create: {
      id: "seed-news-admin",
      slug: "seed-admin-news",
      title: localized("Seed admin news"),
      summary: localized("Seed news summary. Source verification required."),
      sourceName: "Internal seed",
      publicationDate: new Date("2026-05-24T12:00:00.000Z"),
      confidenceLevel: "ESTIMATED",
    },
  })

  const faqs = [
    ["seed-faq-basics", "BASICS", "What is this platform?", "A source-aware launch platform."],
    ["seed-faq-timeline", "TIMELINE", "What is Max Q?", "Maximum aerodynamic pressure."],
    ["seed-faq-accuracy", "ACCURACY", "Are seed launches official?", "No. Seed data is placeholder data."],
  ] as const

  for (const [id, group, question, answer] of faqs) {
    await prisma.fAQItem.upsert({
      where: { id },
      update: { question: localized(question), answer: localized(answer) },
      create: {
        id,
        group,
        question: localized(question),
        answer: localized(answer),
      },
    })
  }

  const sources = [
    ["seed-source-mock", "seed-launch-falcon9-starlink", "MOCK_DATASET", "Internal seed dataset", "LOW"],
    ["seed-source-youtube", "seed-launch-starship-test", "OFFICIAL_YOUTUBE", "Official YouTube channel placeholder", "PRIMARY"],
    ["seed-source-manual", "seed-launch-crew-dragon", "OTHER", "Manual research note", "SECONDARY"],
  ] as const

  for (const [id, launchId, kind, title, trustLevel] of sources) {
    await prisma.sourceRecord.upsert({
      where: { id },
      update: { title: localized(title), trustLevel },
      create: {
        id,
        launchId,
        kind,
        title: localized(title),
        publisher: title,
        confidenceLevel: trustLevel === "PRIMARY" ? "OFFICIAL_CONFIRMED" : "ESTIMATED",
        sourceType: kind === "OFFICIAL_YOUTUBE" ? "OFFICIAL" : "MANUAL",
        trustLevel,
        isPrimary: trustLevel === "PRIMARY",
        notes: "Seed source. Replace with verified source records before publication.",
      },
    })
  }

  await prisma.aIDraft.upsert({
    where: { id: "seed-ai-draft-summary" },
    update: { status: "NEEDS_REVIEW" },
    create: {
      id: "seed-ai-draft-summary",
      type: "LAUNCH_SUMMARY",
      status: "NEEDS_REVIEW",
      createdById: aiModerator.id,
      relatedEntityType: "LAUNCH",
      relatedEntityId: "seed-launch-falcon9-starlink",
      title: localized("Seed AI launch summary"),
      content: localized("AI draft content placeholder. Human review required."),
      citations: [],
      confidenceNotes: localized("Seed draft has placeholder confidence only."),
      riskNotes: localized("Do not publish without primary source verification."),
      sourceComparison: [],
    },
  })

  if (admin) {
    await prisma.auditLog.create({
      data: {
        actorId: admin.id,
        action: "CREATE",
        entityType: "ADMIN_USER",
        entityId: admin.id,
        metadata: { seed: true, adminEmail },
      },
    })
  }

  console.log(JSON.stringify({ seeded: true, summary }, null, 2))
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
